'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Trophy, Loader2, ChevronRight, Users } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  choices: string[];
  difficulty?: string;
  tags?: string[];
  members?: string[];
  eras?: string[];
  locale?: string;
  source?: string;
  explanation?: string;
}

interface BattleStatus {
  status: string;
  participants: Array<{
    participantId: string;
    nickname: string;
    score: number;
    isReady: boolean;
  }>;
  startedAt: string;
  actualStartTime: string | null;
  participantsFinishStatus?: Array<{
    participantId: string;
    finished: boolean;
  }>;
}

export default function PlayPage() {
  const router = useRouter();

  // Use ref to prevent multiple simultaneous submissions
  const isSubmittingRef = useRef(false);

  const [battleId, setBattleId] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ [questionId: string]: number }>({});
  const answersRef = useRef<{ [questionId: string]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds
  const [loading, setLoading] = useState(true);
  const [battleStartTime, setBattleStartTime] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [battleStatus, setBattleStatus] = useState<BattleStatus | null>(null);
  const [hasFinished, setHasFinished] = useState(false);
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);
  const [waitingForPlayers, setWaitingForPlayers] = useState(true);
  const [hasMarkedReady, setHasMarkedReady] = useState(false);

  // Load battle data and questions
  useEffect(() => {
    const storedBattleId = sessionStorage.getItem('quizBattle_battleId');
    const storedParticipantId = sessionStorage.getItem('quizBattle_participantId');

    if (!storedBattleId || !storedParticipantId) {
      router.push('/quiz-battle');
      return;
    }

    // Prevent multiple loads - only run once on mount
    let hasLoaded = false;

    setBattleId(storedBattleId);
    setParticipantId(storedParticipantId);

    const loadBattle = async () => {
      if (hasLoaded) {
        console.log('[PLAY] Skipping duplicate loadBattle call');
        return;
      }
      hasLoaded = true;
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

        // Fetch questions by IDs
        const questionIds = data.battle.questionIds;
        const questionsResponse = await fetch(`/api/quiz?questionIds=${questionIds.join(',')}`);

        if (!questionsResponse.ok) {
          throw new Error('Failed to fetch questions');
        }

        const battleQuestions = await questionsResponse.json();
        setQuestions(battleQuestions);

        setLoading(false);

        console.log('[PLAY] Questions loaded, checking ready status');
        console.log('[PLAY] Battle actualStartTime:', data.battle.actualStartTime);
        console.log('[PLAY] hasMarkedReady:', hasMarkedReady);

        // Check if actualStartTime is already set (all players were already ready)
        if (data.battle.actualStartTime) {
          console.log('[PLAY] actualStartTime already set, starting immediately');
          const actualStart = new Date(data.battle.actualStartTime).getTime();
          setBattleStartTime(actualStart);
          setWaitingForPlayers(false);

          // Calculate initial time remaining
          const now = Date.now();
          const elapsed = Math.floor((now - actualStart) / 1000);
          const remaining = Math.max(0, 60 - elapsed);
          setTimeRemaining(remaining);
        } else {
          // Mark this player as ready now that questions are loaded
          console.log('[PLAY] Marking player as ready');
          const readyResponse = await fetch('/api/quiz-battle/ready', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              battleId: storedBattleId,
              participantId: storedParticipantId,
            }),
          });

          if (readyResponse.ok) {
            const readyData = await readyResponse.json();
            console.log('[PLAY] Ready response:', readyData);
            // If all players are ready, the server will set actualStartTime
            if (readyData.allReady && readyData.actualStartTime) {
              console.log('[PLAY] All players ready! Starting quiz');
              const actualStart = new Date(readyData.actualStartTime).getTime();
              setBattleStartTime(actualStart);
              setWaitingForPlayers(false);

              // Calculate initial time remaining
              const now = Date.now();
              const elapsed = Math.floor((now - actualStart) / 1000);
              const remaining = Math.max(0, 60 - elapsed);
              setTimeRemaining(remaining);
            } else {
              console.log('[PLAY] Waiting for other players to be ready');
            }
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load battle');
        setLoading(false);
      }
    };

    loadBattle();
  }, [router]);

  // Timer countdown - recalculates from server time every second to prevent tab pause issues
  useEffect(() => {
    if (loading || !battleStartTime || waitingForPlayers) return;

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
  }, [loading, battleStartTime, waitingForPlayers]);

  // Poll battle status every 2 seconds during gameplay
  useEffect(() => {
    if (loading || !battleId) return;

    const pollStatus = async () => {
      try {
        // Determine if we need full data or just status
        // We need full data if waiting for players or if finished (to show results/scores)
        // While playing, we only need to know if battle is completed
        const needsFullData = waitingForPlayers || hasFinished;
        
        // Check if battle should be completed
        const completeResponse = await fetch('/api/quiz-battle/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            battleId,
            minimal: !needsFullData 
          }),
        });

        const completeData = await completeResponse.json();

        if (completeResponse.ok) {
          // If we got full battle data, update it
          if (completeData.battle && (needsFullData || !battleStatus)) {
             // Update battle status with finish status
            const updatedBattle = {
              ...completeData.battle,
              participantsFinishStatus: completeData.participantsFinishStatus,
            };
            setBattleStatus(updatedBattle);
          } else if (battleStatus) {
            // Even in minimal mode, we might get status updates (e.g. completion)
             if (completeData.battle.status !== battleStatus.status) {
                setBattleStatus(prev => prev ? ({ ...prev, status: completeData.battle.status }) : null);
             }
          }

          // Check if actualStartTime was just set (all players became ready)
          if (waitingForPlayers && completeData.battle.actualStartTime) {
            console.log('[PLAY] Polling detected actualStartTime, starting quiz');
            const actualStart = new Date(completeData.battle.actualStartTime).getTime();
            setBattleStartTime(actualStart);
            setWaitingForPlayers(false);

            // Calculate initial time remaining
            const now = Date.now();
            const elapsed = Math.floor((now - actualStart) / 1000);
            const remaining = Math.max(0, 60 - elapsed);
            setTimeRemaining(remaining);
          }

          // Redirect to results when battle is completed
          if (completeData.completed || completeData.battle.status === 'completed') {
            router.push('/quiz-battle/results');
          }
        }
      } catch (err) {
        console.error('Failed to poll status:', err);
      }
    };

    // Use a recursive timeout with jitter to prevent thundering herd
    let timeoutId: NodeJS.Timeout;
    
    const scheduleNextPoll = () => {
      const baseInterval = 3000;
      const jitter = Math.random() * 1000; // 0-1000ms jitter
      timeoutId = setTimeout(() => {
        pollStatus().then(scheduleNextPoll);
      }, baseInterval + jitter);
    };

    scheduleNextPoll();

    return () => clearTimeout(timeoutId);
  }, [loading, battleId, router, waitingForPlayers, hasFinished]);

  const handleAnswerSelect = (answerIndex: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    setSelectedAnswer(answerIndex);

    // Store answer locally (no server submission yet)
    const updatedAnswers = {
      ...answersRef.current,
      [currentQuestion.id]: answerIndex,
    };
    answersRef.current = updatedAnswers;
    setAnswers(updatedAnswers);
    
    console.log('[PLAY] Answer selected:', {
      questionId: currentQuestion.id,
      answerIndex,
      totalAnswers: Object.keys(updatedAnswers).length
    });
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
    // Use ref to immediately block multiple calls (faster than state)
    if (isSubmittingRef.current) {
      console.log('[PLAY] Already submitting answers (ref check), skipping');
      return;
    }

    if (isSubmittingAnswers) {
      console.log('[PLAY] Already submitting answers (state check), skipping');
      return;
    }

    console.log('[PLAY] handleFinishBattle called - setting ref and state');
    isSubmittingRef.current = true;
    setIsSubmittingAnswers(true);
    setHasFinished(true);

    const currentAnswers = answersRef.current;
    
    console.log('[PLAY] Finishing battle, submitting answers:', {
      battleId,
      participantId,
      answersCount: Object.keys(currentAnswers).length,
      answers: currentAnswers
    });

    // Submit answers using the current value from ref
    submitAnswersToServer(currentAnswers);
  };

  const submitAnswersToServer = async (answersToSubmit: { [questionId: string]: number }) => {
    console.log('[PLAY] submitAnswersToServer called with', Object.keys(answersToSubmit).length, 'answers');

    if (Object.keys(answersToSubmit).length === 0) {
      console.error('[PLAY] No answers to submit!');
      isSubmittingRef.current = false;
      setIsSubmittingAnswers(false);
      return;
    }

    try {
      console.log('[PLAY] Starting batch submission of', Object.keys(answersToSubmit).length, 'answers');

      // Submit all answers in a single batch request
      const response = await fetch('/api/quiz-battle/answer/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battleId,
          participantId,
          answers: answersToSubmit,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[PLAY] Batch submission failed:', response.status, errorText);
        throw new Error(`Batch submission failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('[PLAY] Batch submission successful:', result);

      // Verify answers were actually saved by fetching them back
      // This prevents the race condition where results page loads before DB commits
      const verifyResponse = await fetch(`/api/quiz-battle/verify-answers?battleId=${battleId}&participantId=${participantId}`);

      if (!verifyResponse.ok) {
        console.error('[PLAY] Failed to verify answers');
        throw new Error('Failed to verify answers were saved');
      }

      const verifyData = await verifyResponse.json();
      console.log('[PLAY] Verified answers count:', verifyData.answerCount, 'expected:', Object.keys(answersToSubmit).length);

      if (verifyData.answerCount < Object.keys(answersToSubmit).length) {
        console.warn('[PLAY] Answer count mismatch! Waiting and retrying...');
        // Wait a bit and retry verification once
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryResponse = await fetch(`/api/quiz-battle/verify-answers?battleId=${battleId}&participantId=${participantId}`);
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          console.log('[PLAY] Retry verified answers count:', retryData.answerCount);
        }
      }

      // Wait for other players - show waiting screen
      // Battle status polling will redirect when all players finish or time runs out
    } catch (err: any) {
      console.error('[PLAY] Error submitting answers:', err);
      setError('Failed to submit answers');
      setIsSubmittingAnswers(false);
      isSubmittingRef.current = false;
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

  // Show waiting screen when waiting for all players to be ready
  if (waitingForPlayers && battleStatus) {
    const readyCount = battleStatus.participants.filter(p => p.isReady).length;
    const totalPlayers = battleStatus.participants.length;

    return (
      <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
        {/* Animated background */}
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/30 via-[#0a0a0f] to-purple-950/30 pointer-events-none" />

        {/* Animated orbs */}
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Loading Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Loader2 className="w-16 h-16 text-white animate-spin" />
                </div>
                <div className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 animate-ping opacity-20" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mb-4">
                Get Ready!
              </h1>
              <p className="text-2xl text-white/90 mb-2">
                Questions loaded successfully
              </p>
              <p className="text-white/60 text-lg">Waiting for all players to be ready...</p>
            </div>

            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/70 text-sm">Players Ready</span>
                <span className="text-white/70 text-sm">{readyCount}/{totalPlayers} ready</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                  style={{ width: `${(readyCount / totalPlayers) * 100}%` }}
                />
              </div>
            </div>

            {/* Players Status Card */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Users className="text-indigo-400" size={24} />
                </div>
                <span className="text-2xl font-bold text-white">Players</span>
              </div>

              <div className="space-y-3">
                {battleStatus.participants.map((p, index) => {
                  const isCurrentPlayer = p.participantId === participantId;
                  const isPlayerReady = p.isReady;

                  return (
                    <div
                      key={p.participantId}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                        isCurrentPlayer
                          ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/50'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          isPlayerReady
                            ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50'
                            : 'bg-white/10 text-white/60'
                        }`}>
                          {p.nickname.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isCurrentPlayer ? 'text-white text-lg' : 'text-white/80'}`}>
                              {p.nickname}
                            </span>
                            {isCurrentPlayer && (
                              <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 text-xs rounded-full">You</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isPlayerReady ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                            <span className="font-semibold">Ready</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white/60 rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 text-center text-white/50 text-sm">
              The timer will start when all players are ready
            </div>
          </div>
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
                      status => status.participantId === p.participantId
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
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background */}
      <div className="fixed top-0 right-0 p-12 bg-indigo-500/5 blur-[120px] rounded-full w-96 h-96 pointer-events-none" />
      <div className="fixed bottom-0 left-0 p-12 bg-emerald-500/5 blur-[120px] rounded-full w-96 h-96 pointer-events-none" />

      <div className="relative z-10">
        {/* Top Bar */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Timer */}
            <div className={`flex items-center gap-3 px-4 py-2.5 bg-zinc-900/50 border rounded-xl backdrop-blur-md transition-colors ${
              timeRemaining < 10 ? 'border-red-500/50 bg-red-500/10' : 'border-white/10'
            }`}>
              <Clock className={timeRemaining < 10 ? 'text-red-400' : 'text-indigo-400'} size={20} />
              <span className={`font-mono font-bold text-lg ${timeRemaining < 10 ? 'text-red-400' : 'text-white'}`}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>

            {/* Answered count */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-xl backdrop-blur-md">
              <Trophy className="text-amber-400" size={20} />
              <span className="text-white font-bold">{answeredCount} <span className="text-zinc-500">/</span> {questions.length}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-4">
          <div className="max-w-3xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-xs font-bold text-white">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="mb-8 p-6 sm:p-10 bg-zinc-900/50 border border-white/10 rounded-3xl backdrop-blur-md shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 leading-relaxed">
                {currentQuestion.question}
              </h2>

              {/* Answer Options */}
              <div className="space-y-4">
                {currentQuestion.choices.map((option, index) => {
                  const isSelected = selectedAnswer === index;

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`group w-full p-4 sm:p-5 text-left rounded-2xl border-2 transition-all duration-200 relative overflow-hidden ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20'
                          : 'bg-black/20 border-white/5 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                            isSelected
                              ? 'bg-white text-indigo-600'
                              : 'bg-white/10 text-zinc-400 group-hover:bg-white/20 group-hover:text-white'
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className={`text-lg font-medium transition-colors ${
                          isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-white'
                        }`}>
                          {option}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Question Button */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-500 font-medium">
                {selectedAnswer !== null ? 'Answer saved' : 'Select an answer'}
              </div>
              <button
                onClick={handleNextQuestion}
                disabled={selectedAnswer === null}
                className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                  selectedAnswer !== null
                    ? 'bg-white text-black hover:scale-105 hover:shadow-white/10'
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish'}
                <ChevronRight size={20} strokeWidth={3} />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center mt-6 font-medium">
                {error}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
