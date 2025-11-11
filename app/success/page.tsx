'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import {
  Trophy,
  XCircle,
  ExternalLink,
  CheckCircle,
  X,
  ArrowLeft,
  Music,
  TrendingUp,
  Clock,
  Award,
  FileText,
  Download,
  Sparkles,
} from 'lucide-react';
import Footer from '@/components/Footer';

interface QuestionResult {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  userAnswer: number;
  isCorrect: boolean;
}

export default function SuccessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const passed = searchParams.get('passed') === 'true';
  const score = searchParams.get('score');
  const verificationId = searchParams.get('verificationId');
  const quizPassed = searchParams.get('quizPassed') === 'true';
  const combinedScore = searchParams.get('combinedScore');
  const spotifyScore = searchParams.get('spotifyScore');
  const enableSpotifyVerification =
    process.env.NEXT_PUBLIC_ENABLE_SPOTIFY_VERIFICATION === 'true';
  const mockedQuery = searchParams.get('mocked') === 'true';

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [showAnswers, setShowAnswers] = useState(true);
  const [loadingResults, setLoadingResults] = useState(true);
  const [quizData, setQuizData] = useState<{
    quizScore?: number;
    quizPassed?: boolean;
    spotifyScore?: number;
    combinedScore?: number;
    spotifyBreakdown?: any;
    mocked?: boolean;
  }>({});
  const [showScorecard, setShowScorecard] = useState(true);
  const [showTicketCard, setShowTicketCard] = useState(false);
  const [siteOrigin, setSiteOrigin] = useState('fangate.army');
  const [downloadingCard, setDownloadingCard] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const isMockFlow =
    mockedQuery || quizData.mocked || !enableSpotifyVerification;

  useEffect(() => {
    if (enableSpotifyVerification && status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (typeof window !== 'undefined') {
      setSiteOrigin(window.location.origin);
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const loadQuizResults = () => {
        try {
          const storedResults = sessionStorage.getItem('quizResults');
          if (storedResults) {
            const results = JSON.parse(storedResults);
            if (Array.isArray(results) && results.length > 0) {
              setQuestionResults(results);
            }
          }
          
          // Load additional quiz data
          const storedQuizData = sessionStorage.getItem('quizData');
          if (storedQuizData) {
            const data = JSON.parse(storedQuizData);
            setQuizData({
              ...data,
              mocked:
                typeof data.mocked === 'boolean'
                  ? data.mocked
                  : mockedQuery,
            });
          } else if (combinedScore && spotifyScore && score) {
            // Fallback to URL params if sessionStorage not available
            setQuizData({
              quizScore: parseInt(score),
              quizPassed: quizPassed,
              spotifyScore: parseInt(spotifyScore),
              combinedScore: parseInt(combinedScore),
              mocked: mockedQuery,
            });
          }
          
          // Load verification breakdown for scorecard
          const storedBreakdown = sessionStorage.getItem('verificationBreakdown');
          if (storedBreakdown) {
            const breakdown = JSON.parse(storedBreakdown);
            setQuizData(prev => ({
              ...prev,
              spotifyBreakdown: breakdown,
            }));
          }
        } catch (error) {
          console.error('Failed to parse quiz results:', error);
        } finally {
          setLoadingResults(false);
        }
      };

      loadQuizResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router, enableSpotifyVerification, combinedScore, spotifyScore, score, quizPassed, mockedQuery]);

  useEffect(() => {
    if (enableSpotifyVerification && !isMockFlow && passed && verificationId) {
      generateToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableSpotifyVerification, isMockFlow, passed, verificationId]);

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

  const handleShowTicketCard = () => {
    setShowTicketCard(true);
  };

  const getTweetUrl = (didPass: boolean) => {
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'https://fangate.army';
    const text = didPass
      ? `I just got verified as ARMY and unlocked the BTS concert ticket sale! 🎟️💜 Prove you deserve your seat with FanGate:\n${baseUrl}\nCreator: @Boy_With_Code`
      : `FanGate just roasted me 😂 Failed the ARMY check but I'm sprinting back to stream BTS until I pass. Try your luck:\n${baseUrl}\nCreator: @Boy_With_Code`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current || downloadingCard) {
      return;
    }

    let container: HTMLDivElement | null = null;

    try {
      setDownloadingCard(true);

      const html2canvasModule = await import('html2canvas');
      const rect = cardRef.current.getBoundingClientRect();

      // Clone the card into an off-screen container to avoid viewport clipping
      const clone = cardRef.current.cloneNode(true) as HTMLElement;
      clone.style.margin = '0';
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.maxHeight = 'none';
      clone.style.overflow = 'visible';

      container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.zIndex = '-1';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      container.style.background = '#140022';
      container.style.padding = '0';
      container.style.width = `${rect.width}px`;
      container.style.height = `${rect.height}px`;
      container.appendChild(clone);
      document.body.appendChild(container);

      // Wait for next frame so styles apply
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const canvas = await html2canvasModule.default(clone, {
        backgroundColor: '#140022',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.download = 'fangate-verified-army-pass.jpg';
      link.click();
    } catch (error) {
      console.error('Failed to download card:', error);
    } finally {
      if (container) {
        document.body.removeChild(container);
      }
      setDownloadingCard(false);
    }
  };

  const spotifyPoints = Number(
    quizData.spotifyBreakdown?.fanScore ??
      quizData.spotifyScore ??
      spotifyScore ??
      0,
  );

  const quizCorrect = Number(quizData.quizScore ?? score ?? 0);
  const quizPercentage = Math.round((quizCorrect / 10) * 100);
  const combinedPoints = Number(
    quizData.combinedScore ?? combinedScore ?? 0,
  );
  const sanitizedOrigin = siteOrigin.replace(/^https?:\/\//, '');
  const truncatedToken =
    token && token.length > 12
      ? `${token.slice(0, 6)}...${token.slice(-6)}`
      : token || 'N/A';
  const verifiedDisplayName =
    session?.user?.name || session?.user?.email || 'Verified ARMY';

  if (enableSpotifyVerification && status === 'loading') {
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8 sm:py-12">
      {passed && windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={400}
        />
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {passed ? (
            <>
              {/* Success Header */}
              <div className="mb-8 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 gradient-purple rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
                  You&apos;re a Verified ARMY!
                </h1>
                <p className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  You can access the concert ticket now! 🎟️
                </p>
                
                {/* Show different messages based on quiz performance */}
                {!quizPassed && (quizData.spotifyScore || spotifyScore) && (
                  <div className="mb-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg max-w-2xl mx-auto">
                    <p className="text-lg sm:text-xl text-white/90 font-semibold mb-2">
                      💜 Your Spotify Listening Saved You! 💜
                    </p>
                    <p className="text-sm sm:text-base text-white/70 mb-2">
                      Okay, so your memory might be... questionable (you got {score}/10 on the quiz 😅), 
                      but your Spotify doesn&apos;t lie! Your {quizData.spotifyScore || spotifyScore} point fan score 
                      from actually listening to BTS music pulled through and saved your ticket.
                    </p>
                    <p className="text-xs sm:text-sm text-purple-300/80 italic">
                      Sometimes being a real ARMY means your heart (and playlist) speaks louder than your brain! 
                      Your dedication to streaming BTS clearly shows you&apos;re the real deal.
                    </p>
                  </div>
                )}
                
                {quizPassed && (
                  <p className="text-lg sm:text-xl text-white/70">
                    Congratulations! You scored {score}/10 on the quiz
                  </p>
                )}
                
                {/* Combined Score Display */}
                {quizData.combinedScore && (
                  <div className="mt-4 p-3 bg-white/5 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-white/60 mb-1">Combined Score</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {quizData.combinedScore}/100
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      Spotify: {quizData.spotifyScore || spotifyScore} (40%) + Quiz: {((parseInt(score || '0') / 10) * 100).toFixed(0)}% (60%)
                    </p>
                  </div>
                )}

                {/* Share First (Download or Tweet) */}
                <div className="mt-6 glass-effect p-5 sm:p-6 rounded-xl max-w-2xl mx-auto">
                  <h3 className="text-lg font-semibold text-white mb-3 text-center">Share Your Verification</h3>
                  <p className="text-xs sm:text-sm text-white/60 text-center mb-4">
                    Download your BTS-themed ARMY Pass or post a tweet. You can attach the JPG in Twitter manually.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={handleShowTicketCard}
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-purple-400/40 bg-purple-500/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500/30"
                    >
                      <Download size={18} />
                      Download ARMY Pass
                    </button>
                    <a
                      href={getTweetUrl(true)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:shadow-purple-500/50"
                    >
                      Post on Twitter
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Quiz Results */}
              {questionResults.length > 0 && (
                <div className="glass-effect p-6 sm:p-8 rounded-xl mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Quiz Results
                    </h2>
                    <button
                      onClick={() => setShowAnswers(!showAnswers)}
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {showAnswers ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {showAnswers && (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {questionResults.map((result, index) => (
                        <div
                          key={result.id}
                          className={`p-4 rounded-lg border ${
                            result.isCorrect
                              ? 'bg-green-500/10 border-green-500/30'
                              : 'bg-red-500/10 border-red-500/30'
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div
                              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                                result.isCorrect
                                  ? 'bg-green-500 text-white'
                                  : 'bg-red-500 text-white'
                              }`}
                            >
                              {result.isCorrect ? (
                                <CheckCircle size={14} />
                              ) : (
                                <X size={14} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-white/40 mb-1">
                                Question {index + 1}
                              </div>
                              <h3 className="text-sm sm:text-base font-semibold text-white mb-3">
                                {result.question}
                              </h3>
                            </div>
                          </div>

                          <div className="space-y-2 ml-8">
                            {result.options.map((option, optionIndex) => {
                              const isCorrect = optionIndex === result.correctIndex;
                              const isUserAnswer = optionIndex === result.userAnswer;
                              const isWrongAnswer = isUserAnswer && !isCorrect;

                              return (
                                <div
                                  key={optionIndex}
                                  className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                                    isCorrect
                                      ? 'bg-green-500/20 border-green-500/50'
                                      : isWrongAnswer
                                      ? 'bg-red-500/20 border-red-500/50'
                                      : 'bg-white/5 border-white/10'
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                      isCorrect
                                        ? 'border-green-400 bg-green-400'
                                        : isWrongAnswer
                                        ? 'border-red-400 bg-red-400'
                                        : 'border-white/20'
                                    }`}
                                  >
                                    {isCorrect && (
                                      <CheckCircle size={10} className="text-white" />
                                    )}
                                    {isWrongAnswer && (
                                      <X size={10} className="text-white" />
                                    )}
                                  </div>
                                  <span
                                    className={`flex-1 text-xs sm:text-sm ${
                                      isCorrect
                                        ? 'text-green-200 font-medium'
                                        : isWrongAnswer
                                        ? 'text-red-200 font-medium'
                                        : 'text-white/60'
                                    }`}
                                  >
                                    {option}
                                  </span>
                                  {isCorrect && (
                                    <span className="text-xs text-green-300 font-semibold px-2 py-0.5 bg-green-500/30 rounded">
                                      Correct
                                    </span>
                                  )}
                                  {isWrongAnswer && (
                                    <span className="text-xs text-red-300 font-semibold px-2 py-0.5 bg-red-500/30 rounded">
                                      Your Answer
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Access Token */}
              <div className="glass-effect p-6 sm:p-8 rounded-xl mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-center text-white">Your Access Token</h2>
                {enableSpotifyVerification && !isMockFlow ? (
                  loading ? (
                    <div className="text-purple-400 text-center">Generating token...</div>
                  ) : token ? (
                    <>
                      <div className="bg-black/40 p-3 sm:p-4 rounded-lg mb-4 break-all font-mono text-xs sm:text-sm border border-white/10">
                        {token}
                      </div>
                      <p className="text-xs sm:text-sm text-white/50 mb-4 text-center">
                        This token expires in 10 minutes. Click below to access the ticket sale page.
                      </p>
                      <a
                        href={getTweetUrl(true)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary w-full inline-flex items-center justify-center gap-2"
                      >
                        Post on Twitter
                        <ExternalLink size={18} />
                      </a>
                    </>
                  ) : (
                    <div className="text-red-400 text-center">Failed to generate token</div>
                  )
                ) : (
                  <div className="text-xs sm:text-sm text-white/60 text-center">
                    Ticket tokens are paused while we run the mock verification experience. You can still download your ARMY pass and share it with the world!
                  </div>
                )}
              </div>

              {/* Detailed Scorecard for Pass */}
              {quizData.spotifyBreakdown && (
                <div className="glass-effect p-6 sm:p-8 rounded-xl mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                      <FileText className="text-purple-400" size={24} />
                      Detailed Scorecard
                    </h2>
                    <button
                      onClick={() => setShowScorecard(!showScorecard)}
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {showScorecard ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {showScorecard && (
                    <div className="space-y-6">
                      {/* Spotify Score Breakdown */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Music className="text-purple-400" size={20} />
                          Spotify Listening Score
                        </h3>
                        <div className="space-y-3">
                          <div className="p-4 bg-white/2 border border-white/10 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-white/70">Top Artists Analysis</span>
                              <span className="text-lg font-bold text-purple-400">
                                +{quizData.spotifyBreakdown.breakdown?.topArtists || 0}
                              </span>
                            </div>
                            <p className="text-xs text-white/50">
                              {quizData.spotifyBreakdown.breakdown?.topArtists > 0 
                                ? 'BTS found in your top 50 artists' 
                                : 'BTS not in your top 50 artists'}
                            </p>
                          </div>

                          <div className="p-4 bg-white/2 border border-white/10 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-white/70">Solo Member Recognition</span>
                              <span className="text-lg font-bold text-purple-400">
                                +{quizData.spotifyBreakdown.breakdown?.soloMembers || 0}
                              </span>
                            </div>
                            <p className="text-xs text-white/50">
                              {quizData.spotifyBreakdown.breakdown?.soloMembersCount || 0} solo artist(s) found
                            </p>
                          </div>

                          <div className="p-4 bg-white/2 border border-white/10 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-white/70">Top Tracks</span>
                              <span className="text-lg font-bold text-pink-400">
                                +{quizData.spotifyBreakdown.breakdown?.topTracks || 0}
                              </span>
                            </div>
                            <p className="text-xs text-white/50">
                              {quizData.spotifyBreakdown.breakdown?.topTracksCount || 0} BTS track(s) in your top 50
                            </p>
                          </div>

                          <div className="p-4 bg-white/2 border border-white/10 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-white/70">Recent Listening</span>
                              <span className="text-lg font-bold text-purple-400">
                                +{quizData.spotifyBreakdown.breakdown?.recentListening || 0}
                              </span>
                            </div>
                            <p className="text-xs text-white/50">
                              {quizData.spotifyBreakdown.breakdown?.recentListeningCount || 0} BTS track(s) in recently played
                            </p>
                          </div>

                          <div className="p-4 bg-white/2 border border-white/10 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-white/70">Account Age</span>
                              <span className="text-lg font-bold text-purple-400">
                                +{quizData.spotifyBreakdown.breakdown?.accountAge || 0}
                              </span>
                            </div>
                            <p className="text-xs text-white/50">
                              {quizData.spotifyBreakdown.breakdown?.accountAge > 0 
                                ? 'Account over 60 days old' 
                                : 'Account less than 60 days old'}
                            </p>
                          </div>

                          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg mt-4">
                            <div className="flex items-center justify-between">
                              <span className="text-base font-semibold text-white">Total Spotify Score</span>
                              <span className="text-2xl font-bold text-purple-400">
                                {quizData.spotifyBreakdown.fanScore || quizData.spotifyScore || spotifyScore}
                              </span>
                            </div>
                            <p className="text-xs text-purple-300/70 mt-1">Weight: 40%</p>
                          </div>
                        </div>
                      </div>

                      {/* Quiz Score Breakdown */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Award className="text-pink-400" size={20} />
                          Quiz Score
                        </h3>
                        <div className="p-4 bg-white/2 border border-white/10 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-white/70">Correct Answers</span>
                            <span className="text-lg font-bold text-pink-400">
                              {quizData.quizScore || score}/10
                            </span>
                          </div>
                          <p className="text-xs text-white/50 mb-3">
                            {quizData.quizPassed ? 'Quiz passed (7+ correct)' : 'Quiz not passed (less than 7 correct)'}
                          </p>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white/70">Quiz Percentage</span>
                              <span className="text-lg font-bold text-pink-400">
                                {((parseInt(score || '0') / 10) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-xs text-pink-300/70 mt-1">Weight: 60%</p>
                          </div>
                        </div>
                      </div>

                      {/* Combined Score Calculation */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Trophy className="text-green-400" size={20} />
                          Combined Score Calculation
                        </h3>
                        <div className="p-4 bg-gradient-to-br from-green-500/10 to-purple-500/10 border border-green-500/30 rounded-lg">
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/70">Spotify Score (40%):</span>
                              <span className="text-white font-semibold">
                                {quizData.spotifyBreakdown.fanScore || quizData.spotifyScore || spotifyScore} × 0.4 = 
                                <span className="text-purple-400 ml-2">
                                  {((parseInt(quizData.spotifyBreakdown?.fanScore || quizData.spotifyScore || spotifyScore || '0')) * 0.4).toFixed(1)}
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/70">Quiz Score (60%):</span>
                              <span className="text-white font-semibold">
                                {((parseInt(score || '0') / 10) * 100).toFixed(0)}% × 0.6 = 
                                <span className="text-pink-400 ml-2">
                                  {((parseInt(score || '0') / 10) * 100 * 0.6).toFixed(1)}
                                </span>
                              </span>
                            </div>
                          </div>
                          <div className="pt-3 border-t border-white/10">
                            <div className="flex items-center justify-between">
                              <span className="text-base font-semibold text-white">Final Combined Score</span>
                              <span className="text-2xl font-bold text-green-400">
                                {quizData.combinedScore || combinedScore}/100
                              </span>
                            </div>
                            <p className="text-xs text-green-300/70 mt-1">
                              ✓ Passed (Minimum: 70)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="text-sm text-white/40 text-center">
                Thank you for being a true ARMY member! 💜
              </div>
            </>
          ) : (
            <>
              {/* Failure Header */}
              <div className="mb-8 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-500/30">
                  <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 text-red-400">
                  Verification Not Passed
                </h1>
                <p className="text-lg sm:text-xl text-white/70 mb-2">
                  Combined Score: {combinedScore || quizData.combinedScore || 'N/A'}/100 (minimum 70 required)
                </p>
                <p className="text-sm text-white/60 mb-2">
                  Quiz: {score}/10 | Spotify: {spotifyScore || quizData.spotifyScore || 'N/A'} points
                </p>
                <p className="text-sm text-white/50">
                  Review the correct answers below and try to improve your score
                </p>
              </div>

              <div className="glass-effect p-5 sm:p-6 rounded-xl mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 text-center">
                  Share the Chaos
                </h3>
                <p className="text-xs sm:text-sm text-white/60 text-center mb-4">
                  Let Twitter know FanGate roasted you. Download the card or post a sarcastic tweet (attach the JPG manually if you want the receipts).
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleShowTicketCard}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-red-400/40 bg-red-500/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500/30"
                  >
                    <Download size={18} />
                    Download ARMY Pass
                  </button>
                  <a
                    href={getTweetUrl(false)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 via-purple-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:shadow-purple-500/50"
                  >
                    Post on Twitter
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>

              {/* Quiz Results */}
              {questionResults.length > 0 && (
                <div className="glass-effect p-6 sm:p-8 rounded-xl mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Quiz Results
                    </h2>
                    <button
                      onClick={() => setShowAnswers(!showAnswers)}
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {showAnswers ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {showAnswers && (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {questionResults.map((result, index) => (
                        <div
                          key={result.id}
                          className={`p-4 rounded-lg border ${
                            result.isCorrect
                              ? 'bg-green-500/10 border-green-500/30'
                              : 'bg-red-500/10 border-red-500/30'
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div
                              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                                result.isCorrect
                                  ? 'bg-green-500 text-white'
                                  : 'bg-red-500 text-white'
                              }`}
                            >
                              {result.isCorrect ? (
                                <CheckCircle size={14} />
                              ) : (
                                <X size={14} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-white/40 mb-1">
                                Question {index + 1}
                              </div>
                              <h3 className="text-sm sm:text-base font-semibold text-white mb-3">
                                {result.question}
                              </h3>
                            </div>
                          </div>

                          <div className="space-y-2 ml-8">
                            {result.options.map((option, optionIndex) => {
                              const isCorrect = optionIndex === result.correctIndex;
                              const isUserAnswer = optionIndex === result.userAnswer;
                              const isWrongAnswer = isUserAnswer && !isCorrect;

                              return (
                                <div
                                  key={optionIndex}
                                  className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                                    isCorrect
                                      ? 'bg-green-500/20 border-green-500/50'
                                      : isWrongAnswer
                                      ? 'bg-red-500/20 border-red-500/50'
                                      : 'bg-white/5 border-white/10'
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                      isCorrect
                                        ? 'border-green-400 bg-green-400'
                                        : isWrongAnswer
                                        ? 'border-red-400 bg-red-400'
                                        : 'border-white/20'
                                    }`}
                                  >
                                    {isCorrect && (
                                      <CheckCircle size={10} className="text-white" />
                                    )}
                                    {isWrongAnswer && (
                                      <X size={10} className="text-white" />
                                    )}
                                  </div>
                                  <span
                                    className={`flex-1 text-xs sm:text-sm ${
                                      isCorrect
                                        ? 'text-green-200 font-medium'
                                        : isWrongAnswer
                                        ? 'text-red-200 font-medium'
                                        : 'text-white/60'
                                    }`}
                                  >
                                    {option}
                                  </span>
                                  {isCorrect && (
                                    <span className="text-xs text-green-300 font-semibold px-2 py-0.5 bg-green-500/30 rounded">
                                      Correct
                                    </span>
                                  )}
                                  {isWrongAnswer && (
                                    <span className="text-xs text-red-300 font-semibold px-2 py-0.5 bg-red-500/30 rounded">
                                      Your Answer
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Scorecard for Fail */}
              {quizData.spotifyBreakdown && (
                <div className="glass-effect p-6 sm:p-8 rounded-xl mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                      <FileText className="text-purple-400" size={24} />
                      Detailed Scorecard
                    </h2>
                    <button
                      onClick={() => setShowScorecard(!showScorecard)}
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {showScorecard ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {showScorecard && (
                    <div className="space-y-6">
                      {/* Spotify Score Breakdown */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Music className="text-purple-400" size={20} />
                          Spotify Listening Score
                        </h3>
                        <div className="space-y-3">
                          <div className="p-4 bg-white/2 border border-white/10 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-white/70">Top Artists Analysis</span>
                              <span className="text-lg font-bold text-purple-400">
                                +{quizData.spotifyBreakdown.breakdown?.topArtists || 0}
                              </span>
                            </div>
                            <p className="text-xs text-white/50">
                              {quizData.spotifyBreakdown.breakdown?.topArtists > 0 
                                ? 'BTS found in your top 50 artists' 
                                : 'BTS not in your top 50 artists'}
                            </p>
                          </div>

                          <div className="p-4 bg-white/2 border border-white/10 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-white/70">Solo Member Recognition</span>
                              <span className="text-lg font-bold text-purple-400">
                                +{quizData.spotifyBreakdown.breakdown?.soloMembers || 0}
                              </span>
                            </div>
                            <p className="text-xs text-white/50">
                              {quizData.spotifyBreakdown.breakdown?.soloMembersCount || 0} solo artist(s) found
                            </p>
                          </div>

                          <div className="p-4 bg-white/2 border border-white/10 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-white/70">Top Tracks</span>
                              <span className="text-lg font-bold text-pink-400">
                                +{quizData.spotifyBreakdown.breakdown?.topTracks || 0}
                              </span>
                            </div>
                            <p className="text-xs text-white/50">
                              {quizData.spotifyBreakdown.breakdown?.topTracksCount || 0} BTS track(s) in your top 50
                            </p>
                          </div>

                          <div className="p-4 bg-white/2 border border-white/10 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-white/70">Recent Listening</span>
                              <span className="text-lg font-bold text-purple-400">
                                +{quizData.spotifyBreakdown.breakdown?.recentListening || 0}
                              </span>
                            </div>
                            <p className="text-xs text-white/50">
                              {quizData.spotifyBreakdown.breakdown?.recentListeningCount || 0} BTS track(s) in recently played
                            </p>
                          </div>

                          <div className="p-4 bg-white/2 border border-white/10 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-white/70">Account Age</span>
                              <span className="text-lg font-bold text-purple-400">
                                +{quizData.spotifyBreakdown.breakdown?.accountAge || 0}
                              </span>
                            </div>
                            <p className="text-xs text-white/50">
                              {quizData.spotifyBreakdown.breakdown?.accountAge > 0 
                                ? 'Account over 60 days old' 
                                : 'Account less than 60 days old'}
                            </p>
                          </div>

                          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg mt-4">
                            <div className="flex items-center justify-between">
                              <span className="text-base font-semibold text-white">Total Spotify Score</span>
                              <span className="text-2xl font-bold text-purple-400">
                                {quizData.spotifyBreakdown.fanScore || quizData.spotifyScore || spotifyScore}
                              </span>
                            </div>
                            <p className="text-xs text-purple-300/70 mt-1">Weight: 40%</p>
                          </div>
                        </div>
                      </div>

                      {/* Quiz Score Breakdown */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Award className="text-pink-400" size={20} />
                          Quiz Score
                        </h3>
                        <div className="p-4 bg-white/2 border border-white/10 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-white/70">Correct Answers</span>
                            <span className="text-lg font-bold text-pink-400">
                              {quizData.quizScore || score}/10
                            </span>
                          </div>
                          <p className="text-xs text-white/50 mb-3">
                            {quizData.quizPassed ? 'Quiz passed (7+ correct)' : 'Quiz not passed (less than 7 correct)'}
                          </p>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white/70">Quiz Percentage</span>
                              <span className="text-lg font-bold text-pink-400">
                                {((parseInt(score || '0') / 10) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-xs text-pink-300/70 mt-1">Weight: 60%</p>
                          </div>
                        </div>
                      </div>

                      {/* Combined Score Calculation */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Trophy className="text-red-400" size={20} />
                          Combined Score Calculation
                        </h3>
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/70">Spotify Score (40%):</span>
                              <span className="text-white font-semibold">
                                {quizData.spotifyBreakdown.fanScore || quizData.spotifyScore || spotifyScore} × 0.4 = 
                                <span className="text-purple-400 ml-2">
                                  {((parseInt(quizData.spotifyBreakdown?.fanScore || quizData.spotifyScore || spotifyScore || '0')) * 0.4).toFixed(1)}
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/70">Quiz Score (60%):</span>
                              <span className="text-white font-semibold">
                                {((parseInt(score || '0') / 10) * 100).toFixed(0)}% × 0.6 = 
                                <span className="text-pink-400 ml-2">
                                  {((parseInt(score || '0') / 10) * 100 * 0.6).toFixed(1)}
                                </span>
                              </span>
                            </div>
                          </div>
                          <div className="pt-3 border-t border-white/10">
                            <div className="flex items-center justify-between">
                              <span className="text-base font-semibold text-white">Final Combined Score</span>
                              <span className="text-2xl font-bold text-red-400">
                                {quizData.combinedScore || combinedScore}/100
                              </span>
                            </div>
                            <p className="text-xs text-red-300/70 mt-1">
                              ✗ Failed (Minimum: 70) - Need {70 - (typeof quizData.combinedScore === 'number' ? quizData.combinedScore : parseInt(combinedScore || '0'))} more points
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Try Again */}
              <div className="glass-effect p-6 sm:p-8 rounded-xl">
                <p className="text-white/70 mb-4 text-center text-sm sm:text-base">
                  Your combined score wasn&apos;t high enough this time. The scoring combines your Spotify listening (40%) and quiz performance (60%).
                </p>
                <p className="text-white/60 mb-6 text-center text-xs sm:text-sm">
                  💡 Tip: Listen to more BTS music to boost your Spotify score, and study up on BTS trivia to improve your quiz score!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.push('/verification')}
                    className="btn-primary"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="btn-secondary"
                  >
                    <ArrowLeft size={16} className="inline mr-2" />
                    Back to Home
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showTicketCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur overflow-y-auto overscroll-contain">
          <div className="relative w-full max-w-2xl mx-auto my-auto px-4 py-4 sm:py-6 min-h-0">
            <button
              onClick={() => setShowTicketCard(false)}
              className="fixed top-4 right-4 sm:absolute sm:-top-12 sm:right-0 z-50 text-white/70 hover:text-white transition-colors bg-black/50 rounded-full p-2 sm:bg-transparent sm:p-0"
            >
              <X size={24} />
            </button>
            <div
              ref={cardRef}
              className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-purple-400/40 bg-gradient-to-br from-purple-900/80 via-fuchsia-900/70 to-slate-900/80 px-4 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-10 shadow-[0_20px_70px_rgba(168,85,247,0.45)]"
            >
              <div className="absolute inset-0 opacity-60">
                <div className="absolute -top-32 -right-10 h-64 w-64 rounded-full bg-purple-500/40 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-pink-500/30 blur-3xl" />
              </div>
              <div className="relative z-10 space-y-4 sm:space-y-6 pt-1">
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border border-white/20 bg-black/20 overflow-hidden flex-shrink-0">
                      <img
                        src="/fangate-logo.png"
                        alt="FanGate logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-lg font-semibold text-white truncate">FanGate</p>
                      <p className="text-xs sm:text-sm text-white/70 truncate">{sanitizedOrigin}</p>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider sm:tracking-[0.35em] text-purple-200/80 text-right flex-shrink-0">
                    {passed ? 'Verified ARMY Pass' : 'Stream-Till-You-Pass Pass'}
                  </span>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/20 ${passed ? 'bg-white/10' : 'bg-red-500/20'}`}>
                    <Sparkles size={14} className="text-purple-200 flex-shrink-0" />
                    <p className="text-xs sm:text-sm font-semibold text-white">
                      {passed
                        ? "Congratulations, you're cleared for BTS tickets!"
                        : 'Oof—FanGate just told you to stream harder.'}
                    </p>
                  </div>
                  <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
                    {passed
                      ? '🎟️ You can access the BTS concert ticket sale right now.'
                      : '🚫 No ticket... yet. Time to binge BTS and come back swinging.'}
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg text-purple-100/90">
                    {passed
                      ? "Show off your dedication—share this pass and let the world know you're officially a verified ARMY. See you at the show!"
                      : "Tell the timeline you flunked, then fire up those playlists. Every stream gets you closer to the ticket booth."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="rounded-xl sm:rounded-2xl border border-white/15 bg-white/10 px-3 py-4 sm:px-4 sm:py-5">
                    <p className="text-[10px] sm:text-xs text-white/60 uppercase tracking-widest">
                      Combined Score
                    </p>
                    <p
                      className={`mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold ${
                        passed ? 'text-green-300' : 'text-red-300'
                      }`}
                    >
                      {Number.isNaN(combinedPoints) ? '—' : combinedPoints}
                    </p>
                    <p className="text-[10px] sm:text-xs text-white/50 mt-1">Needed: 70+</p>
                  </div>
                  <div className="rounded-xl sm:rounded-2xl border border-white/15 bg-white/10 px-3 py-4 sm:px-4 sm:py-5">
                    <p className="text-[10px] sm:text-xs text-white/60 uppercase tracking-widest">
                      Spotify Dedication
                    </p>
                    <p
                      className={`mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold ${
                        passed ? 'text-purple-200' : 'text-purple-200'
                      }`}
                    >
                      {Number.isNaN(spotifyPoints) ? '—' : spotifyPoints}
                    </p>
                    <p className="text-[10px] sm:text-xs text-white/50 mt-1">Weight: 40%</p>
                  </div>
                  <div className="rounded-xl sm:rounded-2xl border border-white/15 bg-white/10 px-3 py-4 sm:px-4 sm:py-5">
                    <p className="text-[10px] sm:text-xs text-white/60 uppercase tracking-widest">
                      Quiz Mastery
                    </p>
                    <p
                      className={`mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold ${
                        passed ? 'text-pink-200' : 'text-orange-300'
                      }`}
                    >
                      {Number.isNaN(quizPercentage) ? '—' : `${quizPercentage}%`}
                    </p>
                    <p className="text-[10px] sm:text-xs text-white/50 mt-1">Weight: 60%</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-2">
                  <div className="text-xs sm:text-sm text-white/70">
                    <p className="font-semibold text-white">
                      {passed ? 'Verified ARMY' : 'ARMY-in-training'}: {verifiedDisplayName}
                    </p>
                    <p className="text-white/60 text-xs sm:text-sm">
                      {passed
                        ? isMockFlow
                          ? 'Ticket Token: Mock mode (not generated)'
                          : `Ticket Token: ${truncatedToken}`
                        : 'Ticket Token: 🔒 still locked'}
                    </p>
                    <p className="text-white/60 mt-1 sm:mt-2 text-xs sm:text-sm">
                      SamBiT⁷@Boy_With_Code
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/50">
                      Powered by
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-white">
                      FanGate Verification
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={handleDownloadCard}
                disabled={downloadingCard}
                className={`inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg sm:rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white transition disabled:opacity-60 ${
                  passed
                    ? 'border border-purple-400/40 bg-purple-500/20 hover:bg-purple-500/30'
                    : 'border border-red-400/40 bg-red-500/20 hover:bg-red-500/30'
                }`}
              >
                <Download size={16} />
                {downloadingCard ? 'Preparing JPG...' : 'Download ARMY Pass'}
              </button>
              {passed ? (
                enableSpotifyVerification && !isMockFlow ? (
                  <button
                    onClick={handleRedirect}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:shadow-purple-500/50"
                  >
                    Enter Ticket Sale
                    <ExternalLink size={16} />
                  </button>
                ) : (
                  <a
                    href={getTweetUrl(true)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:shadow-purple-500/50"
                  >
                    Post the Win
                    <ExternalLink size={16} />
                  </a>
                )
              ) : (
                <a
                  href={getTweetUrl(false)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-red-500 via-purple-500 to-pink-500 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:shadow-purple-500/50"
                >
                  Post the Roast
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
