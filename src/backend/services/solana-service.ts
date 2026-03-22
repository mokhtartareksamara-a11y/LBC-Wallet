/**
 * Solana Service — LBC Diamond Standard
 *
 * Handles SOL transfers, balance queries, Nexus Bridge LBC Credit minting,
 * retry logic, and transaction event emission.
 */

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import { EventEmitter } from 'events';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TransferResult {
  signature: TransactionSignature;
  fromAddress: string;
  toAddress: string;
  amountSol: number;
  slot: number;
  confirmedAt: Date;
}

export interface NexusBridgeMintResult {
  lbcCreditsMinted: number;
  solSpent: number;
  txSignature: TransactionSignature;
  walletAddress: string;
  mintedAt: Date;
}

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Events emitted by SolanaService */
export type SolanaServiceEvents = {
  transferInitiated: [{ from: string; to: string; amountSol: number }];
  transferConfirmed: [TransferResult];
  transferFailed: [{ error: Error; from: string; to: string; amountSol: number }];
  balanceChecked: [{ address: string; balanceSol: number }];
  lbcCreditsMinted: [NexusBridgeMintResult];
};

// ---------------------------------------------------------------------------
// SolanaService
// ---------------------------------------------------------------------------

/**
 * Production-ready Solana service for the LBC Wallet.
 * Integrates with the Nexus Bridge for LBC Credit minting.
 */
export class SolanaService extends EventEmitter {
  private readonly connection: Connection;
  /** Exchange rate: how many LBC Credits per 1 SOL */
  private readonly solToLbcRate: number;

  constructor(
    rpcUrl?: string,
    solToLbcRate: number = 100
  ) {
    super();
    const resolvedRpcUrl = rpcUrl ?? process.env.SOLANA_RPC_ENDPOINT;
    if (!resolvedRpcUrl) {
      throw new Error(
        'SOLANA_RPC_ENDPOINT environment variable is not set. ' +
        'Provide a dedicated RPC URL (e.g. from Helius, QuickNode, or Alchemy) ' +
        'to avoid public endpoint rate limiting.'
      );
    }
    this.connection = new Connection(resolvedRpcUrl, 'confirmed');
    this.solToLbcRate = solToLbcRate;
  }

  // -------------------------------------------------------------------------
  // Balance
  // -------------------------------------------------------------------------

  /**
   * Returns the SOL balance for the given wallet address.
   * @param walletAddress  Base58-encoded Solana public key
   */
  async getBalance(walletAddress: string): Promise<number> {
    const publicKey = this.parsePublicKey(walletAddress);
    const lamports = await this.withRetry(
      () => this.connection.getBalance(publicKey),
      DEFAULT_RETRY_OPTIONS
    );
    const balanceSol = lamports / LAMPORTS_PER_SOL;

    this.emit('balanceChecked', { address: walletAddress, balanceSol });
    return balanceSol;
  }

  // -------------------------------------------------------------------------
  // SOL Transfer
  // -------------------------------------------------------------------------

  /**
   * Transfers SOL from `senderKeypair` to `recipientAddress` and waits for
   * on-chain confirmation.
   *
   * @param senderKeypair   Keypair of the sending account (holds the signing key)
   * @param recipientAddress  Base58-encoded destination public key
   * @param amountSol       Amount to transfer in SOL (not lamports)
   * @param retryOptions    Optional retry configuration
   */
  async transferSol(
    senderKeypair: Keypair,
    recipientAddress: string,
    amountSol: number,
    retryOptions: RetryOptions = DEFAULT_RETRY_OPTIONS
  ): Promise<TransferResult> {
    if (amountSol <= 0) {
      throw new Error(`Transfer amount must be positive; received ${amountSol}`);
    }

    const fromAddress = senderKeypair.publicKey.toBase58();
    const toPublicKey = this.parsePublicKey(recipientAddress);
    const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);

    this.emit('transferInitiated', { from: fromAddress, to: recipientAddress, amountSol });

    try {
      const signature = await this.withRetry(async () => {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: senderKeypair.publicKey,
            toPubkey: toPublicKey,
            lamports,
          })
        );
        return sendAndConfirmTransaction(this.connection, transaction, [senderKeypair]);
      }, retryOptions);

      // Fetch the confirmed slot for the audit record
      const txInfo = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
      });
      const slot = txInfo?.slot ?? 0;

      const result: TransferResult = {
        signature,
        fromAddress,
        toAddress: recipientAddress,
        amountSol,
        slot,
        confirmedAt: new Date(),
      };

      this.emit('transferConfirmed', result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('transferFailed', { error: err, from: fromAddress, to: recipientAddress, amountSol });
      throw err;
    }
  }

  // -------------------------------------------------------------------------
  // Nexus Bridge — LBC Credit Minting
  // -------------------------------------------------------------------------

  /**
   * Burns SOL via the Nexus Bridge and mints the equivalent amount of
   * LBC Credits into the user's internal ledger.
   *
   * @param senderKeypair   Keypair of the wallet funding the mint
   * @param bridgeAddress   On-chain Nexus Bridge program/vault address
   * @param solAmount       Amount of SOL to exchange for LBC Credits
   */
  async mintLbcCreditsViaNexusBridge(
    senderKeypair: Keypair,
    bridgeAddress: string,
    solAmount: number
  ): Promise<NexusBridgeMintResult> {
    if (solAmount <= 0) {
      throw new Error(`SOL amount must be positive; received ${solAmount}`);
    }

    // Transfer SOL to the bridge vault
    const transferResult = await this.transferSol(senderKeypair, bridgeAddress, solAmount);

    // Calculate LBC Credits minted at current exchange rate
    const lbcCreditsMinted = solAmount * this.solToLbcRate;

    const mintResult: NexusBridgeMintResult = {
      lbcCreditsMinted,
      solSpent: solAmount,
      txSignature: transferResult.signature,
      walletAddress: senderKeypair.publicKey.toBase58(),
      mintedAt: new Date(),
    };

    this.emit('lbcCreditsMinted', mintResult);
    return mintResult;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /**
   * Parses a Base58 public key string and throws a descriptive error on
   * invalid input to prevent downstream confusion.
   */
  private parsePublicKey(address: string): PublicKey {
    try {
      return new PublicKey(address);
    } catch {
      throw new Error(`Invalid Solana address: "${address}"`);
    }
  }

  /**
   * Retries an async operation with exponential back-off.
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = options.delayMs;

    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < options.maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= options.backoffMultiplier;
        }
      }
    }

    throw lastError ?? new Error('Operation failed after maximum retry attempts');
  }
}
