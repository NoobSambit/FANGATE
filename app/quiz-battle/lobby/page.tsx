'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, Crown, Copy, Check, Swords, Loader2 } from 'lucide-react';

interface Participant {
  id: string;
  participantId: string;
  nickname: string;
  isHost: boolean;
}

export default function LobbyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessCode = searchParams.get('code');

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [battleId, setBattleId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  // Poll for battle status
  useEffect(() => {
    const storedBattleId = sessionStorage.getItem('quizBattle_battleId');
    const storedIsHost = sessionStorage.getItem('quizBattle_isHost') === 'true';

    if (!storedBattleId) {
      router.push('/quiz-battle');
      return;
    }

    setBattleId(storedBattleId);
    setIsHost(storedIsHost);

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/quiz-battle/status?battleId=${storedBattleId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch battle status');
        }

        setParticipants(data.battle.participants);

        // If battle started, navigate to play page
        if (data.battle.status === 'active') {
          router.push('/quiz-battle/play');
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch battle status');
        setLoading(false);
      }
    };

    // Poll every 2 seconds
    pollStatus();
    const interval = setInterval(pollStatus, 2000);

    return () => clearInterval(interval);
  }, [router]);

  const handleCopyCode = () => {
    if (accessCode) {
      navigator.clipboard.writeText(accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartBattle = async () => {
    if (participants.length < 2) {
      setError('Need at least 2 participants to start');
      return;
    }

    setStarting(true);
    setError('');

    try {
      const hostId = sessionStorage.getItem('quizBattle_participantId');

      const response = await fetch('/api/quiz-battle/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battleId,
          hostId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start battle');
      }

      // Navigation will happen via polling
    } catch (err: any) {
      setError(err.message || 'Failed to start battle');
      setStarting(false);
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background */}
      <div className="fixed top-0 right-0 p-12 bg-indigo-500/10 blur-[120px] rounded-full w-96 h-96 pointer-events-none" />
      <div className="fixed bottom-0 left-0 p-12 bg-emerald-500/10 blur-[120px] rounded-full w-96 h-96 pointer-events-none" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
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
          </div>
        </nav>

        {/* Main Content */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 bg-zinc-900/50 border border-white/10 rounded-full backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-sm text-zinc-300 font-medium">Waiting for players...</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black mb-4 text-white">
                Battle Lobby
              </h1>

              {/* Access Code */}
              <div className="inline-flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/10 rounded-2xl backdrop-blur-md">
                <div className="text-left">
                  <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Access Code</div>
                  <div className="text-3xl font-mono font-bold text-white tracking-widest">
                    {accessCode}
                  </div>
                </div>
                <div className="h-10 w-px bg-white/10 mx-2" />
                <button
                  onClick={handleCopyCode}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                  title="Copy code"
                >
                  {copied ? (
                    <Check className="text-emerald-400" size={20} />
                  ) : (
                    <Copy className="text-zinc-400 group-hover:text-white" size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Participants List */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                  Players ({participants.length}/5)
                </h2>
                <div className="text-sm text-zinc-500">
                  {participants.length < 2 ? 'Need 2+ to start' : 'Ready to start!'}
                </div>
              </div>

              <div className="space-y-3">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/10 rounded-xl backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        participant.isHost
                          ? 'bg-indigo-500/10 border-indigo-500/30'
                          : 'bg-white/5 border-white/10'
                      }`}>
                        {participant.isHost ? (
                          <Crown className="text-indigo-400" size={20} />
                        ) : (
                          <span className="text-zinc-400 font-bold">
                            {participant.nickname.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-white font-bold">{participant.nickname}</div>
                        {participant.isHost && (
                          <div className="text-xs text-indigo-400 font-medium mt-0.5">Host</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: 5 - participants.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex items-center gap-4 p-4 border border-dashed border-white/5 rounded-xl opacity-50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5" />
                    <div className="text-zinc-600 font-medium">Waiting...</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium">
                {error}
              </div>
            )}

            {/* Start Button (Host Only) */}
            {isHost && (
              <button
                onClick={handleStartBattle}
                disabled={participants.length < 2 || starting}
                className="w-full px-6 py-4 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                {starting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Starting Battle...
                  </>
                ) : (
                  <>
                    <Swords size={20} />
                    START BATTLE
                  </>
                )}
              </button>
            )}

            {/* Waiting Message (Non-Host) */}
            {!isHost && (
              <div className="text-center p-8 bg-zinc-900/30 border border-white/5 rounded-2xl">
                <Loader2 className="mx-auto mb-4 text-indigo-400 animate-spin" size={32} />
                <div className="text-zinc-400 font-medium">
                  Waiting for host to start the battle...
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
