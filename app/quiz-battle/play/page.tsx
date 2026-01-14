'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Trophy, Loader2, ChevronRight, Users } from 'lucide-react';
import { QUIZ_BATTLE_CONFIG, getTimeRemaining } from '@/lib/quiz-config';

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
  const [timeRemaining, setTimeRemaining] = useState<number>(QUIZ_BATTLE_CONFIG.TIME_LIMIT_SECONDS);
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
          const remaining = getTimeRemaining(data.battle.actualStartTime);
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
              const remaining = getTimeRemaining(readyData.actualStartTime);
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
      const remaining = getTimeRemaining(new Date(battleStartTime));
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
            const remaining = getTimeRemaining(completeData.battle.actualStartTime);
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
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d12]">
        <div className="flex items-center gap-3">
          <Loader2 className="text-purple-400 animate-spin" size={24} />
          <span className="text-purple-200/60">Loading battle...</span>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d12] p-4">
        <div className="text-center">
          <div className="text-red-400 mb-4">Failed to load questions</div>
          <button
            onClick={() => router.push('/quiz-battle')}
            className="px-6 py-3 bg-purple-900/30 border border-purple-800/50 rounded-lg text-white hover:bg-purple-900/50 transition-colors"
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
      <div className="min-h-screen bg-[#0d0d12]">
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-2xl w-full">
            {/* Loading Icon */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-purple-900/40 border-2 border-purple-700/50 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-purple-400 animate-spin" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
                Get Ready!
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-purple-200/80 mb-1 sm:mb-2">
                Questions loaded successfully
              </p>
              <p className="text-sm sm:text-base text-purple-200/50">Waiting for all players to be ready...</p>
            </div>

            {/* Progress indicator */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-purple-200/60 text-xs sm:text-sm">Players Ready</span>
                <span className="text-purple-200/60 text-xs sm:text-sm">{readyCount}/{totalPlayers} ready</span>
              </div>
              <div className="h-2 sm:h-3 bg-purple-950/40 rounded-full overflow-hidden border border-purple-900/40">
                <div
                  className="h-full bg-purple-700 transition-all duration-1000 ease-out"
                  style={{ width: `${(readyCount / totalPlayers) * 100}%` }}
                />
              </div>
            </div>

            {/* Players Status Card */}
            <div className="bg-[#15151f] border border-purple-900/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 bg-purple-950/50 rounded-lg">
                  <Users className="text-purple-400 w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] md:w-[24px] md:h-[24px]" />
                </div>
                <span className="text-xl sm:text-2xl font-semibold text-white">Players</span>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {battleStatus.participants.map((p, index) => {
                  const isCurrentPlayer = p.participantId === participantId;
                  const isPlayerReady = p.isReady;

                  return (
                    <div
                      key={p.participantId}
                      className={`flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all ${
                        isCurrentPlayer
                          ? 'bg-purple-950/40 border border-purple-700/50'
                          : 'bg-purple-950/20 border border-purple-900/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                          isPlayerReady
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50'
                            : 'bg-purple-900/30 text-purple-200/50'
                        }`}>
                          {p.nickname.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className={`font-semibold text-sm sm:text-base ${isCurrentPlayer ? 'text-white' : 'text-purple-200/80'}`}>
                              {p.nickname}
                            </span>
                            {isCurrentPlayer && (
                              <span className="px-1.5 sm:px-2 py-0.5 bg-purple-900/50 text-purple-300 text-[10px] sm:text-xs rounded-full">You</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isPlayerReady ? (
                          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-emerald-950/40 text-emerald-400 rounded-lg border border-emerald-900/50">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full" />
                            <span className="font-semibold text-xs sm:text-sm">Ready</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-purple-900/30 text-purple-200/50 rounded-lg">
                            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                            <span className="text-xs sm:text-sm">Loading...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 sm:mt-6 text-center text-purple-200/40 text-xs sm:text-sm">
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
      <div className="min-h-screen bg-[#0d0d12]">
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-2xl w-full">
            {/* Success Icon */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-purple-900/40 border-2 border-purple-700/50 flex items-center justify-center">
                  <Trophy className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
                Quiz Completed!
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-purple-200/80 mb-1 sm:mb-2">
                You answered <span className="font-semibold text-purple-400">{answeredCount}</span> out of <span className="font-semibold text-purple-400">{questions.length}</span> questions
              </p>
              <p className="text-sm sm:text-base text-purple-200/50">Waiting for other players to finish...</p>
            </div>

            {/* Progress indicator */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-purple-200/60 text-xs sm:text-sm">Battle Progress</span>
                <span className="text-purple-200/60 text-xs sm:text-sm">{finishedPlayersCount}/{totalPlayers} players finished</span>
              </div>
              <div className="h-2 sm:h-3 bg-purple-950/40 rounded-full overflow-hidden border border-purple-900/40">
                <div
                  className="h-full bg-purple-700 transition-all duration-1000 ease-out"
                  style={{ width: `${(finishedPlayersCount / totalPlayers) * 100}%` }}
                />
              </div>
            </div>

            {/* Players Status Card */}
            {battleStatus && (
              <div className="bg-[#15151f] border border-purple-900/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-1.5 sm:p-2 bg-purple-950/50 rounded-lg">
                    <Users className="text-purple-400 w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] md:w-[24px] md:h-[24px]" />
                  </div>
                  <span className="text-xl sm:text-2xl font-semibold text-white">Players Status</span>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {battleStatus.participants.map((p, index) => {
                    const isCurrentPlayer = p.participantId === participantId;
                    const playerFinishStatus = battleStatus.participantsFinishStatus?.find(
                      status => status.participantId === p.participantId
                    );
                    const hasPlayerFinished = playerFinishStatus?.finished || false;

                    return (
                      <div
                        key={p.participantId}
                        className={`flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all ${
                          isCurrentPlayer
                            ? 'bg-purple-950/40 border border-purple-700/50'
                            : 'bg-purple-950/20 border border-purple-900/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-4">
                          {/* Rank badge */}
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                            index === 0 ? 'bg-amber-950/40 text-amber-400 border border-amber-800/50' :
                            index === 1 ? 'bg-zinc-800/50 text-zinc-300 border border-zinc-700/50' :
                            index === 2 ? 'bg-orange-950/40 text-orange-400 border border-orange-800/50' :
                            'bg-purple-900/30 text-purple-200/50'
                          }`}>
                            #{index + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className={`font-semibold text-sm sm:text-base ${isCurrentPlayer ? 'text-white' : 'text-purple-200/80'}`}>
                                {p.nickname}
                              </span>
                              {isCurrentPlayer && (
                                <span className="px-1.5 sm:px-2 py-0.5 bg-purple-900/50 text-purple-300 text-[10px] sm:text-xs rounded-full">You</span>
                              )}
                            </div>
                            <span className="text-purple-200/40 text-xs sm:text-sm">Score: {p.score}</span>
                          </div>
                        </div>

                        <div>
                          {hasPlayerFinished ? (
                            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-emerald-950/40 text-emerald-400 rounded-lg border border-emerald-900/50">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full" />
                              <span className="font-semibold text-xs sm:text-sm">Finished</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-purple-900/30 text-purple-200/50 rounded-lg">
                              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                              <span className="text-xs sm:text-sm">Playing...</span>
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
            <div className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-purple-950/40 border border-purple-900/40 rounded-xl">
              <Clock className="text-purple-400 w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] md:w-[24px] md:h-[24px]" />
              <span className="text-purple-200/60 text-sm sm:text-base">Time remaining:</span>
              <span className="text-xl sm:text-2xl font-mono font-semibold text-white">
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
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
