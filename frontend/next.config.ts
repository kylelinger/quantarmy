import type { NextConfig } from 'next'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const nextConfig: NextConfig = {
  // Only proxy to external backend when API_URL is set (local dev with Python backend)
  ...(API_URL
    ? {
        async rewrites() {
          return [
            { source: '/api/:path*', destination: `${API_URL}/api/:path*` },
            { source: '/ws/:path*', destination: `${API_URL}/ws/:path*` },
          ]
        },
      }
    : {}),
}

export default nextConfig
