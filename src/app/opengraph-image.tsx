import { ImageResponse } from 'next/og'

export const alt = 'Git Rewind - Your Year in Code'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Decorative gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          {/* Logo text */}
          <h1
            style={{
              fontSize: '96px',
              fontWeight: 800,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '-0.02em',
              textShadow: '0 4px 30px rgba(99, 102, 241, 0.5)',
            }}
          >
            Git Rewind
          </h1>

          {/* Tagline */}
          <p
            style={{
              fontSize: '36px',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '20px 0 0 0',
              fontWeight: 500,
            }}
          >
            Your year in code, beautifully told
          </p>

          {/* Feature pills */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '40px',
            }}
          >
            {['Privacy-First', 'Read-Only Access', 'No Data Stored'].map((feature) => (
              <div
                key={feature}
                style={{
                  padding: '12px 24px',
                  borderRadius: '100px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '18px',
                  fontWeight: 500,
                }}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* GitHub contribution graph hint */}
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            display: 'flex',
            gap: '4px',
          }}
        >
          {Array.from({ length: 52 }).map((_, weekIndex) => (
            <div
              key={weekIndex}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const intensity = Math.random()
                const color = intensity > 0.7
                  ? 'rgba(99, 102, 241, 0.8)'
                  : intensity > 0.4
                    ? 'rgba(99, 102, 241, 0.5)'
                    : intensity > 0.2
                      ? 'rgba(99, 102, 241, 0.3)'
                      : 'rgba(255, 255, 255, 0.1)'
                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      background: color,
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
