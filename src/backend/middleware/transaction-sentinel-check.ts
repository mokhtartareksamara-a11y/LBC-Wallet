/**
 * Transaction Sentinel Check — LBC Diamond Standard
 *
 * Middleware that monitors all transactions for amounts ≥ $5,000 USD,
 * triggers founder approval workflows, and maintains a full audit trail.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Represents the parsed JWT payload for authenticated requests */
export interface AuthenticatedUser {
  userId: string;
  walletAddress: string;
  role: 'user' | 'founder' | 'admin';
}

/** Shape of a pending high-value approval request stored in the ledger */
export interface ApprovalRequest {
  id: string;
  transactionId: string;
  requestedBy: string;
  walletAddress: string;
  amountUsd: number;
  currency: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  auditLog: AuditEntry[];
}

/** Immutable audit log entry attached to every approval request */
export interface AuditEntry {
  timestamp: Date;
  actor: string;
  action: string;
  details: Record<string, unknown>;
}

/** In-memory store for approval requests (replace with a DB in production) */
export interface ApprovalStore {
  create(request: ApprovalRequest): Promise<void>;
  findById(id: string): Promise<ApprovalRequest | undefined>;
  update(id: string, patch: Partial<ApprovalRequest>): Promise<void>;
}

/** Notification channel injected via dependency injection */
export interface FounderNotifier {
  sendAlert(request: ApprovalRequest): Promise<void>;
}

// ---------------------------------------------------------------------------
// Defaults / constants
// ---------------------------------------------------------------------------

const HIGH_VALUE_THRESHOLD_USD = 5_000;
const APPROVAL_TTL_MS = 24 * 60 * 60 * 1_000; // 24 hours

// ---------------------------------------------------------------------------
// In-memory approval store (suitable for development / testing)
// ---------------------------------------------------------------------------

/** Simple in-memory implementation of ApprovalStore */
export class InMemoryApprovalStore implements ApprovalStore {
  private readonly store = new Map<string, ApprovalRequest>();

  async create(request: ApprovalRequest): Promise<void> {
    this.store.set(request.id, request);
  }

  async findById(id: string): Promise<ApprovalRequest | undefined> {
    return this.store.get(id);
  }

  async update(id: string, patch: Partial<ApprovalRequest>): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`Approval request ${id} not found`);
    }
    this.store.set(id, { ...existing, ...patch });
  }

  /** Expose the full store for testing purposes */
  all(): ApprovalRequest[] {
    return Array.from(this.store.values());
  }
}

// ---------------------------------------------------------------------------
// Console-based founder notifier (replace with email/push/WS in production)
// ---------------------------------------------------------------------------

export class ConsoleFounderNotifier implements FounderNotifier {
  async sendAlert(request: ApprovalRequest): Promise<void> {
    console.log(
      `[SENTINEL] 🔔 Founder alert — high-value transaction requires approval:`,
      JSON.stringify({
        approvalId: request.id,
        transactionId: request.transactionId,
        requestedBy: request.requestedBy,
        amountUsd: request.amountUsd,
        expiresAt: request.expiresAt,
      })
    );
  }
}

// ---------------------------------------------------------------------------
// TransactionSentinel
// ---------------------------------------------------------------------------

/**
 * Creates a Next.js API middleware function that intercepts any transaction
 * request with an amount ≥ $5,000 USD and initiates the Founder approval
 * workflow before allowing the request to proceed.
 *
 * Usage in a Next.js API route:
 *
 * ```ts
 * import { createSentinelMiddleware } from '@/backend/middleware/transaction-sentinel-check';
 *
 * const sentinel = createSentinelMiddleware();
 *
 * export default async function handler(req, res) {
 *   await sentinel(req, res, async () => {
 *     // proceed with transaction logic
 *   });
 * }
 * ```
 */
export function createSentinelMiddleware(
  store: ApprovalStore = new InMemoryApprovalStore(),
  notifier: FounderNotifier = new ConsoleFounderNotifier(),
  thresholdUsd: number = HIGH_VALUE_THRESHOLD_USD
) {
  return async function transactionSentinelCheck(
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => Promise<void>
  ): Promise<void> {
    // ------------------------------------------------------------------
    // 1. JWT authentication — validate the bearer token
    // ------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or malformed Authorization header' });
      return;
    }

    const token = authHeader.slice(7);
    let user: AuthenticatedUser;
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET environment variable is not configured');
      }
      user = jwt.verify(token, secret) as AuthenticatedUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid token';
      res.status(401).json({ error: `Authentication failed: ${message}` });
      return;
    }

    // ------------------------------------------------------------------
    // 2. Extract and validate transaction amount from request body
    // ------------------------------------------------------------------
    const body = req.body as Record<string, unknown> | undefined;
    const amountUsd = typeof body?.amountUsd === 'number' ? body.amountUsd : 0;
    const transactionId =
      typeof body?.transactionId === 'string'
        ? body.transactionId
        : `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Sanitise description: truncate, strip HTML-significant chars and control characters
    const rawDescription = typeof body?.description === 'string' ? body.description : '';
    const description = rawDescription
      .slice(0, 500)
      .replace(/[<>"'`]/g, '')
      .replace(/[\x00-\x1f\x7f]/g, '')
      .trim();

    // ------------------------------------------------------------------
    // 3. High-value check
    // ------------------------------------------------------------------
    if (amountUsd >= thresholdUsd) {
      const approvalId = generateApprovalId();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + APPROVAL_TTL_MS);

      const approvalRequest: ApprovalRequest = {
        id: approvalId,
        transactionId,
        requestedBy: user.userId,
        walletAddress: user.walletAddress,
        amountUsd,
        currency: typeof body?.currency === 'string' ? body.currency : 'USD',
        description,
        status: 'pending',
        createdAt: now,
        expiresAt,
        auditLog: [
          {
            timestamp: now,
            actor: user.userId,
            action: 'approval_requested',
            details: {
              amountUsd,
              transactionId,
              threshold: thresholdUsd,
              ip: getClientIp(req),
              userAgent: req.headers['user-agent'] ?? 'unknown',
            },
          },
        ],
      };

      // Persist and notify founder
      await store.create(approvalRequest);
      await notifier.sendAlert(approvalRequest);

      // Log audit event to console (replace with structured logger in production)
      logAuditEvent('high_value_transaction_flagged', {
        approvalId,
        transactionId,
        userId: user.userId,
        amountUsd,
        thresholdUsd,
      });

      // Respond to the client: the transaction is pending founder approval
      res.status(202).json({
        message: 'Transaction requires Founder approval',
        approvalId,
        status: 'pending',
        expiresAt: expiresAt.toISOString(),
        thresholdUsd,
      });
      return;
    }

    // ------------------------------------------------------------------
    // 4. Below threshold — proceed normally
    // ------------------------------------------------------------------
    await next();
  };
}

// ---------------------------------------------------------------------------
// Approval resolution endpoint helper
// ---------------------------------------------------------------------------

/**
 * Resolves a pending approval request.  Call this from a Founder-only API
 * route to approve or reject a high-value transaction.
 */
export async function resolveApproval(
  store: ApprovalStore,
  approvalId: string,
  founder: AuthenticatedUser,
  decision: 'approved' | 'rejected'
): Promise<ApprovalRequest> {
  if (founder.role !== 'founder' && founder.role !== 'admin') {
    throw new Error('Only Founder or Admin may resolve approval requests');
  }

  const request = await store.findById(approvalId);
  if (!request) {
    throw new Error(`Approval request ${approvalId} not found`);
  }
  if (request.status !== 'pending') {
    throw new Error(`Approval request ${approvalId} is already ${request.status}`);
  }
  if (new Date() > request.expiresAt) {
    await store.update(approvalId, { status: 'expired' });
    throw new Error(`Approval request ${approvalId} has expired`);
  }

  const now = new Date();
  const auditEntry: AuditEntry = {
    timestamp: now,
    actor: founder.userId,
    action: decision,
    details: { founderId: founder.userId, decision },
  };

  await store.update(approvalId, {
    status: decision,
    resolvedAt: now,
    resolvedBy: founder.userId,
    auditLog: [...request.auditLog, auditEntry],
  });

  logAuditEvent('approval_resolved', {
    approvalId,
    decision,
    resolvedBy: founder.userId,
    transactionId: request.transactionId,
  });

  const updated = await store.findById(approvalId);
  if (!updated) {
    throw new Error(`Failed to retrieve updated approval request ${approvalId}`);
  }
  return updated;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function generateApprovalId(): string {
  return `approval_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress ?? 'unknown';
}

function logAuditEvent(event: string, data: Record<string, unknown>): void {
  console.log(
    `[AUDIT] ${new Date().toISOString()} | ${event} |`,
    JSON.stringify(data)
  );
}
