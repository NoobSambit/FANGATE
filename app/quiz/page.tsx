'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

export default function QuizPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const verificationId = searchParams.get('verificationId');
  const initialSpotifyScore = Number(searchParams.get('fanScore') || '0');
  const envEnableSpotify =
    process.env.NEXT_PUBLIC_ENABLE_SPOTIFY_VERIFICATION === 'true';
  const isMockFlow =
    searchParams.get('mocked') === 'true' || !envEnableSpotify;

  const [questions, setQuestions] = useState<any[]>([]);
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (envEnableSpotify && status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (!verificationId) {
      router.push('/verification');
      return;
    }

    fetchQuestions();
  }, [status, verificationId, router, envEnableSpotify]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!hasSubmittedRef.current) {
        hasSubmittedRef.current = true;
        const submitTimer = setTimeout(() => {
          handleSubmit();
        }, 100);
        return () => clearTimeout(submitTimer);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/quiz');
      const data = await res.json();
      
      if (res.ok && Array.isArray(data) && data.length > 0) {
        setQuestions(data);
        setQuestionIds(data.map((q: any) => q.id));
        setAnswers(new Array(data.length).fill(-1));
        setLoading(false);
        setError(null);
      } else {
        const errorMsg = data.error || 'No questions available. Please contact support.';
        console.error('Failed to fetch quiz:', data);
        setError(errorMsg);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch quiz:', error);
      setError('Failed to load quiz. Please try again.');
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      setSelectedAnswer(newAnswers[nextQuestion] >= 0 ? newAnswers[nextQuestion] : null);
    } else {
      handleSubmit(newAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = selectedAnswer !== null ? selectedAnswer : -1;
      setAnswers(newAnswers);
      
      const prevQuestion = currentQuestion - 1;
      setCurrentQuestion(prevQuestion);
      setSelectedAnswer(newAnswers[prevQuestion] >= 0 ? newAnswers[prevQuestion] : null);
    }
  };

  const handleSubmit = async (finalAnswers?: number[]) => {
    // Prevent multiple submissions
    if (hasSubmittedRef.current || submitting) {
      return;
    }
    hasSubmittedRef.current = true;
    setSubmitting(true);
    const submittedAnswers = finalAnswers || answers;

    if (!questionIds || questionIds.length === 0) {
      console.error('Question IDs not available');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: submittedAnswers,
          questionIds: questionIds,
          verificationId,
          spotifyScore: initialSpotifyScore,
        }),
      });

      const result = await res.json();
      
      if (!res.ok) {
        console.error('Quiz submission error:', result);
        setSubmitting(false);
        return;
      }

      if (result.questions && typeof window !== 'undefined') {
        sessionStorage.setItem('quizResults', JSON.stringify(result.questions));
        // Store additional data for success page
        sessionStorage.setItem('quizData', JSON.stringify({
          quizScore: result.score,
          quizPassed: result.quizPassed,
          spotifyScore: result.spotifyScore,
          combinedScore: result.combinedScore,
        }));
      }

      const mockedParam =
        typeof result.mocked === 'boolean'
          ? result.mocked
          : isMockFlow;
      router.push(
        `/success?passed=${result.overallPassed}&score=${result.score}&verificationId=${verificationId}&quizPassed=${result.quizPassed}&combinedScore=${result.combinedScore}&spotifyScore=${result.spotifyScore}&mocked=${mockedParam}`,
      );
    } catch (error) {
      console.error('Quiz submission error:', error);
      setSubmitting(false);
    }
  };

  if ((envEnableSpotify && status === 'loading') || loading) {
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
        <div className="glass-effect p-8 rounded-xl max-w-md mx-auto text-center">
          <div className="text-red-400 text-xl font-bold mb-4">Error</div>
          <div className="text-white/70 mb-6">{error}</div>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchQuestions();
            }}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-xl text-white/60">No questions available</div>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="text-sm text-white/60">
              Question {currentQuestion + 1} of {questions.length}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
              <Clock size={16} className="text-purple-400" />
              <span className={`font-mono text-sm ${timeLeft < 60 ? 'text-red-400' : 'text-white/90'}`}>
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full gradient-purple transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          {questions[currentQuestion] && (
            <div className="glass-effect p-6 sm:p-8 rounded-xl">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-8 leading-relaxed">
                {questions[currentQuestion].question}
              </h2>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {questions[currentQuestion].options.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnswer(index)}
                    className={`w-full p-4 rounded-lg text-left transition-all border ${
                      selectedAnswer === index
                        ? 'bg-purple-500/20 border-purple-500/50 text-white'
                        : 'bg-white/2 border-white/10 text-white/80 hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedAnswer === index
                            ? 'border-purple-400 bg-purple-400'
                            : 'border-white/30'
                        }`}
                      >
                        {selectedAnswer === index && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="text-sm sm:text-base">{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                {currentQuestion > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="btn-secondary flex-1 sm:flex-none inline-flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={18} />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={selectedAnswer === null || submitting}
                  className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                >
                  {currentQuestion < questions.length - 1 ? (
                    <>
                      <span>Next</span>
                      <ArrowRight size={18} />
                    </>
                  ) : submitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <span>Submit Quiz</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
