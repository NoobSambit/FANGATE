'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { Trophy, XCircle, ExternalLink } from 'lucide-react';

export default function SuccessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const passed = searchParams.get('passed') === 'true';
  const score = searchParams.get('score');
  const verificationId = searchParams.get('verificationId');

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (typeof window !== 'undefined') {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
  }, [status, router]);

  useEffect(() => {
    if (passed && verificationId) {
      generateToken();
    }
  }, [passed, verificationId]);

  const generateToken = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId }),
      });

      const data = await res.json();
      if (data.token) {
        setToken(data.token);
      }
    } catch (error) {
      console.error('Token generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = () => {
    const redirectUrl = process.env.NEXT_PUBLIC_TICKET_REDIRECT_URL || '/';
    window.location.href = `${redirectUrl}?token=${token}`;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#16003b]">
        <div className="text-2xl text-purple-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#16003b] py-12">
      {passed && windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          {passed ? (
            <>
              <div className="mb-8">
                <div className="w-24 h-24 gradient-purple rounded-full flex items-center justify-center mx-auto mb-6 glow-purple">
                  <Trophy size={48} />
                </div>
                <h1 className="text-5xl font-bold mb-4">
                  <span className="gradient-purple bg-clip-text text-transparent">
                    You're a Verified ARMY!
                  </span>
                </h1>
                <p className="text-xl text-gray-300">
                  Congratulations! You scored {score}/10 on the quiz
                </p>
              </div>

              <div className="glass-effect p-8 rounded-2xl mb-8">
                <h2 className="text-2xl font-semibold mb-4">Your Access Token</h2>
                {loading ? (
                  <div className="text-purple-400">Generating token...</div>
                ) : token ? (
                  <>
                    <div className="bg-black/30 p-4 rounded-lg mb-6 break-all font-mono text-sm">
                      {token}
                    </div>
                    <p className="text-sm text-gray-400 mb-6">
                      This token expires in 10 minutes. Click below to access the ticket sale page.
                    </p>
                    <button
                      onClick={handleRedirect}
                      className="gradient-purple px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all inline-flex items-center gap-2"
                    >
                      Access Ticket Sale
                      <ExternalLink size={20} />
                    </button>
                  </>
                ) : (
                  <div className="text-red-400">Failed to generate token</div>
                )}
              </div>

              <div className="text-sm text-gray-500">
                Thank you for being a true ARMY member! 💜
              </div>
            </>
          ) : (
            <>
              <div className="mb-8">
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-500">
                  <XCircle size={48} className="text-red-400" />
                </div>
                <h1 className="text-5xl font-bold mb-4 text-red-400">
                  Quiz Not Passed
                </h1>
                <p className="text-xl text-gray-300">
                  You scored {score}/10 (minimum 7 required)
                </p>
              </div>

              <div className="glass-effect p-8 rounded-2xl">
                <p className="text-gray-300 mb-4">
                  Don't worry! You can try again after listening to more BTS music and learning more about the group.
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="gradient-purple px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all"
                >
                  Back to Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
