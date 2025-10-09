/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      // Serve existing static landing page at /
      {
        source: '/',
        destination: '/landing.html',
      },
      // If you want static shop instead of dynamic app route, re-enable below
      // { source: '/shop', destination: '/shop.html' },
      // Serve cart page
      {
        source: '/cart',
        destination: '/cart.html',
      },
      // Serve checkout pages
      {
        source: '/checkout',
        destination: '/checkout.html',
      },
      
      // FAQ and Support
      {
        source: '/faq',
        destination: '/faq.html',
      },
      {
        source: '/support',
        destination: '/support.html',
      },
    ];
  },
};

export default nextConfig;