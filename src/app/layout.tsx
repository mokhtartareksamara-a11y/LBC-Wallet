import React from 'react';
import { ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletProvider, WalletModalProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { ThemeProvider } from 'styled-components';
import { ObsidianLuxuryTheme } from 'your-theme-library'; // Adjust the import based on your theme library

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const network = 'mainnet-beta'; // or your preferred network
    const endpoint = `https://api.solana.com`; // Adjust based on your needs

    const wallets = [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter({ network }),
    ];

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <ThemeProvider theme={ObsidianLuxuryTheme}>
                        {children}
                    </ThemeProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default AppLayout;
