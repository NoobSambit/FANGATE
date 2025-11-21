'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Swords, Sparkles, Trophy, Clock, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';

export default function QuizBattlePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'host' | 'join'>('select');
  const [nickname, setNickname] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleHostBattle = async () => {
    if (!nickname.trim()) {
      setError('Please enter your nickname');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate a unique participant ID
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

      // Store participant info in session storage
      sessionStorage.setItem('quizBattle_participantId', participantId);
      sessionStorage.setItem('quizBattle_nickname', nickname.trim());
      sessionStorage.setItem('quizBattle_battleId', data.battleId);
      sessionStorage.setItem('quizBattle_isHost', 'true');

      // Navigate to lobby
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
      // Generate a unique participant ID
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

      // Store participant info in session storage
      sessionStorage.setItem('quizBattle_participantId', participantId);
      sessionStorage.setItem('quizBattle_nickname', nickname.trim());
      sessionStorage.setItem('quizBattle_battleId', data.battleId);
      sessionStorage.setItem('quizBattle_isHost', 'false');

      // Navigate to lobby
      router.push(`/quiz-battle/lobby?code=${accessCode.trim().toUpperCase()}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join battle');
    } finally {
      setLoading(false);
    }
  };

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
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-20">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 bg-purple-500/10 border border-purple-500/20 rounded-full">
                <Swords className="text-purple-400" size={14} />
                <span className="text-sm text-purple-300 font-medium">ARMY Quiz Battle</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Quiz Battle
                </span>
              </h1>

              <p className="text-lg text-white/70 mb-6">
                Compete with other ARMYs in a real-time quiz challenge!
              </p>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 mb-8">
                <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
                  <Users className="text-purple-400" size={20} />
                  <span className="text-sm text-white/80">Up to 5 players</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
                  <Trophy className="text-pink-400" size={20} />
                  <span className="text-sm text-white/80">15 questions</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
                  <Clock className="text-purple-400" size={20} />
                  <span className="text-sm text-white/80">150 seconds</span>
                </div>
              </div>
            </div>

            {/* Selection Cards */}
            {mode === 'select' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Host Battle */}
                <button
                  onClick={() => setMode('host')}
                  className="group p-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 hover:border-purple-500/50 rounded-2xl transition-all hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-4 bg-purple-500/20 rounded-full group-hover:bg-purple-500/30 transition-colors">
                      <Sparkles className="text-purple-400" size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Host Battle</h3>
                      <p className="text-white/60">Create a new quiz battle and invite friends</p>
                    </div>
                    <ArrowRight className="text-purple-400 group-hover:translate-x-1 transition-transform" size={24} />
                  </div>
                </button>

                {/* Join Battle */}
                <button
                  onClick={() => setMode('join')}
                  className="group p-8 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-2 border-pink-500/30 hover:border-pink-500/50 rounded-2xl transition-all hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-4 bg-pink-500/20 rounded-full group-hover:bg-pink-500/30 transition-colors">
                      <Users className="text-pink-400" size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Join Battle</h3>
                      <p className="text-white/60">Enter an access code to join a battle</p>
                    </div>
                    <ArrowRight className="text-pink-400 group-hover:translate-x-1 transition-transform" size={24} />
                  </div>
                </button>
              </div>
            )}

            {/* Host Form */}
            {mode === 'host' && (
              <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Host a Battle</h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="nickname" className="block text-sm font-medium text-white/80 mb-2">
                      Your Nickname
                    </label>
                    <input
                      id="nickname"
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Enter your nickname"
                      maxLength={20}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setMode('select')}
                      className="flex-1 px-6 py-3 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg text-white transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleHostBattle}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating...' : 'Create Battle'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Join Form */}
            {mode === 'join' && (
              <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Join a Battle</h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="join-nickname" className="block text-sm font-medium text-white/80 mb-2">
                      Your Nickname
                    </label>
                    <input
                      id="join-nickname"
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Enter your nickname"
                      maxLength={20}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-pink-500/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="access-code" className="block text-sm font-medium text-white/80 mb-2">
                      Access Code
                    </label>
                    <input
                      id="access-code"
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      placeholder="Enter 6-character code"
                      maxLength={6}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-pink-500/50 transition-colors uppercase text-center text-2xl tracking-widest font-mono"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setMode('select')}
                      className="flex-1 px-6 py-3 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg text-white transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleJoinBattle}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Joining...' : 'Join Battle'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
