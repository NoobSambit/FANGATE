'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Trophy, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
}

export default function PlayPage() {
  const router = useRouter();

  const [battleId, setBattleId] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ [questionId: string]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState(150); // 150 seconds
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [score, setScore] = useState(0);
  const [answerFeedback, setAnswerFeedback] = useState<{ show: boolean; isCorrect: boolean }>({
    show: false,
    isCorrect: false,
  });

  // Load battle data and questions
  useEffect(() => {
    const storedBattleId = sessionStorage.getItem('quizBattle_battleId');
    const storedParticipantId = sessionStorage.getItem('quizBattle_participantId');

    if (!storedBattleId || !storedParticipantId) {
      router.push('/quiz-battle');
      return;
    }

    setBattleId(storedBattleId);
    setParticipantId(storedParticipantId);

    const loadBattle = async () => {
      try {
        const response = await fetch(`/api/quiz-battle/status?battleId=${storedBattleId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load battle');
        }

        if (data.battle.status !== 'active') {
          router.push('/quiz-battle/lobby');
          return;
        }

        // Fetch questions by IDs
        const questionIds = data.battle.questionIds;
        const questionsResponse = await fetch(`/api/quiz?questionIds=${questionIds.join(',')}`);

        if (!questionsResponse.ok) {
          throw new Error('Failed to fetch questions');
        }

        const battleQuestions = await questionsResponse.json();
        setQuestions(battleQuestions);

        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load battle');
        setLoading(false);
      }
    };

    loadBattle();
  }, [router]);

  // Timer countdown
  useEffect(() => {
    if (loading || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishBattle();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeRemaining]);

  const handleAnswerSelect = async (answerIndex: number) => {
    if (submitting) return;

    setSelectedAnswer(answerIndex);
    setSubmitting(true);

    try {
      const currentQuestion = questions[currentQuestionIndex];

      const response = await fetch('/api/quiz-battle/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battleId,
          participantId,
          questionId: currentQuestion.id,
          answerIndex,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit answer');
      }

      // Update answers
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: answerIndex,
      }));

      // Update score
      setScore(data.currentScore);

      // Show feedback
      setAnswerFeedback({ show: true, isCorrect: data.isCorrect });

      // Move to next question after 1 second
      setTimeout(() => {
        setAnswerFeedback({ show: false, isCorrect: false });
        setSelectedAnswer(null);
        setSubmitting(false);

        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
        } else {
          handleFinishBattle();
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer');
      setSubmitting(false);
    }
  };

  const handleFinishBattle = () => {
    router.push('/quiz-battle/results');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex items-center gap-3">
          <Loader2 className="text-purple-500 animate-spin" size={24} />
          <span className="text-white/70">Loading battle...</span>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <div className="text-red-400 mb-4">Failed to load questions</div>
          <button
            onClick={() => router.push('/quiz-battle')}
            className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
          >
            Back to Quiz Battle
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-purple-950/20 via-transparent to-pink-950/20 pointer-events-none" />

      <div className="relative z-10">
        {/* Top Bar */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Timer */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
              <Clock className="text-purple-400" size={20} />
              <span className="text-white font-mono font-bold">
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
              <Trophy className="text-yellow-400" size={20} />
              <span className="text-white font-bold">{score}/{questions.length}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-3xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/60">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-sm text-white/60">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="mb-8 p-8 bg-white/5 border border-white/10 rounded-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 leading-relaxed">
                {currentQuestion.question}
              </h2>

              {/* Answer Options */}
              <div className="space-y-4">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const showFeedback = answerFeedback.show && isSelected;

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={submitting}
                      className={`w-full p-5 text-left rounded-xl border-2 transition-all ${
                        showFeedback
                          ? answerFeedback.isCorrect
                            ? 'bg-green-500/20 border-green-500/50'
                            : 'bg-red-500/20 border-red-500/50'
                          : isSelected
                          ? 'bg-purple-500/20 border-purple-500/50'
                          : 'bg-white/5 border-white/10 hover:border-purple-500/30 hover:bg-white/10'
                      } disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              showFeedback
                                ? answerFeedback.isCorrect
                                  ? 'bg-green-500 text-white'
                                  : 'bg-red-500 text-white'
                                : isSelected
                                ? 'bg-purple-500 text-white'
                                : 'bg-white/10 text-white/60'
                            }`}
                          >
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="text-lg text-white">{option}</span>
                        </div>
                        {showFeedback && (
                          answerFeedback.isCorrect ? (
                            <CheckCircle className="text-green-400" size={24} />
                          ) : (
                            <XCircle className="text-red-400" size={24} />
                          )
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                {error}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
