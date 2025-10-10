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
};

export default nextConfig;