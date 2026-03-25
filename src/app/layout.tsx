import React from 'react';

const AppLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
    const network = 'mainnet-beta'; // or your preferred network
    const endpoint = `https://api.solana.com`; // Adjust based on your needs

    return (
        <div>
            {children}
        </div>
    );
};

export default AppLayout;
