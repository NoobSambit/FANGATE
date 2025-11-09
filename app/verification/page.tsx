'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Music, TrendingUp, Clock, CheckCircle, ChevronRight, Trophy, XCircle, ListMusic } from 'lucide-react';

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
        console.error('Verification API error:', data);
        throw new Error(data.error || data.details || 'Verification failed');
      }

      setResult(data);
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify. Please check your connection and try again.');
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

  const handleProceedToQuiz = () => {
    if (result?.canTakeQuiz && result?.verificationId) {
      router.push(`/quiz?verificationId=${result.verificationId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#16003b] py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
              Fan Verification
            </h1>
            <p className="text-gray-300 text-lg">
              {!result 
                ? "We'll analyze your Spotify listening history to calculate your BTS fan score"
                : "Your Spotify listening analysis is complete"
              }
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
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-200 font-semibold mb-1">Error</p>
                  <p className="text-red-300 text-sm">{error}</p>
                  <p className="text-red-400 text-xs mt-2">
                    Check the browser console (F12) for more details
                  </p>
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Total Score Display */}
              <div className="glass-effect p-8 rounded-2xl text-center">
                <div className="mb-6">
                  <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 mb-2">
                    {result.fanScore}
                  </div>
                  <div className="text-gray-300 text-lg font-medium">Total Fan Score</div>
                  <div className="mt-2 text-sm text-gray-400">
                    {result.canTakeQuiz 
                      ? "✓ Minimum score of 70 achieved" 
                      : `Need ${70 - result.fanScore} more points to proceed`
                    }
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              {result.breakdown && (
                <div className="glass-effect p-8 rounded-2xl">
                  <h2 className="text-2xl font-bold text-white mb-6">Score Breakdown</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Music className="text-purple-400" size={24} />
                        <div>
                          <div className="font-semibold text-white">Top Artists Analysis</div>
                          <div className="text-sm text-gray-400">BTS in your top artists</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-purple-400">
                        +{result.breakdown.topArtists}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="text-purple-400" size={24} />
                        <div>
                          <div className="font-semibold text-white">Solo Member Recognition</div>
                          <div className="text-sm text-gray-400">
                            {result.breakdown.soloMembersCount > 0 
                              ? `${result.breakdown.soloMembersCount} BTS solo artist${result.breakdown.soloMembersCount > 1 ? 's' : ''} found`
                              : 'No BTS solo artists in top list'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-purple-400">
                        +{result.breakdown.soloMembers}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ListMusic className="text-pink-400" size={24} />
                        <div>
                          <div className="font-semibold text-white">Top Tracks</div>
                          <div className="text-sm text-gray-400">
                            {result.breakdown.topTracksCount > 0 
                              ? `${result.breakdown.topTracksCount} BTS track${result.breakdown.topTracksCount > 1 ? 's' : ''} in top list`
                              : 'No BTS tracks in top list'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-pink-400">
                        +{result.breakdown.topTracks}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="text-purple-400" size={24} />
                        <div>
                          <div className="font-semibold text-white">Recent Listening</div>
                          <div className="text-sm text-gray-400">BTS tracks in recent plays</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-purple-400">
                        +{result.breakdown.recentListening}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="text-purple-400" size={24} />
                        <div>
                          <div className="font-semibold text-white">Account Age</div>
                          <div className="text-sm text-gray-400">Account over 60 days old</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-purple-400">
                        +{result.breakdown.accountAge}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz Requirements */}
              {result.canTakeQuiz ? (
                <div className="glass-effect p-8 rounded-2xl">
                  <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="text-green-400" size={24} />
                      <p className="text-green-200 font-semibold text-lg">
                        Great! You passed the listening analysis
                      </p>
                    </div>
                    <p className="text-green-300 text-sm">
                      You can now proceed to the quiz. You need to score 70% or higher (7 out of 10 questions correct) to pass.
                    </p>
                  </div>
                  
                  <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Trophy className="text-purple-400" size={20} />
                      Quiz Requirements
                    </h3>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center justify-between">
                        <span>Total Questions:</span>
                        <span className="font-semibold text-white">10</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Required Score:</span>
                        <span className="font-semibold text-green-400">70% (7/10)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Your Fan Score:</span>
                        <span className="font-semibold text-purple-400">{result.fanScore} points</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToQuiz}
                    className="w-full group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-lg font-bold text-white overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Trophy className="relative z-10" size={24} />
                    <span className="relative z-10">Proceed to Quiz</span>
                    <ChevronRight className="relative z-10 group-hover:translate-x-1 transition-transform" size={20} />
                  </button>
                </div>
              ) : (
                <div className="glass-effect p-8 rounded-2xl">
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <XCircle className="text-red-400" size={24} />
                      <p className="text-red-200 font-semibold text-lg">
                        Score too low to proceed
                      </p>
                    </div>
                    <p className="text-red-300 text-sm">
                      You need a minimum fan score of 70 to take the quiz. You currently have {result.fanScore} points.
                    </p>
                    <p className="text-red-300 text-sm mt-2">
                      Listen to more BTS music and try again later!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
