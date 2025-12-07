'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Trophy, Loader2, ChevronRight, Users } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
}

interface BattleStatus {
  status: string;
  participants: Array<{
    participantId: string;
    nickname: string;
    score: number;
  }>;
  startedAt: string;
  participantsFinishStatus?: Array<{
    participantId: string;
    finished: boolean;
  }>;
}

export default function PlayPage() {
  const router = useRouter();

  const [battleId, setBattleId] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ [questionId: string]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds
  const [loading, setLoading] = useState(true);
  const [battleStartTime, setBattleStartTime] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [battleStatus, setBattleStatus] = useState<BattleStatus | null>(null);
  const [hasFinished, setHasFinished] = useState(false);
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);

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

        setBattleStatus(data.battle);

        // Store battle start time for continuous calculation
        const startedAt = new Date(data.battle.startedAt).getTime();
        setBattleStartTime(startedAt);

        // Calculate initial time remaining based on server timestamp
        const now = Date.now();
        const elapsed = Math.floor((now - startedAt) / 1000);
        const remaining = Math.max(0, 60 - elapsed);
        setTimeRemaining(remaining);

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

  // Timer countdown - recalculates from server time every second to prevent tab pause issues
  useEffect(() => {
    if (loading || !battleStartTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - battleStartTime) / 1000);
      const remaining = Math.max(0, 60 - elapsed);

      setTimeRemaining(remaining);

      if (remaining <= 0 && !hasFinished) {
        handleFinishBattle();
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [loading, battleStartTime]);

  // Poll battle status every 2 seconds during gameplay
  useEffect(() => {
    if (loading || !battleId) return;

    const pollStatus = async () => {
      try {
        // Check if battle should be completed
        const completeResponse = await fetch('/api/quiz-battle/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ battleId }),
        });

        const completeData = await completeResponse.json();

        if (completeResponse.ok) {
          // Update battle status with finish status
          setBattleStatus({
            ...completeData.battle,
            participantsFinishStatus: completeData.participantsFinishStatus,
          });

          // Redirect to results when battle is completed
          if (completeData.completed || completeData.battle.status === 'completed') {
            router.push('/quiz-battle/results');
          }
        }
      } catch (err) {
        console.error('Failed to poll status:', err);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [loading, battleId, router]);

  const handleAnswerSelect = (answerIndex: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    setSelectedAnswer(answerIndex);

    // Store answer locally (no server submission yet)
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answerIndex,
    }));
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return; // Must select an answer first

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      // Load previously selected answer for the next question
      const nextQuestion = questions[currentQuestionIndex + 1];
      setSelectedAnswer(answers[nextQuestion.id] ?? null);
    } else {
      // User finished all questions
      handleFinishBattle();
    }
  };

  // Load saved answer when question changes
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex >= 0) {
      const currentQuestion = questions[currentQuestionIndex];
      setSelectedAnswer(answers[currentQuestion.id] ?? null);
    }
  }, [currentQuestionIndex, questions]);

  const handleFinishBattle = async () => {
    if (isSubmittingAnswers) return;

    setIsSubmittingAnswers(true);
    setHasFinished(true);

    try {
      // Submit all answers to server
      const submissionPromises = Object.entries(answers).map(([questionId, answerIndex]) =>
        fetch('/api/quiz-battle/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            battleId,
            participantId,
            questionId,
            answerIndex,
          }),
        })
      );

      await Promise.all(submissionPromises);

      // Wait for other players - show waiting screen
      // Battle status polling will redirect when all players finish or time runs out
    } catch (err: any) {
      setError('Failed to submit answers');
      setIsSubmittingAnswers(false);
    }
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

  // Show waiting screen when user has finished
  if (hasFinished) {
    const answeredCount = Object.keys(answers).length;
    const finishedPlayersCount = battleStatus?.participantsFinishStatus?.filter(p => p.finished).length || 1;
    const totalPlayers = battleStatus?.participants.length || 1;

    return (
      <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
        {/* Animated background */}
        <div className="fixed inset-0 bg-gradient-to-br from-purple-950/30 via-[#0a0a0f] to-pink-950/30 pointer-events-none" />

        {/* Animated orbs */}
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Success Icon with animation */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-bounce-slow">
                  <Trophy className="w-16 h-16 text-white" />
                </div>
                <div className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-ping opacity-20" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4 animate-gradient">
                Quiz Completed!
              </h1>
              <p className="text-2xl text-white/90 mb-2">
                You answered <span className="font-bold text-purple-400">{answeredCount}</span> out of <span className="font-bold text-pink-400">{questions.length}</span> questions
              </p>
              <p className="text-white/60 text-lg">Waiting for other players to finish...</p>
            </div>

            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/70 text-sm">Battle Progress</span>
                <span className="text-white/70 text-sm">{finishedPlayersCount}/{totalPlayers} players finished</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-out"
                  style={{ width: `${(finishedPlayersCount / totalPlayers) * 100}%` }}
                />
              </div>
            </div>

            {/* Players Status Card */}
            {battleStatus && (
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl mb-6">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Users className="text-purple-400" size={24} />
                  </div>
                  <span className="text-2xl font-bold text-white">Players Status</span>
                </div>

                <div className="space-y-3">
                  {battleStatus.participants.map((p, index) => {
                    const isCurrentPlayer = p.participantId === participantId;
                    const playerFinishStatus = battleStatus.participantsFinishStatus?.find(
                      status => status.participantId === p.id
                    );
                    const hasPlayerFinished = playerFinishStatus?.finished || false;

                    return (
                      <div
                        key={p.participantId}
                        className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                          isCurrentPlayer
                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50'
                            : 'bg-white/5 border border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Rank badge */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50' :
                            index === 1 ? 'bg-gray-400/20 text-gray-300 border-2 border-gray-400/50' :
                            index === 2 ? 'bg-orange-600/20 text-orange-400 border-2 border-orange-600/50' :
                            'bg-white/10 text-white/60'
                          }`}>
                            #{index + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${isCurrentPlayer ? 'text-white text-lg' : 'text-white/80'}`}>
                                {p.nickname}
                              </span>
                              {isCurrentPlayer && (
                                <span className="px-2 py-0.5 bg-purple-500/30 text-purple-300 text-xs rounded-full">You</span>
                              )}
                            </div>
                            <span className="text-white/50 text-sm">Score: {p.score}</span>
                          </div>
                        </div>

                        <div>
                          {hasPlayerFinished ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                              <span className="font-semibold">Finished</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white/60 rounded-lg">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Playing...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Timer */}
            <div className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/20 rounded-xl">
              <Clock className="text-purple-400" size={24} />
              <span className="text-white/70">Time remaining:</span>
              <span className="text-2xl font-mono font-bold text-white">
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes bounce-slow {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-20px);
            }
          }

          @keyframes gradient {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }

          .animate-bounce-slow {
            animation: bounce-slow 3s ease-in-out infinite;
          }

          .animate-gradient {
            background-size: 200% auto;
            animation: gradient 3s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

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

            {/* Answered count */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
              <Trophy className="text-yellow-400" size={20} />
              <span className="text-white font-bold">{answeredCount}/{questions.length}</span>
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

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`w-full p-5 text-left rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'bg-purple-500/20 border-purple-500/50'
                          : 'bg-white/5 border-white/10 hover:border-purple-500/30 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            isSelected
                              ? 'bg-purple-500 text-white'
                              : 'bg-white/10 text-white/60'
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-lg text-white">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Question Button */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/60">
                {selectedAnswer !== null ? 'Answer selected' : 'Select an answer to continue'}
              </div>
              <button
                onClick={handleNextQuestion}
                disabled={selectedAnswer === null}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  selectedAnswer !== null
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center mt-4">
                {error}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
