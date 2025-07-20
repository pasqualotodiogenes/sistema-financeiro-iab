/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal config for fastest build
  compress: true,
  poweredByHeader: false,
  
  // Force Node.js runtime for API routes (required for SQLite)
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
}

export default nextConfig
