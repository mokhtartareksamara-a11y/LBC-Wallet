import React from 'react';

const Page = () => {
  const handleConnectWallet = () => {
    // Logic to connect wallet
  };

  return (
    <div style={{
      backgroundColor: '#000',
      color: '#EAEAEA',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#8ED5D9' }}>Welcome to Obsidian Gateway</h1>
      <button onClick={handleConnectWallet} style={{
        backgroundColor: '#8ED5D9',
        color: '#000',
        border: 'none',
        borderRadius: '5px',
        padding: '10px 20px',
        cursor: 'pointer',
        margin: '20px 0'
      }}>
        Connect Wallet
      </button>
      <div style={{ margin: '20px 0' }}>
        <h2 style={{ color: '#EAEAEA' }}>Our Three Pillars</h2>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          <li style={{ padding: '10px 0' }}>
            <h3 style={{ color: '#8ED5D9' }}>🌐 Digital Forge</h3>
            <p style={{ color: '#EAEAEA' }}>Empowering creators with advanced digital tools.</p>
          </li>
          <li style={{ padding: '10px 0' }}>
            <h3 style={{ color: '#8ED5D9' }}>✈️ Travel AI</h3>
            <p style={{ color: '#EAEAEA' }}>AI-driven travel solutions tailored just for you.</p>
          </li>
          <li style={{ padding: '10px 0' }}>
            <h3 style={{ color: '#8ED5D9' }}>🚀 Zero-Gas Transactions</h3>
            <p style={{ color: '#EAEAEA' }}>Experience effortless transactions without the usual fees.</p>
          </li>
        </ul>
      </div>
      <div id="aegisIdentityCard" style={{ display: 'none', margin: '20px 0' }}>
        <h2 style={{ color: '#8ED5D9' }}>Aegis Identity Card</h2>
        {/* Display the Aegis Identity card details here */}
      </div>
    </div>
  );
};

export default Page;