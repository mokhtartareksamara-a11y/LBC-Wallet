import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LBC Wallet',
  description: 'High-performance hybrid cryptographic gateway for the LBC Hub ecosystem',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
