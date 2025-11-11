import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

// Use nodejs runtime for better compatibility with image processing
export const runtime = 'nodejs';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://fangate.army';

const logoRemoteUrl =
  'https://res.cloudinary.com/dtamgk7i5/image/upload/v1762777066/fangate_hrnkge.png';

export async function GET(_req: NextRequest) {
  // Fetch logo - consider optimizing by using a smaller image or data URL
  const logoImage = await fetch(logoRemoteUrl).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 88px 66px 88px',
          // Simple linear gradient - more memory efficient than complex radial gradients
          background: 'linear-gradient(135deg, #0a0516 0%, #1a0d2e 100%)',
          color: '#f6f3ff',
          fontFamily: 'system-ui, -apple-system, sans-serif', // System fonts - no download needed
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 28,
            }}
          >
              <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 32,
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.25)',
                // Simplified shadow to reduce rendering complexity
                boxShadow: '0 10px 30px rgba(168,85,247,0.3)',
              }}
            >
              <img
                src={logoImage as unknown as string}
                alt="FanGate logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 56,
                  fontWeight: 900,
                  letterSpacing: '-1.4px',
                }}
              >
                FanGate
              </span>
              <span
                style={{
                  fontSize: 28,
                  color: 'rgba(233, 228, 255, 0.75)',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                BTS Fan Verification
              </span>
            </div>
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: '#d9ccff',
            }}
          >
            Creator: @Boy_With_Code
          </div>
        </div>

        <div style={{ marginTop: 36, maxWidth: 900 }}>
          <p
            style={{
              fontSize: 74,
              fontWeight: 900,
              lineHeight: 1.08,
              marginBottom: 28,
              letterSpacing: '-1.8px',
            }}
          >
            Unlock the BTS concert ticket drop by proving you’re a real ARMY.
          </p>
          <p
            style={{
              fontSize: 32,
              color: 'rgba(232,228,255,0.82)',
              lineHeight: 1.45,
              maxWidth: 780,
            }}
          >
            Spotify listening analysis + 10-question ARMY quiz. Stream hard,
            ace the trivia, score 70+, and secure your ticket access token.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background:
              'linear-gradient(135deg, rgba(168,85,247,0.38), rgba(236,72,153,0.33))',
            padding: '28px 34px',
            borderRadius: 32,
            border: '1px solid rgba(255,255,255,0.28)',
            // Simplified shadow
            boxShadow: '0 8px 24px rgba(168,85,247,0.25)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: 22,
                textTransform: 'uppercase',
                letterSpacing: '0.22em',
                color: 'rgba(246,242,255,0.78)',
              }}
            >
              Combined Scoring
            </span>
            <div
              style={{
                display: 'flex',
                gap: 30,
                fontSize: 32,
                fontWeight: 700,
              }}
            >
              <span>
                Spotify · <span style={{ color: '#c4b5fd' }}>40%</span>
              </span>
              <span>
                Quiz · <span style={{ color: '#f9a8d4' }}>60%</span>
              </span>
              <span>
                Pass · <span style={{ color: '#bbf7d0' }}>70+</span>
              </span>
            </div>
          </div>
          <div
            style={{
              padding: '16px 30px',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.45)',
              fontSize: 26,
              fontWeight: 600,
              color: '#f5f3ff',
              background: 'rgba(11,6,22,0.55)',
            }}
          >
            {siteUrl.replace(/^https?:\/\//, '')}
          </div>
        </div>
      </div>
    ),
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
    }
  );
}


