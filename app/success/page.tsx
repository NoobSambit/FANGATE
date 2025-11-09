'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { Trophy, XCircle, ExternalLink, CheckCircle, X, ArrowLeft, Music, TrendingUp, Clock, Award, FileText } from 'lucide-react';

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
  }>({});
  const [showScorecard, setShowScorecard] = useState(true);

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
            setQuizData(data);
          } else if (combinedScore && spotifyScore && score) {
            // Fallback to URL params if sessionStorage not available
            setQuizData({
              quizScore: parseInt(score),
              quizPassed: quizPassed,
              spotifyScore: parseInt(spotifyScore),
              combinedScore: parseInt(combinedScore),
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
  }, [status, router]);

  useEffect(() => {
    if (passed && verificationId) {
      generateToken();
    }
    // generateToken is stable and doesn't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                {loading ? (
                  <div className="text-purple-400 text-center">Generating token...</div>
                ) : token ? (
                  <>
                    <div className="bg-black/40 p-3 sm:p-4 rounded-lg mb-4 break-all font-mono text-xs sm:text-sm border border-white/10">
                      {token}
                    </div>
                    <p className="text-xs sm:text-sm text-white/50 mb-4 text-center">
                      This token expires in 10 minutes. Click below to access the ticket sale page.
                    </p>
                    <button
                      onClick={handleRedirect}
                      className="btn-primary w-full inline-flex items-center justify-center gap-2"
                    >
                      Access Ticket Sale
                      <ExternalLink size={18} />
                    </button>
                  </>
                ) : (
                  <div className="text-red-400 text-center">Failed to generate token</div>
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
    </div>
  );
}
