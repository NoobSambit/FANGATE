'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { Trophy, XCircle, ExternalLink, CheckCircle, X, ArrowLeft } from 'lucide-react';

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

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [showAnswers, setShowAnswers] = useState(true);
  const [loadingResults, setLoadingResults] = useState(true);

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
        } catch (error) {
          console.error('Failed to parse quiz results:', error);
        } finally {
          setLoadingResults(false);
        }
      };

      loadQuizResults();
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
                <p className="text-lg sm:text-xl text-white/70">
                  Congratulations! You scored {score}/10 on the quiz
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
                  Quiz Not Passed
                </h1>
                <p className="text-lg sm:text-xl text-white/70 mb-2">
                  You scored {score}/10 (minimum 7 required)
                </p>
                <p className="text-sm text-white/50">
                  Review the correct answers below
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

              {/* Try Again */}
              <div className="glass-effect p-6 sm:p-8 rounded-xl">
                <p className="text-white/70 mb-6 text-center text-sm sm:text-base">
                  Don&apos;t worry! You can try again after listening to more BTS music and learning more about the group.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.push('/verification')}
                    className="btn-primary"
                  >
                    Try Quiz Again
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
