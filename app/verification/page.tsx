'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Music, TrendingUp, Clock, CheckCircle, ChevronRight, Trophy, XCircle, ListMusic } from 'lucide-react';

// Component for images with fallback
const ImageWithFallback = ({ src, alt, className, fallbackIcon: FallbackIcon, fallbackSize = 20 }: any) => {
  const [imgError, setImgError] = useState(false);
  
  if (!src || imgError) {
    return (
      <div className={`${className} bg-purple-500/20 flex items-center justify-center flex-shrink-0`}>
        {FallbackIcon && <FallbackIcon className="text-purple-400" size={fallbackSize} />}
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt}
      className={className}
      onError={() => setImgError(true)}
    />
  );
};

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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#16003b] py-6 md:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 md:mb-12 px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-3 md:mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
              Fan Verification
            </h1>
            <p className="text-gray-300 text-sm md:text-base lg:text-lg">
              {!result 
                ? "We'll analyze your Spotify listening history to calculate your BTS fan score"
                : "Your Spotify listening analysis is complete"
              }
            </p>
          </div>

          {!result && (
            <div className="glass-effect p-6 md:p-8 rounded-2xl">
              <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
                <div className="flex items-start gap-3 md:gap-4">
                  <Music className="text-purple-400 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-base md:text-lg mb-1">Top Artists Analysis</h3>
                    <p className="text-gray-400 text-xs md:text-sm">
                      +50 points if BTS is in your top artists
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:gap-4">
                  <TrendingUp className="text-purple-400 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-base md:text-lg mb-1">Solo Member Recognition</h3>
                    <p className="text-gray-400 text-xs md:text-sm">
                      +20 points per BTS solo artist in your top list
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:gap-4">
                  <Clock className="text-purple-400 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-base md:text-lg mb-1">Recent Listening</h3>
                    <p className="text-gray-400 text-xs md:text-sm">
                      +30 points for BTS tracks in your recent plays
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:gap-4">
                  <CheckCircle className="text-purple-400 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-base md:text-lg mb-1">Account Age</h3>
                    <p className="text-gray-400 text-xs md:text-sm">
                      +10 points if your account is over 60 days old
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleVerification}
                disabled={loading}
                className="w-full gradient-purple py-3 md:py-4 rounded-xl text-base md:text-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50"
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
            <div className="space-y-4 md:space-y-6">
              {/* Total Score Display */}
              <div className="glass-effect p-6 md:p-8 rounded-2xl text-center">
                <div className="mb-4 md:mb-6">
                  <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 mb-2">
                    {result.fanScore}
                  </div>
                  <div className="text-gray-300 text-base md:text-lg font-medium">Total Fan Score</div>
                  <div className="mt-2 text-xs md:text-sm text-gray-400">
                    {result.canTakeQuiz 
                      ? "✓ Minimum score of 70 achieved" 
                      : `Need ${70 - result.fanScore} more points to proceed`
                    }
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              {result.breakdown && (
                <div className="glass-effect p-6 md:p-8 rounded-2xl">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Score Breakdown</h2>
                  <div className="space-y-4">
                    {/* Top Artists Analysis */}
                    <div className="p-4 md:p-5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Music className="text-purple-400 mt-1 flex-shrink-0" size={24} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-base md:text-lg mb-1">Top Artists Analysis</div>
                            <div className="text-xs md:text-sm text-gray-400 mb-3">
                              {result.breakdown.topArtists > 0 
                                ? 'BTS found in your top artists'
                                : 'BTS not found in your top artists'
                              }
                            </div>
                            {result.details?.btsArtist && (
                              <div className="flex items-center gap-3 mt-3 p-3 bg-black/20 rounded-lg">
                                <ImageWithFallback
                                  src={result.details.btsArtist.image}
                                  alt={result.details.btsArtist.name}
                                  className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover border-2 border-purple-500/50 flex-shrink-0"
                                  fallbackIcon={Music}
                                  fallbackSize={24}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-white text-base md:text-lg truncate">
                                    {result.details.btsArtist.name}
                                  </div>
                                  <div className="text-xs md:text-sm text-purple-300">Main Artist</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-purple-400 flex-shrink-0">
                          +{result.breakdown.topArtists}
                        </div>
                      </div>
                    </div>

                    {/* Solo Member Recognition */}
                    <div className="p-4 md:p-5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <TrendingUp className="text-purple-400 mt-1 flex-shrink-0" size={24} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-base md:text-lg mb-1">Solo Member Recognition</div>
                            <div className="text-xs md:text-sm text-gray-400 mb-3">
                              {result.breakdown.soloMembersCount > 0 
                                ? `${result.breakdown.soloMembersCount} BTS solo artist${result.breakdown.soloMembersCount > 1 ? 's' : ''} found`
                                : 'No BTS solo artists in top list'
                              }
                            </div>
                            {result.details?.soloArtists && result.details.soloArtists.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                {result.details.soloArtists.map((artist: any) => (
                                  <div key={artist.id} className="flex items-center gap-3 p-2 bg-black/20 rounded-lg">
                                    <ImageWithFallback
                                      src={artist.image}
                                      alt={artist.name}
                                      className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-purple-500/50 flex-shrink-0"
                                      fallbackIcon={Music}
                                      fallbackSize={20}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-white text-sm md:text-base truncate">
                                        {artist.name}
                                      </div>
                                      <div className="text-xs text-purple-300">Solo Artist</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-purple-400 flex-shrink-0">
                          +{result.breakdown.soloMembers}
                        </div>
                      </div>
                    </div>

                    {/* Top Tracks */}
                    <div className="p-4 md:p-5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <ListMusic className="text-pink-400 mt-1 flex-shrink-0" size={24} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-base md:text-lg mb-1">Top Tracks</div>
                            <div className="text-xs md:text-sm text-gray-400 mb-3">
                              {result.breakdown.topTracksCount > 0 
                                ? `${result.breakdown.topTracksCount} BTS track${result.breakdown.topTracksCount > 1 ? 's' : ''} in your top list`
                                : 'No BTS tracks in your top list'
                              }
                            </div>
                            {result.details?.topTracks && result.details.topTracks.length > 0 && (
                              <div className="space-y-2 mt-3 max-h-64 overflow-y-auto pr-2">
                                {result.details.topTracks.map((track: any) => (
                                  <div key={track.id} className="flex items-center gap-3 p-2.5 bg-black/20 rounded-lg hover:bg-black/30 transition-colors">
                                    <ImageWithFallback
                                      src={track.image}
                                      alt={track.album}
                                      className="w-12 h-12 md:w-14 md:h-14 rounded object-cover flex-shrink-0"
                                      fallbackIcon={ListMusic}
                                      fallbackSize={20}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-white text-sm md:text-base truncate">
                                        {track.name}
                                      </div>
                                      <div className="text-xs text-gray-400 truncate">
                                        {track.artists} • {track.album}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-pink-400 flex-shrink-0">
                          +{result.breakdown.topTracks}
                        </div>
                      </div>
                    </div>

                    {/* Recent Listening */}
                    <div className="p-4 md:p-5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Clock className="text-purple-400 mt-1 flex-shrink-0" size={24} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-base md:text-lg mb-1">Recent Listening</div>
                            <div className="text-xs md:text-sm text-gray-400 mb-3">
                              {result.breakdown.recentListening > 0 
                                ? 'BTS tracks in your recent plays'
                                : 'No BTS tracks in recent plays'
                              }
                            </div>
                            {result.details?.recentTracks && result.details.recentTracks.length > 0 && (
                              <div className="space-y-2 mt-3 max-h-64 overflow-y-auto pr-2">
                                {result.details.recentTracks.map((track: any) => (
                                  <div key={track.id} className="flex items-center gap-3 p-2.5 bg-black/20 rounded-lg hover:bg-black/30 transition-colors">
                                    <ImageWithFallback
                                      src={track.image}
                                      alt={track.album}
                                      className="w-12 h-12 md:w-14 md:h-14 rounded object-cover flex-shrink-0"
                                      fallbackIcon={ListMusic}
                                      fallbackSize={20}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-white text-sm md:text-base truncate">
                                        {track.name}
                                      </div>
                                      <div className="text-xs text-gray-400 truncate">
                                        {track.artists} • {track.album}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-purple-400 flex-shrink-0">
                          +{result.breakdown.recentListening}
                        </div>
                      </div>
                    </div>

                    {/* Account Age */}
                    <div className="flex items-center justify-between p-4 md:p-5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="text-purple-400 flex-shrink-0" size={24} />
                        <div>
                          <div className="font-semibold text-white text-base md:text-lg">Account Age</div>
                          <div className="text-xs md:text-sm text-gray-400">
                            {result.breakdown.accountAge > 0 
                              ? 'Account over 60 days old'
                              : 'Account less than 60 days old'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-purple-400 flex-shrink-0">
                        +{result.breakdown.accountAge}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz Requirements */}
              {result.canTakeQuiz ? (
                <div className="glass-effect p-6 md:p-8 rounded-2xl">
                  <div className="mb-4 md:mb-6 p-3 md:p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <div className="flex items-center gap-2 md:gap-3 mb-2">
                      <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
                      <p className="text-green-200 font-semibold text-base md:text-lg">
                        Great! You passed the listening analysis
                      </p>
                    </div>
                    <p className="text-green-300 text-xs md:text-sm">
                      You can now proceed to the quiz. You need to score 70% or higher (7 out of 10 questions correct) to pass.
                    </p>
                  </div>
                  
                  <div className="mb-4 md:mb-6 p-3 md:p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-base md:text-lg">
                      <Trophy className="text-purple-400 flex-shrink-0" size={18} />
                      Quiz Requirements
                    </h3>
                    <div className="space-y-2 text-xs md:text-sm text-gray-300">
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
                    className="w-full group relative inline-flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-base md:text-lg font-bold text-white overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Trophy className="relative z-10" size={20} />
                    <span className="relative z-10">Proceed to Quiz</span>
                    <ChevronRight className="relative z-10 group-hover:translate-x-1 transition-transform" size={18} />
                  </button>
                </div>
              ) : (
                <div className="glass-effect p-6 md:p-8 rounded-2xl">
                  <div className="p-3 md:p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <div className="flex items-center gap-2 md:gap-3 mb-2">
                      <XCircle className="text-red-400 flex-shrink-0" size={20} />
                      <p className="text-red-200 font-semibold text-base md:text-lg">
                        Score too low to proceed
                      </p>
                    </div>
                    <p className="text-red-300 text-xs md:text-sm">
                      You need a minimum fan score of 70 to take the quiz. You currently have {result.fanScore} points.
                    </p>
                    <p className="text-red-300 text-xs md:text-sm mt-2">
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
