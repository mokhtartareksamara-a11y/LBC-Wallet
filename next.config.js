/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    // Use remotePatterns instead of the broader `domains` list to restrict
    // which remote images the Image Optimizer will process.
    // This limits the attack surface for GHSA-9g9p-9gw9-jx7f.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lbchub.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'terryfoxauto.com',
        pathname: '/**',
      },
    ],
  },
  // Add more configurations as needed
};

module.exports = nextConfig;
