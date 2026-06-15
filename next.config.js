/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Dockerfile / Fly.io deploy
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'a.ltrbxd.com' },
      { protocol: 'https', hostname: '*.letterboxd.com' },
    ],
  },
};

module.exports = nextConfig;
