import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://fangate.army';

const logoUrl =
  'https://res.cloudinary.com/dtamgk7i5/image/upload/v1762777066/fangate_hrnkge.png';

export async function GET(_req: NextRequest) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background:
            'radial-gradient(circle at 20% 20%, rgba(168,85,247,0.35), transparent 45%), radial-gradient(circle at 80% 30%, rgba(236,72,153,0.35), transparent 40%), #0b0616',
          color: '#f8f5ff',
          fontFamily: 'Inter, Segoe UI, Helvetica Neue, Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 48,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 32,
            }}
          >
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: 28,
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 22px 50px rgba(168,85,247,0.35)',
              }}
            >
              <img
                src={logoUrl}
                alt="FanGate logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  letterSpacing: '-1px',
                }}
              >
                FanGate
              </span>
              <span
                style={{
                  fontSize: 26,
                  color: 'rgba(236, 233, 255, 0.75)',
                }}
              >
                BTS Fan Verification Portal
              </span>
            </div>
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: '#d6c7ff',
            }}
          >
            Creator: @Boy_With_Code
          </div>
        </div>

        <div style={{ marginTop: 32, maxWidth: 880 }}>
          <p
            style={{
              fontSize: 70,
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            Verify your ARMY status to unlock exclusive BTS concert tickets.
          </p>
          <p
            style={{
              fontSize: 30,
              color: 'rgba(229,225,255,0.78)',
              lineHeight: 1.4,
              maxWidth: 760,
            }}
          >
            Spotify listening analysis + ARMY quiz. Earn your spot, grab your
            token, flex your dedication.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background:
              'linear-gradient(135deg, rgba(168,85,247,0.35), rgba(236,72,153,0.35))',
            padding: '26px 32px',
            borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: 22,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'rgba(248,245,255,0.8)',
              }}
            >
              Combined Scoring
            </span>
            <div
              style={{
                display: 'flex',
                gap: 28,
                fontSize: 30,
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
              padding: '14px 26px',
              borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.35)',
              fontSize: 24,
              fontWeight: 600,
              color: '#f5f3ff',
              background: 'rgba(11,6,22,0.45)',
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


