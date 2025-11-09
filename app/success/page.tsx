'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { Trophy, XCircle, ExternalLink, CheckCircle, X } from 'lucide-react';

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

      // Load quiz results from sessionStorage
      const storedResults = sessionStorage.getItem('quizResults');
      if (storedResults) {
        try {
          const results = JSON.parse(storedResults);
          setQuestionResults(results);
          // Clear sessionStorage after reading
          sessionStorage.removeItem('quizResults');
        } catch (error) {
          console.error('Failed to parse quiz results:', error);
        }
      }
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
        <div className="max-w-4xl mx-auto">
          {passed ? (
            <>
              <div className="mb-8 text-center">
                <div className="w-24 h-24 gradient-purple rounded-full flex items-center justify-center mx-auto mb-6 glow-purple">
                  <Trophy size={48} />
                </div>
                <h1 className="text-5xl font-bold mb-4">
                  <span className="gradient-purple bg-clip-text text-transparent">
                    You&apos;re a Verified ARMY!
                  </span>
                </h1>
                <p className="text-xl text-gray-300">
                  Congratulations! You scored {score}/10 on the quiz
                </p>
              </div>

              {/* Quiz Results for Passed Quiz */}
              {questionResults.length > 0 && (
                <div className="glass-effect p-6 md:p-8 rounded-2xl mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                      Quiz Results
                    </h2>
                    <button
                      onClick={() => setShowAnswers(!showAnswers)}
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {showAnswers ? 'Hide Answers' : 'Show Answers'}
                    </button>
                  </div>

                  {showAnswers && (
                    <div className="space-y-6">
                      {questionResults.map((result, index) => (
                        <div
                          key={result.id}
                          className={`p-4 md:p-5 rounded-xl border-2 ${
                            result.isCorrect
                              ? 'bg-green-500/10 border-green-500/50'
                              : 'bg-red-500/10 border-red-500/50'
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-4">
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                result.isCorrect
                                  ? 'bg-green-500 text-white'
                                  : 'bg-red-500 text-white'
                              }`}
                            >
                              {result.isCorrect ? (
                                <CheckCircle size={20} />
                              ) : (
                                <X size={20} />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm text-gray-400 mb-1">
                                Question {index + 1}
                              </div>
                              <h3 className="text-lg md:text-xl font-semibold text-white mb-4">
                                {result.question}
                              </h3>
                            </div>
                          </div>

                          <div className="space-y-2 ml-11">
                            {result.options.map((option, optionIndex) => {
                              const isCorrect = optionIndex === result.correctIndex;
                              const isUserAnswer = optionIndex === result.userAnswer;
                              const isWrongAnswer = isUserAnswer && !isCorrect;

                              return (
                                <div
                                  key={optionIndex}
                                  className={`p-3 rounded-lg border-2 flex items-center gap-3 ${
                                    isCorrect
                                      ? 'bg-green-500/20 border-green-500/50'
                                      : isWrongAnswer
                                      ? 'bg-red-500/20 border-red-500/50'
                                      : 'bg-white/5 border-gray-700'
                                  }`}
                                >
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                      isCorrect
                                        ? 'border-green-400 bg-green-400'
                                        : isWrongAnswer
                                        ? 'border-red-400 bg-red-400'
                                        : 'border-gray-500'
                                    }`}
                                  >
                                    {isCorrect && (
                                      <CheckCircle size={14} className="text-white" />
                                    )}
                                    {isWrongAnswer && (
                                      <X size={14} className="text-white" />
                                    )}
                                  </div>
                                  <span
                                    className={`flex-1 ${
                                      isCorrect
                                        ? 'text-green-200 font-medium'
                                        : isWrongAnswer
                                        ? 'text-red-200 font-medium'
                                        : 'text-gray-300'
                                    }`}
                                  >
                                    {option}
                                  </span>
                                  {isCorrect && (
                                    <span className="text-xs text-green-300 font-semibold px-2 py-1 bg-green-500/30 rounded">
                                      Correct
                                    </span>
                                  )}
                                  {isWrongAnswer && (
                                    <span className="text-xs text-red-300 font-semibold px-2 py-1 bg-red-500/30 rounded">
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

              <div className="glass-effect p-8 rounded-2xl mb-8 text-center">
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

              <div className="text-sm text-gray-500 text-center">
                Thank you for being a true ARMY member! 💜
              </div>
            </>
          ) : (
            <>
              <div className="mb-8 text-center">
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-500">
                  <XCircle size={48} className="text-red-400" />
                </div>
                <h1 className="text-5xl font-bold mb-4 text-red-400">
                  Quiz Not Passed
                </h1>
                <p className="text-xl text-gray-300 mb-2">
                  You scored {score}/10 (minimum 7 required)
                </p>
                <p className="text-sm text-gray-400">
                  Review the correct answers below
                </p>
              </div>

              {/* Quiz Results */}
              {questionResults.length > 0 && (
                <div className="glass-effect p-6 md:p-8 rounded-2xl mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                      Quiz Results
                    </h2>
                    <button
                      onClick={() => setShowAnswers(!showAnswers)}
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {showAnswers ? 'Hide Answers' : 'Show Answers'}
                    </button>
                  </div>

                  {showAnswers && (
                    <div className="space-y-6">
                      {questionResults.map((result, index) => (
                      <div
                        key={result.id}
                        className={`p-4 md:p-5 rounded-xl border-2 ${
                          result.isCorrect
                            ? 'bg-green-500/10 border-green-500/50'
                            : 'bg-red-500/10 border-red-500/50'
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-4">
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              result.isCorrect
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                            }`}
                          >
                            {result.isCorrect ? (
                              <CheckCircle size={20} />
                            ) : (
                              <X size={20} />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-400 mb-1">
                              Question {index + 1}
                            </div>
                            <h3 className="text-lg md:text-xl font-semibold text-white mb-4">
                              {result.question}
                            </h3>
                          </div>
                        </div>

                        <div className="space-y-2 ml-11">
                          {result.options.map((option, optionIndex) => {
                            const isCorrect = optionIndex === result.correctIndex;
                            const isUserAnswer = optionIndex === result.userAnswer;
                            const isWrongAnswer = isUserAnswer && !isCorrect;

                            return (
                              <div
                                key={optionIndex}
                                className={`p-3 rounded-lg border-2 flex items-center gap-3 ${
                                  isCorrect
                                    ? 'bg-green-500/20 border-green-500/50'
                                    : isWrongAnswer
                                    ? 'bg-red-500/20 border-red-500/50'
                                    : 'bg-white/5 border-gray-700'
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    isCorrect
                                      ? 'border-green-400 bg-green-400'
                                      : isWrongAnswer
                                      ? 'border-red-400 bg-red-400'
                                      : 'border-gray-500'
                                  }`}
                                >
                                  {isCorrect && (
                                    <CheckCircle size={14} className="text-white" />
                                  )}
                                  {isWrongAnswer && (
                                    <X size={14} className="text-white" />
                                  )}
                                </div>
                                <span
                                  className={`flex-1 ${
                                    isCorrect
                                      ? 'text-green-200 font-medium'
                                      : isWrongAnswer
                                      ? 'text-red-200 font-medium'
                                      : 'text-gray-300'
                                  }`}
                                >
                                  {option}
                                </span>
                                {isCorrect && (
                                  <span className="text-xs text-green-300 font-semibold px-2 py-1 bg-green-500/30 rounded">
                                    Correct
                                  </span>
                                )}
                                {isWrongAnswer && (
                                  <span className="text-xs text-red-300 font-semibold px-2 py-1 bg-red-500/30 rounded">
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

              <div className="glass-effect p-6 md:p-8 rounded-2xl">
                <p className="text-gray-300 mb-6 text-center">
                  Don&apos;t worry! You can try again after listening to more BTS music and learning more about the group.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/verification')}
                    className="gradient-purple px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-all"
                  >
                    Try Quiz Again
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-all border-2 border-gray-700 hover:border-gray-600 text-gray-300"
                  >
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
