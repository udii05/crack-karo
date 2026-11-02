/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  distDir: process.env.NEXT_DIST_DIR || '.next',
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
};

module.exports = nextConfig;

