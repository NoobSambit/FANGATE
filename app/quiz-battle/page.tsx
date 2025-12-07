'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Trophy, Clock, Home, Heart, X } from 'lucide-react';
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
      {/* Sophisticated background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#0a0a0f] to-[#0a0a0f]" />
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10" />

      {/* Floating orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />

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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDonationModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/20"
              >
                <Heart size={16} className="fill-current" />
                <span className="hidden sm:inline">DONATE</span>
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
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
                <div className="px-3 py-1.5 border border-purple-500/30 rounded-full backdrop-blur-sm">
                  <span className="text-xs sm:text-sm font-medium text-purple-300 tracking-wider uppercase">
                    Quiz Battle
                  </span>
                </div>
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-4 sm:mb-6 leading-none">
                <span className="block text-white/30 mb-1 sm:mb-2">
                  Test Your
                </span>
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Knowledge
                </span>
              </h1>

              <p className="text-sm sm:text-lg text-white/60 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
                Compete in real-time. Answer fast. Prove you&apos;re the ultimate ARMY.
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto px-2">
                <div className="p-2 sm:p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                  <Users className="text-purple-400 mx-auto mb-1 sm:mb-2" size={20} />
                  <div className="text-lg sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">5</div>
                  <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wide">Players Max</div>
                </div>
                <div className="p-2 sm:p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                  <Trophy className="text-pink-400 mx-auto mb-1 sm:mb-2" size={20} />
                  <div className="text-lg sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">15</div>
                  <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wide">Questions</div>
                </div>
                <div className="p-2 sm:p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                  <Clock className="text-purple-400 mx-auto mb-1 sm:mb-2" size={20} />
                  <div className="text-lg sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">60</div>
                  <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wide">Seconds</div>
                </div>
              </div>
            </div>

            {/* Mode Selection */}
            {mode === 'select' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Host Battle Card */}
                <button
                  onClick={() => setMode('host')}
                  className="group relative p-6 sm:p-8 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl hover:border-purple-500/50 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/10 group-hover:to-transparent transition-all duration-300" />

                  <div className="relative">
                    <div className="mb-4 sm:mb-6">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-purple-400 rounded-lg" />
                      </div>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Host Battle</h3>
                    <p className="text-sm sm:text-base text-white/50 mb-4 sm:mb-6">
                      Create a new room and invite others to compete
                    </p>

                    <div className="flex items-center text-purple-400 group-hover:translate-x-2 transition-transform duration-300">
                      <span className="text-xs sm:text-sm font-medium">Start hosting</span>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Join Battle Card */}
                <button
                  onClick={() => setMode('join')}
                  className="group relative p-6 sm:p-8 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl hover:border-pink-500/50 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-pink-500/0 group-hover:from-pink-500/10 group-hover:to-transparent transition-all duration-300" />

                  <div className="relative">
                    <div className="mb-4 sm:mb-6">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-pink-500/10 border border-pink-500/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Users className="text-pink-400" size={28} />
                      </div>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Join Battle</h3>
                    <p className="text-sm sm:text-base text-white/50 mb-4 sm:mb-6">
                      Enter a room code and challenge your friends
                    </p>

                    <div className="flex items-center text-pink-400 group-hover:translate-x-2 transition-transform duration-300">
                      <span className="text-xs sm:text-sm font-medium">Enter code</span>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Host Form */}
            {mode === 'host' && (
              <div className="max-w-md mx-auto">
                <div className="p-8 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl backdrop-blur-sm">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-white mb-2">Host Battle</h2>
                    <p className="text-white/50">Create your quiz room</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide">
                        Nickname
                      </label>
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Enter your name"
                        maxLength={20}
                        className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setMode('select')}
                        className="flex-1 px-6 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white font-medium transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleHostBattle}
                        disabled={loading}
                        className="flex-1 px-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Creating...' : 'Create Room'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Join Form */}
            {mode === 'join' && (
              <div className="max-w-md mx-auto">
                <div className="p-8 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl backdrop-blur-sm">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-white mb-2">Join Battle</h2>
                    <p className="text-white/50">Enter room details</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide">
                        Nickname
                      </label>
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Enter your name"
                        maxLength={20}
                        className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50 focus:bg-white/10 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide">
                        Room Code
                      </label>
                      <input
                        type="text"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                        placeholder="XXXXXX"
                        maxLength={6}
                        className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50 focus:bg-white/10 transition-all uppercase text-center text-2xl tracking-[0.5em] font-mono font-bold"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setMode('select')}
                        className="flex-1 px-6 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white font-medium transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleJoinBattle}
                        disabled={loading}
                        className="flex-1 px-6 py-3.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-xl text-white font-semibold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
