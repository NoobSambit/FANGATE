'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Crown, Download, Home, CheckCircle, XCircle, Loader2, Award, Share2 } from 'lucide-react';
import Link from 'next/link';

interface QuestionResult {
  questionId: string;
  question: string;
  choices: string[];
  answerIndex: number;
  difficulty: string;
  tags: string[];
  members: string[];
  eras: string[];
  locale: string;
  source: string;
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
  // Use lazy initialization to avoid extra render that can cause scroll jumps
  const [formattedDate] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  });

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
      container.style.background = '#18181b'; // Zinc 900
      container.style.padding = '0';
      container.style.width = `${rect.width}px`;
      container.style.height = `${rect.height}px`;
      container.appendChild(clone);
      document.body.appendChild(container);

      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );

      const canvas = await html2canvasModule.default(clone, {
        backgroundColor: '#18181b', // Zinc 900
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
          <Loader2 className="text-indigo-500 animate-spin" size={24} />
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
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background */}
      <div className="fixed top-0 right-0 p-12 bg-amber-500/5 blur-[120px] rounded-full w-96 h-96 pointer-events-none" />
      <div className="fixed bottom-0 left-0 p-12 bg-indigo-500/5 blur-[120px] rounded-full w-96 h-96 pointer-events-none" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg border border-white/10 overflow-hidden bg-white/5">
                <img
                  src="/fangate-logo.png"
                  alt="FanGate logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold text-white">
                Fan<span className="text-indigo-400">Gate</span>
              </span>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors hover:bg-white/5"
            >
              <Home size={16} />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 bg-zinc-900/50 border border-white/10 rounded-full backdrop-blur-md mx-auto sm:mx-0">
                <Trophy className="text-amber-400" size={14} />
                <span className="text-sm text-zinc-300 font-medium">Battle Complete</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h1 className="text-4xl sm:text-6xl font-black text-white mb-2 tracking-tight">
                    {isWinner ? (
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
                        Victory!
                      </span>
                    ) : (
                      'Results'
                    )}
                  </h1>
                  <p className="text-zinc-400 text-lg">
                    {isWinner ? 'You claimed the throne!' : 'Great effort! See how you ranked.'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCard(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all hover:-translate-y-0.5"
                  >
                    <Award size={20} className="text-indigo-400" />
                    <span className="hidden sm:inline">Scorecard</span>
                    <span className="sm:hidden">Card</span>
                  </button>

                  <button
                    onClick={() => {
                      const rank = results.findIndex(r => r.participantId === myResult.participantId) + 1;
                      const totalPlayers = results.length;
                      const score = myResult.score;
                      const totalQuestions = myResult.totalQuestions;
                      const percentage = myResult.percentage;
                      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fangate.army';

                      const shareText = `🎯 Just completed a Quiz Battle on FANGATE!\n\n📊 Ranked #${rank}/${totalPlayers}\n✅ Score: ${score}/${totalQuestions} (${percentage}%)\n\n🎮 Challenge me: ${siteUrl}/quiz-battle\n\n🚀 by @boy_with_code`;

                      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
                      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-white/10"
                  >
                    <Share2 size={20} />
                    <span className="hidden sm:inline">Share on X</span>
                    <span className="sm:hidden">Share</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Leaderboard</h2>
                </div>
                
                <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                  {results.map((participant, index) => {
                    const isMe = participant.participantId === myResult.participantId;

                    return (
                      <div
                        key={participant.participantId}
                        className={`flex items-center justify-between p-4 sm:p-5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${
                          isMe ? 'bg-indigo-500/10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                              index === 1 ? 'bg-zinc-400/10 text-zinc-400 border border-zinc-400/20' :
                              index === 2 ? 'bg-orange-700/10 text-orange-700 border border-orange-700/20' :
                              'bg-white/5 text-zinc-500'
                            }`}
                          >
                            {index === 0 ? <Crown size={18} /> : `#${index + 1}`}
                          </div>
                          <div>
                            <div className="text-white font-bold flex items-center gap-2">
                              {participant.nickname}
                              {isMe && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/20 font-medium uppercase tracking-wide">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 font-medium mt-0.5">
                              {participant.percentage}% Accuracy
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-black text-white">
                            {participant.score}
                          </div>
                          <div className="text-xs text-zinc-500 font-medium">
                            Points
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* My Stats Card */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Your Stats</h2>
                </div>
                
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col gap-6">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-zinc-800 rounded-full flex items-center justify-center border-4 border-zinc-700 mb-3">
                      <span className="text-3xl font-black text-white">{myResult.percentage}%</span>
                    </div>
                    <div className="text-zinc-400 font-medium">Accuracy</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-black/20 rounded-xl text-center">
                      <div className="text-2xl font-bold text-white">{myResult.score}</div>
                      <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Score</div>
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl text-center">
                      <div className="text-2xl font-bold text-white">#{results.findIndex(r => r.participantId === myResult.participantId) + 1}</div>
                      <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Rank</div>
                    </div>
                  </div>
                </div>

                <Link
                  href="/quiz-battle"
                  className="block w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold text-center transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Play Again
                </Link>
              </div>
            </div>

            {/* Detailed Answers */}
            <div className="mb-12">
              <h2 className="text-xl font-bold text-white mb-6">Answer Breakdown</h2>

              <div className="grid gap-4">
                {myResult.questionResults.map((question, index) => (
                  <div
                    key={question.questionId}
                    className={`p-6 rounded-2xl border transition-all ${
                      question.isCorrect
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        question.isCorrect ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {question.isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Question {index + 1}</span>
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Difficulty badge */}
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              question.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400' :
                              question.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-red-500/10 text-red-400'
                            }`}>
                              {question.difficulty}
                            </span>
                            {question.isCorrect ? (
                              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Correct</span>
                            ) : (
                              <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">Incorrect</span>
                            )}
                          </div>
                        </div>

                        {/* Tags */}
                        {question.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {question.tags.map((tag) => (
                              <span key={tag} className="text-xs px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/20">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <h3 className="text-lg font-medium text-white mb-4">
                          {question.question}
                        </h3>

                        {!question.isCorrect && (
                          <div className="grid sm:grid-cols-2 gap-4 text-sm mb-4">
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                              <span className="block text-xs font-bold text-red-400 mb-1 uppercase">Your Answer</span>
                              <span className="text-red-100">{question.choices[question.userAnswer]}</span>
                            </div>
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              <span className="block text-xs font-bold text-emerald-400 mb-1 uppercase">Correct Answer</span>
                              <span className="text-emerald-100">{question.choices[question.answerIndex]}</span>
                            </div>
                          </div>
                        )}
                         {question.isCorrect && (
                           <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm mb-4">
                              <span className="block text-xs font-bold text-emerald-400 mb-1 uppercase">Your Answer</span>
                              <span className="text-emerald-100">{question.choices[question.userAnswer]}</span>
                            </div>
                         )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Scorecard Modal */}
      {showCard && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            {/* Downloadable Card */}
            <div
              ref={cardRef}
              className="bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-2xl mb-6 relative overflow-hidden"
            >
               {/* Decorative background blobs */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none" />

              <div className="relative z-10 text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center shadow-xl">
                  <Trophy className="text-amber-400" size={32} />
                </div>
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">
                  QUIZ BATTLE
                </h3>
                <div className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">FanGate Challenge</div>
              </div>

              <div className="relative z-10 bg-black/40 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/10">
                <div className="text-center mb-6 border-b border-white/5 pb-6">
                  <div className="text-2xl font-bold text-white mb-2">
                    {myResult.nickname}
                  </div>
                  {isWinner && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full">
                      <Crown className="text-amber-400" size={12} />
                      <span className="text-xs text-amber-300 font-bold uppercase tracking-wide">Winner</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2">
                    <div className="text-2xl font-black text-white">
                      {myResult.score}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Score</div>
                  </div>
                  <div className="text-center p-2 border-l border-white/5">
                    <div className="text-2xl font-black text-white">
                      {myResult.percentage}%
                    </div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Accuracy</div>
                  </div>
                  <div className="text-center p-2 border-l border-white/5">
                    <div className="text-2xl font-black text-white">
                      #{results.findIndex((r) => r.participantId === myResult.participantId) + 1}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Rank</div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between">
                 <div className="text-xs font-bold text-zinc-600 uppercase tracking-widest">
                    fangate.army
                 </div>
                 {formattedDate && (
                   <div className="text-xs font-medium text-zinc-500">
                     {formattedDate}
                   </div>
                 )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDownloadCard}
                disabled={downloading}
                className="flex-1 px-6 py-4 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {downloading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Save Image
                  </>
                )}
              </button>
              <button
                onClick={() => setShowCard(false)}
                className="px-6 py-4 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-xl text-white font-bold transition-colors"
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