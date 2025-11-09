'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Clock, ChevronRight } from 'lucide-react';

export default function QuizPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const verificationId = searchParams.get('verificationId');

  const [questions, setQuestions] = useState<any[]>([]);
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (!verificationId) {
      router.push('/verification');
      return;
    }

    fetchQuestions();
  }, [status, verificationId, router]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/quiz');
      const data = await res.json();
      
      if (res.ok && Array.isArray(data) && data.length > 0) {
        setQuestions(data);
        // Extract question IDs in the same order as questions
        setQuestionIds(data.map((q: any) => q.id));
        // Initialize answers array with -1 (unanswered)
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
      // Restore previously selected answer if exists, otherwise reset to null
      setSelectedAnswer(newAnswers[nextQuestion] >= 0 ? newAnswers[nextQuestion] : null);
    } else {
      handleSubmit(newAnswers);
    }
  };

  // Update selected answer when question changes
  useEffect(() => {
    if (answers[currentQuestion] >= 0) {
      setSelectedAnswer(answers[currentQuestion]);
    } else {
      setSelectedAnswer(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion]);

  const handleSubmit = async (finalAnswers?: number[]) => {
    setSubmitting(true);
    const submittedAnswers = finalAnswers || answers;

    // Ensure we have question IDs
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
        }),
      });

      const result = await res.json();
      
      if (!res.ok) {
        console.error('Quiz submission error:', result);
        setSubmitting(false);
        return;
      }

      router.push(`/success?passed=${result.passed}&score=${result.score}&verificationId=${verificationId}`);
    } catch (error) {
      console.error('Quiz submission error:', error);
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#16003b]">
        <div className="text-2xl text-purple-400">Loading quiz...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#16003b]">
        <div className="glass-effect p-8 rounded-2xl max-w-md mx-auto text-center">
          <div className="text-red-400 text-xl font-bold mb-4">Error</div>
          <div className="text-gray-300 mb-6">{error}</div>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchQuestions();
            }}
            className="gradient-purple px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#16003b]">
        <div className="text-2xl text-purple-400">No questions available</div>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#16003b] py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="text-sm text-gray-400">
              Question {currentQuestion + 1} of {questions.length}
            </div>
            <div className="flex items-center gap-2 glass-effect px-4 py-2 rounded-full">
              <Clock size={16} className="text-purple-400" />
              <span className={timeLeft < 60 ? 'text-red-400' : 'text-gray-300'}>
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full gradient-purple transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {questions[currentQuestion] && (
            <div className="glass-effect p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-8">
                {questions[currentQuestion].question}
              </h2>

              <div className="space-y-3 mb-8">
                {questions[currentQuestion].options.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnswer(index)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      selectedAnswer === index
                        ? 'gradient-purple glow-purple'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedAnswer === index
                            ? 'border-white bg-white'
                            : 'border-gray-500'
                        }`}
                      >
                        {selectedAnswer === index && (
                          <div className="w-3 h-3 bg-purple-600 rounded-full" />
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={selectedAnswer === null || submitting}
                className="w-full gradient-purple py-4 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {currentQuestion < questions.length - 1 ? (
                  <>
                    Next Question
                    <ChevronRight size={20} />
                  </>
                ) : submitting ? (
                  'Submitting...'
                ) : (
                  'Submit Quiz'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
