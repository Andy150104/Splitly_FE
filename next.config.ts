import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  headers() {
    return [
      {
        source: '/login',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          {
            key: 'Referrer-Policy',
            value:
              process.env.NODE_ENV === 'development'
                ? 'no-referrer-when-downgrade'
                : 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
