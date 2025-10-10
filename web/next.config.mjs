/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    // All static HTML pages have been migrated to the App Router.
    // Keep rewrites empty; reintroduce conditionally if needed in the future.
    return [];
  },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/cart.html', destination: '/cart', permanent: true },
      { source: '/checkout.html', destination: '/checkout', permanent: true },
      { source: '/faq.html', destination: '/faq', permanent: true },
      { source: '/support.html', destination: '/support', permanent: true },
    ];
  },
};

export default nextConfig;