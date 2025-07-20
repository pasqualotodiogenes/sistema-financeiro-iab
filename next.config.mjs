/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal config for fastest build
  compress: true,
  poweredByHeader: false,
  
  // Force Node.js runtime for API routes (required for SQLite + Turso)
  serverExternalPackages: ['better-sqlite3', '@libsql/client'],
}

export default nextConfig
