'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Music, TrendingUp, Clock, CheckCircle, ArrowRight, Trophy, XCircle, ListMusic, Info } from 'lucide-react';
import { getScoringBreakdown } from '@/lib/scoring';

const ImageWithFallback = ({ src, alt, className, fallbackIcon: FallbackIcon, fallbackSize = 20 }: any) => {
  const [imgError, setImgError] = useState(false);
  
  if (!src || imgError) {
    return (
      <div className={`${className} bg-purple-500/10 flex items-center justify-center flex-shrink-0`}>
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
      
      // Store verification breakdown in sessionStorage for scorecard display
      if (typeof window !== 'undefined' && data.breakdown) {
        sessionStorage.setItem('verificationBreakdown', JSON.stringify({
          fanScore: data.fanScore,
          breakdown: data.breakdown,
          details: data.details,
        }));
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-75" />
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150" />
        </div>
      </div>
    );
  }

  const handleProceedToQuiz = () => {
    if (result?.canTakeQuiz && result?.verificationId) {
      router.push(`/quiz?verificationId=${result.verificationId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
              Fan Verification
            </h1>
            <p className="text-white/60 text-sm sm:text-base">
              {!result 
                ? "We'll analyze your Spotify listening history to calculate your BTS fan score"
                : "Your Spotify listening analysis is complete"
              }
            </p>
          </div>

          {!result && (
            <div className="glass-effect p-6 sm:p-8 rounded-xl">
              <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="text-purple-400 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-purple-200 font-semibold text-sm mb-1">How Scoring Works</p>
                    <p className="text-purple-300/80 text-xs sm:text-sm">
                      We analyze your Spotify listening history to calculate your fan score. You need a minimum of 70 points to proceed to the quiz.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {getScoringBreakdown().categories.map((category, idx) => {
                  const iconMap: { [key: string]: any } = {
                    topArtists: Music,
                    soloMembers: TrendingUp,
                    topTracks: ListMusic,
                    recentListening: Clock,
                    accountAge: CheckCircle,
                  };
                  const Icon = iconMap[category.category] || Music;

                  return (
                    <div key={idx} className="p-4 bg-white/2 border border-white/10 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Icon className="text-purple-400 mt-0.5 flex-shrink-0" size={20} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-white text-sm sm:text-base">{category.name}</h3>
                            {'pointsPerTrack' in category || 'pointsPerArtist' in category ? (
                              <span className="text-xs sm:text-sm font-semibold text-purple-400">
                                {('pointsPerTrack' in category ? category.pointsPerTrack : category.pointsPerArtist)} pts/{'pointsPerTrack' in category ? 'track' : 'artist'} (max {category.maxPoints})
                              </span>
                            ) : (
                              <span className="text-xs sm:text-sm font-semibold text-purple-400">
                                +{'points' in category ? category.points : 0} points
                              </span>
                            )}
                          </div>
                          <p className="text-white/60 text-xs sm:text-sm mb-1">{category.description}</p>
                          <p className="text-white/40 text-xs">{category.example}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleVerification}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Analyzing...' : 'Start Verification'}
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-200 font-semibold text-sm mb-1">Error</p>
                  <p className="text-red-300/80 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Total Score */}
              <div className="glass-effect p-6 sm:p-8 rounded-xl text-center">
                <div className="text-5xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 mb-2">
                  {result.fanScore}
                </div>
                <div className="text-white/60 text-sm sm:text-base font-medium mb-1">Total Fan Score</div>
                <div className="text-xs sm:text-sm text-white/40">
                  {result.canTakeQuiz 
                    ? "✓ Minimum score of 70 achieved" 
                    : `Need ${70 - result.fanScore} more points to proceed`
                  }
                </div>
              </div>

              {/* Score Breakdown */}
              {result.breakdown && (
                <div className="glass-effect p-6 sm:p-8 rounded-xl">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Score Breakdown</h2>
                  <div className="space-y-4">
                    {/* Top Artists */}
                    <div className="p-4 bg-white/2 border border-white/10 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Music className="text-purple-400 mt-0.5 flex-shrink-0" size={20} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-sm sm:text-base mb-1">Top Artists Analysis</div>
                            <div className="text-xs text-white/50 mb-2">
                              {result.breakdown.topArtists > 0 
                                ? 'BTS found in your top 50 artists (+50 points)'
                                : 'BTS not found in your top 50 artists'
                              }
                            </div>
                            {result.breakdown.topArtists > 0 && (
                              <div className="text-xs text-purple-300/70 mb-3">
                                BTS is in your top artists: +50 points
                              </div>
                            )}
                            {result.details?.btsArtist && (
                              <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                                <ImageWithFallback
                                  src={result.details.btsArtist.image}
                                  alt={result.details.btsArtist.name}
                                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-purple-500/30 flex-shrink-0"
                                  fallbackIcon={Music}
                                  fallbackSize={20}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-white text-sm sm:text-base truncate">
                                    {result.details.btsArtist.name}
                                  </div>
                                  <div className="text-xs text-purple-300/70">Main Artist</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-purple-400 flex-shrink-0">
                          +{result.breakdown.topArtists}
                        </div>
                      </div>
                    </div>

                    {/* Solo Members */}
                    <div className="p-4 bg-white/2 border border-white/10 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <TrendingUp className="text-purple-400 mt-0.5 flex-shrink-0" size={20} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-sm sm:text-base mb-1">Solo Member Recognition</div>
                            <div className="text-xs text-white/50 mb-2">
                              {result.breakdown.soloMembersCount > 0 
                                ? `${result.breakdown.soloMembersCount} BTS solo artist${result.breakdown.soloMembersCount > 1 ? 's' : ''} in your top 50 artists (20 points per artist)`
                                : 'No BTS solo artists in top list'
                              }
                            </div>
                            {result.breakdown.soloMembersCount > 0 && (
                              <div className="text-xs text-purple-300/70 mb-3">
                                Calculation: {result.breakdown.soloMembersCount} artist{result.breakdown.soloMembersCount > 1 ? 's' : ''} × 20 points = +{result.breakdown.soloMembers} points
                              </div>
                            )}
                            {result.details?.soloArtists && result.details.soloArtists.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                                {result.details.soloArtists.map((artist: any) => (
                                  <div key={artist.id} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                                    <ImageWithFallback
                                      src={artist.image}
                                      alt={artist.name}
                                      className="w-10 h-10 rounded-full object-cover border border-purple-500/30 flex-shrink-0"
                                      fallbackIcon={Music}
                                      fallbackSize={16}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-white text-xs sm:text-sm truncate">
                                        {artist.name}
                                      </div>
                                      <div className="text-xs text-purple-300/70">Solo Artist</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-purple-400 flex-shrink-0">
                          +{result.breakdown.soloMembers}
                        </div>
                      </div>
                    </div>

                    {/* Top Tracks */}
                    <div className="p-4 bg-white/2 border border-white/10 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <ListMusic className="text-pink-400 mt-0.5 flex-shrink-0" size={20} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-sm sm:text-base mb-1">Top Tracks</div>
                            <div className="text-xs text-white/50 mb-2">
                              {result.breakdown.topTracksCount > 0 
                                ? `${result.breakdown.topTracksCount} BTS track${result.breakdown.topTracksCount > 1 ? 's' : ''} in your top 50 tracks (10 points per track)`
                                : 'No BTS tracks in your top list'
                              }
                            </div>
                            {result.breakdown.topTracksCount > 0 && (
                              <div className="text-xs text-purple-300/70 mb-3">
                                Calculation: {result.breakdown.topTracksCount} track{result.breakdown.topTracksCount > 1 ? 's' : ''} × 10 points = +{result.breakdown.topTracks} points
                              </div>
                            )}
                            {result.details?.topTracks && result.details.topTracks.length > 0 && (
                              <div className="space-y-2 mt-3 max-h-48 overflow-y-auto pr-2">
                                {result.details.topTracks.map((track: any) => (
                                  <div key={track.id} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                                    <ImageWithFallback
                                      src={track.image}
                                      alt={track.album}
                                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                                      fallbackIcon={ListMusic}
                                      fallbackSize={16}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-white text-xs sm:text-sm truncate">
                                        {track.name}
                                      </div>
                                      <div className="text-xs text-white/40 truncate">
                                        {track.artists} • {track.album}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-pink-400 flex-shrink-0">
                          +{result.breakdown.topTracks}
                        </div>
                      </div>
                    </div>

                    {/* Recent Listening */}
                    <div className="p-4 bg-white/2 border border-white/10 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Clock className="text-purple-400 mt-0.5 flex-shrink-0" size={20} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-sm sm:text-base mb-1">Recent Listening</div>
                            <div className="text-xs text-white/50 mb-2">
                              {(result.breakdown.recentListeningCount || 0) > 0 
                                ? `${result.breakdown.recentListeningCount || 0} BTS track${(result.breakdown.recentListeningCount || 0) > 1 ? 's' : ''} in your recently played (1 point per track)`
                                : 'No BTS tracks in recently played'
                              }
                            </div>
                            {(result.breakdown.recentListeningCount || 0) > 0 && (
                              <div className="text-xs text-purple-300/70 mb-3">
                                Calculation: {result.breakdown.recentListeningCount || 0} track{(result.breakdown.recentListeningCount || 0) > 1 ? 's' : ''} × 1 point = +{result.breakdown.recentListening} points
                              </div>
                            )}
                            {result.details?.recentTracks && result.details.recentTracks.length > 0 && (
                              <div className="space-y-2 mt-3 max-h-48 overflow-y-auto pr-2">
                                {result.details.recentTracks.slice(0, 20).map((track: any) => (
                                  <div key={track.id} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                                    <ImageWithFallback
                                      src={track.image}
                                      alt={track.album}
                                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                                      fallbackIcon={ListMusic}
                                      fallbackSize={16}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-white text-xs sm:text-sm truncate">
                                        {track.name}
                                      </div>
                                      <div className="text-xs text-white/40 truncate">
                                        {track.artists} • {track.album}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {(result.breakdown.recentListeningCount || 0) > 20 && (
                                  <div className="text-xs text-white/40 text-center py-2">
                                    +{(result.breakdown.recentListeningCount || 0) - 20} more track{(result.breakdown.recentListeningCount || 0) - 20 > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-purple-400 flex-shrink-0">
                          +{result.breakdown.recentListening}
                        </div>
                      </div>
                    </div>

                    {/* Account Age */}
                    <div className="flex items-center justify-between p-4 bg-white/2 border border-white/10 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="text-purple-400 flex-shrink-0" size={20} />
                        <div>
                          <div className="font-semibold text-white text-sm sm:text-base">Account Age</div>
                          <div className="text-xs text-white/50">
                            {result.breakdown.accountAge > 0 
                              ? 'Account over 60 days old'
                              : 'Account less than 60 days old'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-purple-400 flex-shrink-0">
                        +{result.breakdown.accountAge}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz Requirements */}
              {result.canTakeQuiz ? (
                <div className="glass-effect p-6 sm:p-8 rounded-xl">
                  <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="text-green-400 flex-shrink-0" size={18} />
                      <p className="text-green-200 font-semibold text-sm sm:text-base">
                        Ready for the Quiz!
                      </p>
                    </div>
                    <p className="text-green-300/80 text-xs sm:text-sm">
                      Your Spotify score is {result.fanScore} points. Now take the quiz to complete your verification!
                    </p>
                  </div>
                  
                  <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <Trophy className="text-purple-400 flex-shrink-0" size={16} />
                      Combined Scoring System
                    </h3>
                    <p className="text-xs sm:text-sm text-white/70 mb-3">
                      Your final score combines your Spotify listening (40%) and quiz performance (60%). 
                      Quiz score is weighted more, but your Spotify dedication can help!
                    </p>
                    <div className="space-y-2 text-xs sm:text-sm text-white/60">
                      <div className="flex items-center justify-between">
                        <span>Your Spotify Score:</span>
                        <span className="font-semibold text-purple-400">{result.fanScore} points (40%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Quiz Score:</span>
                        <span className="font-semibold text-white">0-100% (60%)</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <span>Minimum Combined Score:</span>
                        <span className="font-semibold text-green-400">70/100</span>
                      </div>
                    </div>
                    <p className="text-xs text-purple-300/70 mt-3 italic">
                      💡 Tip: Even if you don&apos;t ace the quiz, your Spotify listening can help you pass! 
                      An ARMY with good memory might struggle, but your playlist doesn&apos;t lie!
                    </p>
                  </div>

                  <div className="mb-6 p-4 bg-white/2 border border-white/10 rounded-lg">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <Trophy className="text-purple-400 flex-shrink-0" size={16} />
                      Quiz Details
                    </h3>
                    <div className="space-y-2 text-xs sm:text-sm text-white/60">
                      <div className="flex items-center justify-between">
                        <span>Total Questions:</span>
                        <span className="font-semibold text-white">10</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Time Limit:</span>
                        <span className="font-semibold text-white">10 minutes</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToQuiz}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2"
                  >
                    <Trophy size={18} />
                    <span>Proceed to Quiz</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                <div className="glass-effect p-6 sm:p-8 rounded-xl">
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="text-red-400 flex-shrink-0" size={18} />
                      <p className="text-red-200 font-semibold text-sm sm:text-base">
                        Score too low to proceed
                      </p>
                    </div>
                    <p className="text-red-300/80 text-xs sm:text-sm">
                      You need a minimum fan score of 70 to take the quiz. You currently have {result.fanScore} points.
                    </p>
                    <p className="text-red-300/80 text-xs sm:text-sm mt-2">
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
