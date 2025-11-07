'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Music, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function VerificationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleVerification = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setResult(data);

      if (data.canTakeQuiz) {
        setTimeout(() => {
          router.push(`/quiz?verificationId=${data.verificationId}`);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              <span className="gradient-purple bg-clip-text text-transparent">
                Fan Verification
              </span>
            </h1>
            <p className="text-gray-300">
              We&apos;ll analyze your Spotify listening history to calculate your BTS fan score
            </p>
          </div>

          {!result && (
            <div className="glass-effect p-8 rounded-2xl">
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <Music className="text-purple-400 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Top Artists Analysis</h3>
                    <p className="text-gray-400 text-sm">
                      +50 points if BTS is in your top artists
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <TrendingUp className="text-purple-400 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Solo Member Recognition</h3>
                    <p className="text-gray-400 text-sm">
                      +20 points per BTS solo artist in your top list
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="text-purple-400 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Recent Listening</h3>
                    <p className="text-gray-400 text-sm">
                      +30 points for BTS tracks in your recent plays
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <CheckCircle className="text-purple-400 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Account Age</h3>
                    <p className="text-gray-400 text-sm">
                      +10 points if your account is over 60 days old
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleVerification}
                disabled={loading}
                className="w-full gradient-purple py-4 rounded-xl text-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Start Verification'}
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                  {error}
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="glass-effect p-8 rounded-2xl text-center">
              <div className="mb-6">
                <div className="text-6xl font-bold gradient-purple bg-clip-text text-transparent mb-2">
                  {result.fanScore}
                </div>
                <div className="text-gray-300">Fan Score</div>
              </div>

              {result.canTakeQuiz ? (
                <div>
                  <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <p className="text-green-200 font-semibold">
                      ✅ Great! You passed the listening analysis
                    </p>
                    <p className="text-green-300 text-sm mt-1">
                      Redirecting to the quiz...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-200 font-semibold">
                    ❌ Score too low (minimum 70 required)
                  </p>
                  <p className="text-red-300 text-sm mt-1">
                    Listen to more BTS music and try again later!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
