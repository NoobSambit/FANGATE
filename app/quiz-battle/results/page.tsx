'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Crown, Download, Home, CheckCircle, XCircle, Loader2, Award } from 'lucide-react';
import Link from 'next/link';

interface QuestionResult {
  questionId: string;
  question: string;
  options: string[];
  correctIndex: number;
  userAnswer: number;
  isCorrect: boolean;
  answered: boolean;
}

interface ParticipantResult {
  participantId: string;
  nickname: string;
  isHost: boolean;
  score: number;
  totalQuestions: number;
  percentage: number;
  questionResults: QuestionResult[];
}

interface Winner {
  participantId: string;
  nickname: string;
  score: number;
}

export default function ResultsPage() {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [results, setResults] = useState<ParticipantResult[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [myResult, setMyResult] = useState<ParticipantResult | null>(null);
  const [error, setError] = useState('');
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    const battleId = sessionStorage.getItem('quizBattle_battleId');
    const participantId = sessionStorage.getItem('quizBattle_participantId');

    if (!battleId || !participantId) {
      router.push('/quiz-battle');
      return;
    }

    const loadResults = async () => {
      try {
        const response = await fetch('/api/quiz-battle/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ battleId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load results');
        }

        setResults(data.participantResults);
        setWinners(data.winners);

        // Find my result
        const myRes = data.participantResults.find(
          (p: ParticipantResult) => p.participantId === participantId
        );
        setMyResult(myRes || null);

        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load results');
        setLoading(false);
      }
    };

    loadResults();
  }, [router]);

  const handleDownloadCard = async () => {
    if (!cardRef.current || downloading || !myResult) {
      return;
    }

    let container: HTMLDivElement | null = null;

    try {
      setDownloading(true);

      const html2canvasModule = await import('html2canvas');
      const rect = cardRef.current.getBoundingClientRect();

      // Clone the card
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

      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );

      const canvas = await html2canvasModule.default(clone, {
        backgroundColor: '#140022',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.download = `fangate-quiz-battle-${myResult.nickname}.jpg`;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex items-center gap-3">
          <Loader2 className="text-purple-500 animate-spin" size={24} />
          <span className="text-white/70">Loading results...</span>
        </div>
      </div>
    );
  }

  if (error || !myResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error || 'Failed to load results'}</div>
          <Link
            href="/quiz-battle"
            className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white inline-block"
          >
            Back to Quiz Battle
          </Link>
        </div>
      </div>
    );
  }

  const isWinner = winners.some((w) => w.participantId === myResult.participantId);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-purple-950/20 via-transparent to-pink-950/20 pointer-events-none" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg border border-purple-500/40 overflow-hidden bg-white/5">
                <img
                  src="/fangate-logo.png"
                  alt="FanGate logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold text-white">
                Fan<span className="text-purple-400">Gate</span>
              </span>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors"
            >
              <Home size={16} />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 bg-purple-500/10 border border-purple-500/20 rounded-full">
                <Trophy className="text-purple-400" size={14} />
                <span className="text-sm text-purple-300 font-medium">Battle Complete!</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black mb-4 text-white">
                {isWinner ? (
                  <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent">
                    You Won!
                  </span>
                ) : (
                  'Battle Results'
                )}
              </h1>
            </div>

            {/* Leaderboard */}
            <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Trophy className="text-yellow-400" size={24} />
                Leaderboard
              </h2>

              <div className="space-y-3">
                {results.map((participant, index) => {
                  const isMe = participant.participantId === myResult.participantId;
                  const isTopThree = index < 3;

                  return (
                    <div
                      key={participant.participantId}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                        isMe
                          ? 'bg-purple-500/20 border-purple-500/50'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            isTopThree
                              ? index === 0
                                ? 'bg-yellow-500 text-white'
                                : index === 1
                                ? 'bg-gray-400 text-white'
                                : 'bg-orange-600 text-white'
                              : 'bg-white/10 text-white/60'
                          }`}
                        >
                          {index === 0 ? (
                            <Crown size={20} />
                          ) : (
                            <span>#{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <div className="text-white font-semibold flex items-center gap-2">
                            {participant.nickname}
                            {isMe && (
                              <span className="text-xs px-2 py-0.5 bg-purple-500/30 border border-purple-500/50 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-white/60">
                            {participant.percentage}% correct
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {participant.score}
                        </div>
                        <div className="text-sm text-white/60">
                          / {participant.totalQuestions}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My Answers */}
            <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Your Answers</h2>

              <div className="space-y-4">
                {myResult.questionResults.map((question, index) => (
                  <div
                    key={question.questionId}
                    className={`p-4 rounded-xl border ${
                      question.isCorrect
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 mt-1">
                        {question.isCorrect ? (
                          <CheckCircle className="text-green-400" size={20} />
                        ) : (
                          <XCircle className="text-red-400" size={20} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white/60 mb-1">
                          Question {index + 1}
                        </div>
                        <div className="text-white font-medium mb-3">
                          {question.question}
                        </div>

                        {!question.isCorrect && (
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="text-red-400">Your answer: </span>
                              <span className="text-white/80">
                                {question.options[question.userAnswer]}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-green-400">Correct answer: </span>
                              <span className="text-white/80">
                                {question.options[question.correctIndex]}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowCard(true)}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Award size={20} />
                View Scorecard
              </button>
              <Link
                href="/quiz-battle"
                className="flex-1 px-6 py-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-white font-semibold transition-colors text-center"
              >
                New Battle
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Scorecard Modal */}
      {showCard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-lg w-full">
            {/* Downloadable Card */}
            <div
              ref={cardRef}
              className="bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 p-8 rounded-2xl shadow-2xl mb-4"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <Trophy className="text-yellow-400" size={32} />
                </div>
                <h3 className="text-3xl font-black text-white mb-2">
                  Quiz Battle
                </h3>
                <div className="text-purple-200 text-sm">FanGate ARMY Challenge</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-white mb-1">
                    {myResult.nickname}
                  </div>
                  {isWinner && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full">
                      <Crown className="text-yellow-400" size={14} />
                      <span className="text-sm text-yellow-300 font-semibold">Winner!</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white/10 rounded-lg">
                    <div className="text-2xl font-bold text-white">
                      {myResult.score}
                    </div>
                    <div className="text-xs text-purple-200">Score</div>
                  </div>
                  <div className="text-center p-3 bg-white/10 rounded-lg">
                    <div className="text-2xl font-bold text-white">
                      {myResult.percentage}%
                    </div>
                    <div className="text-xs text-purple-200">Accuracy</div>
                  </div>
                  <div className="text-center p-3 bg-white/10 rounded-lg">
                    <div className="text-2xl font-bold text-white">
                      #{results.findIndex((r) => r.participantId === myResult.participantId) + 1}
                    </div>
                    <div className="text-xs text-purple-200">Rank</div>
                  </div>
                </div>
              </div>

              <div className="text-center text-purple-200 text-sm">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDownloadCard}
                disabled={downloading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {downloading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Download Card
                  </>
                )}
              </button>
              <button
                onClick={() => setShowCard(false)}
                className="px-6 py-3 bg-white/10 border border-white/20 hover:border-white/30 rounded-xl text-white font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
