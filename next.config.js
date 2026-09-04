/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // BullMQ and ioredis are server-only and only used in API routes.
  // BullMQ's ESM build references an optional dependency
  // (@valkey/valkey-glide) that isn't installed and doesn't need to be -
  // it's only required if you opt into that specific Redis client. Next's
  // bundler tries to statically resolve it anyway and fails the build.
  // Marking these as external server packages tells Next to require them
  // normally at runtime instead of bundling them, which sidesteps the
  // issue entirely.
  experimental: {
    serverComponentsExternalPackages: ["bullmq", "ioredis"],
  },
};

module.exports = nextConfig;