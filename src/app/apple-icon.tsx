import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
          borderRadius: '40px',
        }}
      >
        {/* Rewind symbol */}
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          fill="none"
        >
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <g transform="translate(50, 50)">
            <polygon points="-10,-25 -10,25 -35,0" fill="url(#grad)" opacity="0.6" />
            <polygon points="12,-25 12,25 -13,0" fill="url(#grad)" />
            <polygon points="35,-25 35,25 10,0" fill="url(#grad)" opacity="0.6" />
          </g>
        </svg>
      </div>
    ),
    { ...size }
  )
}
