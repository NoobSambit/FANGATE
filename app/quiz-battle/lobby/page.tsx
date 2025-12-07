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
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-purple-950/20 via-transparent to-pink-950/20 pointer-events-none" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
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
          </div>
        </nav>

        {/* Main Content */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 bg-purple-500/10 border border-purple-500/20 rounded-full">
                <Users className="text-purple-400" size={14} />
                <span className="text-sm text-purple-300 font-medium">Waiting for players...</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black mb-4 text-white">
                Battle Lobby
              </h1>

              {/* Access Code */}
              <div className="inline-flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-left">
                  <div className="text-xs text-white/50 mb-1">Access Code</div>
                  <div className="text-2xl font-mono font-bold text-purple-400 tracking-widest">
                    {accessCode}
                  </div>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-colors"
                  title="Copy code"
                >
                  {copied ? (
                    <Check className="text-green-400" size={20} />
                  ) : (
                    <Copy className="text-purple-400" size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Participants List */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Players ({participants.length}/5)
                </h2>
                <div className="text-sm text-white/50">
                  {participants.length < 2 ? 'Waiting for more players...' : 'Ready to start!'}
                </div>
              </div>

              <div className="space-y-3">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        participant.isHost
                          ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30'
                          : 'bg-white/10'
                      }`}>
                        {participant.isHost ? (
                          <Crown className="text-purple-400" size={20} />
                        ) : (
                          <span className="text-white/70 font-bold">
                            {participant.nickname.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-white font-medium">{participant.nickname}</div>
                        {participant.isHost && (
                          <div className="text-xs text-purple-400">Host</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: 5 - participants.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex items-center gap-3 p-4 bg-white/5 border border-dashed border-white/10 rounded-xl opacity-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5" />
                    <div className="text-white/40">Waiting for player...</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Start Button (Host Only) */}
            {isHost && (
              <button
                onClick={handleStartBattle}
                disabled={participants.length < 2 || starting}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {starting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Starting Battle...
                  </>
                ) : (
                  <>
                    <Swords size={20} />
                    Start Battle
                  </>
                )}
              </button>
            )}

            {/* Waiting Message (Non-Host) */}
            {!isHost && (
              <div className="text-center p-6 bg-white/5 border border-white/10 rounded-xl">
                <Loader2 className="mx-auto mb-3 text-purple-400 animate-spin" size={32} />
                <div className="text-white/70">
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
