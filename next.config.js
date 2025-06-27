/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true, // Enable App Router
  },
  images: {
    remotePatterns: [
      {
        hostname: "www.google.com",
      },
    ],
  },
};

module.exports = nextConfig;
