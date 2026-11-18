/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // the crawler's snapshot is read from disk at runtime, so it has to ship with the server
  experimental: { outputFileTracingIncludes: { '/**/*': ['./data/inventory.json.gz'] } },
}

module.exports = nextConfig
