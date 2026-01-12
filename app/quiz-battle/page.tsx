'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Trophy, Clock, Home, Heart, X, Swords } from 'lucide-react';
import Link from 'next/link';

export default function QuizBattlePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'host' | 'join'>('select');
  const [nickname, setNickname] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDonationModal, setShowDonationModal] = useState(false);

  const handleHostBattle = async () => {
    if (!nickname.trim()) {
      setError('Please enter your nickname');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const participantId = crypto.randomUUID();

      const response = await fetch('/api/quiz-battle/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: participantId,
          nickname: nickname.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create battle');
      }

      sessionStorage.setItem('quizBattle_participantId', participantId);
      sessionStorage.setItem('quizBattle_nickname', nickname.trim());
      sessionStorage.setItem('quizBattle_battleId', data.battleId);
      sessionStorage.setItem('quizBattle_isHost', 'true');

      router.push(`/quiz-battle/lobby?code=${data.accessCode}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create battle');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinBattle = async () => {
    if (!nickname.trim()) {
      setError('Please enter your nickname');
      return;
    }

    if (!accessCode.trim()) {
      setError('Please enter the access code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const participantId = crypto.randomUUID();

      const response = await fetch('/api/quiz-battle/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode: accessCode.trim().toUpperCase(),
          participantId,
          nickname: nickname.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join battle');
      }

      sessionStorage.setItem('quizBattle_participantId', participantId);
      sessionStorage.setItem('quizBattle_nickname', nickname.trim());
      sessionStorage.setItem('quizBattle_battleId', data.battleId);
      sessionStorage.setItem('quizBattle_isHost', 'false');

      router.push(`/quiz-battle/lobby?code=${accessCode.trim().toUpperCase()}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join battle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background */}
      <div className="fixed top-0 right-0 p-12 bg-purple-500/10 blur-[120px] rounded-full w-96 h-96 pointer-events-none" />
      <div className="fixed bottom-0 left-0 p-12 bg-indigo-500/10 blur-[120px] rounded-full w-96 h-96 pointer-events-none" />

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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDonationModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-all border border-white/10"
              >
                <Heart size={16} className="text-pink-500 fill-pink-500" />
                <span className="hidden sm:inline">DONATE</span>
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all hover:bg-white/5"
              >
                <Home size={16} />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-8 sm:pb-12">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-6 sm:mb-12">
              <div className="inline-block mb-3 sm:mb-4">
                <div className="px-3 py-1.5 border border-emerald-500/30 bg-emerald-500/10 rounded-full backdrop-blur-sm">
                  <span className="text-xs sm:text-sm font-medium text-emerald-300 tracking-widest uppercase flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Live Quiz Battle
                  </span>
                </div>
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-4 sm:mb-6 leading-none tracking-tight">
                <span className="block text-zinc-500 mb-1 sm:mb-2 text-sm sm:text-lg tracking-[0.2em] uppercase font-bold">
                  Enter The Arena
                </span>
                <span className="block text-white">
                  Test Your Knowledge
                </span>
              </h1>

              <p className="text-sm sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-6 sm:mb-8 px-4 leading-relaxed">
                Join the ultimate real-time multiplayer showdown. Compete with fans worldwide and claim your victory.
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto px-2">
                <div className="p-3 sm:p-4 bg-zinc-900/50 border border-white/10 rounded-xl backdrop-blur-sm">
                  <Users className="text-indigo-400 mx-auto mb-2" size={20} />
                  <div className="text-lg sm:text-2xl font-bold text-white mb-1">5</div>
                  <div className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider font-bold">Players Max</div>
                </div>
                <div className="p-3 sm:p-4 bg-zinc-900/50 border border-white/10 rounded-xl backdrop-blur-sm">
                  <Trophy className="text-amber-400 mx-auto mb-2" size={20} />
                  <div className="text-lg sm:text-2xl font-bold text-white mb-1">15</div>
                  <div className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider font-bold">Questions</div>
                </div>
                <div className="p-3 sm:p-4 bg-zinc-900/50 border border-white/10 rounded-xl backdrop-blur-sm">
                  <Clock className="text-emerald-400 mx-auto mb-2" size={20} />
                  <div className="text-lg sm:text-2xl font-bold text-white mb-1">200s</div>
                  <div className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider font-bold">Time Limit</div>
                </div>
              </div>
            </div>

            {/* Mode Selection */}
            {mode === 'select' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Host Battle Card */}
                <button
                  onClick={() => setMode('host')}
                  className="group relative p-6 sm:p-8 bg-zinc-900/50 border border-white/10 rounded-2xl hover:bg-zinc-800/50 hover:border-indigo-500/50 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10">
                    <div className="mb-4 sm:mb-6">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Users className="text-indigo-400" size={28} />
                      </div>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Host Battle</h3>
                    <p className="text-sm sm:text-base text-zinc-400 mb-4 sm:mb-6">
                      Create a room and invite your friends to compete
                    </p>

                    <div className="flex items-center text-indigo-400 group-hover:translate-x-1 transition-transform">
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Start hosting</span>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Join Battle Card */}
                <button
                  onClick={() => setMode('join')}
                  className="group relative p-6 sm:p-8 bg-zinc-900/50 border border-white/10 rounded-2xl hover:bg-zinc-800/50 hover:border-emerald-500/50 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10">
                    <div className="mb-4 sm:mb-6">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Swords className="text-emerald-400" size={28} />
                      </div>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Join Battle</h3>
                    <p className="text-sm sm:text-base text-zinc-400 mb-4 sm:mb-6">
                      Enter a room code to join an existing battle
                    </p>

                    <div className="flex items-center text-emerald-400 group-hover:translate-x-1 transition-transform">
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Enter Code</span>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Host Form */}
            {mode === 'host' && (
              <div className="max-w-md mx-auto">
                <div className="p-8 bg-zinc-900/50 border border-white/10 rounded-2xl backdrop-blur-md">
                  <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Host Battle</h2>
                    <p className="text-zinc-400 text-sm">Configure your battle room</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">
                        Your Nickname
                      </label>
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="e.g. ArmyLeader"
                        maxLength={20}
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-sm text-center font-medium">{error}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setMode('select')}
                        className="flex-1 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white font-medium transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleHostBattle}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                      >
                        {loading ? 'Creating...' : 'Create'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Join Form */}
            {mode === 'join' && (
              <div className="max-w-md mx-auto">
                <div className="p-8 bg-zinc-900/50 border border-white/10 rounded-2xl backdrop-blur-md">
                  <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Join Battle</h2>
                    <p className="text-zinc-400 text-sm">Enter room details to join</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">
                        Your Nickname
                      </label>
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="e.g. ArmyFan"
                        maxLength={20}
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">
                        Room Code
                      </label>
                      <input
                        type="text"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                        placeholder="CODE"
                        maxLength={6}
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all uppercase text-center text-xl tracking-[0.2em] font-mono font-bold"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-sm text-center font-medium">{error}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setMode('select')}
                        className="flex-1 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white font-medium transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleJoinBattle}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                      >
                        {loading ? 'Joining...' : 'Join Room'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-purple-500/30 rounded-3xl p-8 shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setShowDonationModal(false)}
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text mb-2">
                Support FANGATE
              </h2>
              <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            </div>

            {/* Content */}
            <div className="space-y-4 text-white/80 mb-6">
              <p>
                I&apos;m a student developer running this site entirely on my own, with no income source to cover server and platform costs.
              </p>
              <p>
                Hosting services often go above their free limits, and keeping the site online typically costs around $20/month (excluding costs of other services like database). Without support, I may not be able to keep the servers running once the free tier is exhausted.
              </p>
              <p>
                If you enjoy this project and want to help keep it alive for ARMY, any contribution—no matter the amount—truly helps. Your support directly goes into maintaining the site, upgrading features, and ensuring it stays free for everyone.
              </p>
              <p className="text-purple-300 font-medium">
                Thank you so much for helping me continue this journey.
              </p>
            </div>

            {/* Donate Button */}
            <a
              href="https://ko-fi.com/noobsambit"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
            >
              <Heart size={20} className="fill-current" />
              <span>Donate on Ko-fi</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
