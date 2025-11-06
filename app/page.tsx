'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Music, Shield, Trophy, Sparkles } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/verification');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-purple-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#16003b]">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      
      <div className="relative z-10">
        <nav className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">
              <span className="gradient-purple bg-clip-text text-transparent">Fan</span>
              <span className="text-white">Gate</span>
            </div>
          </div>
        </nav>

        <section className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 inline-block">
              <div className="glass-effect px-6 py-3 rounded-full glow-purple">
                <span className="text-purple-300">🎵 BTS Concert Access</span>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              Prove You're a
              <br />
              <span className="gradient-purple bg-clip-text text-transparent">
                Real ARMY
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Verify your BTS fandom through Spotify listening history and quiz knowledge
              to access exclusive concert ticket sales.
            </p>

            <button
              onClick={() => signIn('spotify', { callbackUrl: '/verification' })}
              className="gradient-purple px-12 py-5 rounded-full text-xl font-semibold hover:opacity-90 transition-all transform hover:scale-105 glow-purple inline-flex items-center gap-3"
            >
              <Music size={24} />
              Login with Spotify
            </button>

            <p className="text-sm text-gray-400 mt-4">
              Your data is only used for verification and never shared
            </p>
          </div>
        </section>

        <section className="container mx-auto px-6 py-20">
          <h2 className="text-4xl font-bold text-center mb-16">
            Why Fan Verification?
          </h2>
          
          <div className="grid md:grid-grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="glass-effect p-8 rounded-2xl text-center">
              <div className="w-16 h-16 gradient-purple rounded-full flex items-center justify-center mx-auto mb-4 glow-purple">
                <Shield size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Fair Access</h3>
              <p className="text-gray-400">
                Ensure real fans get priority access to limited concert tickets
              </p>
            </div>

            <div className="glass-effect p-8 rounded-2xl text-center">
              <div className="w-16 h-16 gradient-purple rounded-full flex items-center justify-center mx-auto mb-4 glow-purple">
                <Trophy size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Beat the Bots</h3>
              <p className="text-gray-400">
                Advanced verification prevents scalpers and automated systems
              </p>
            </div>

            <div className="glass-effect p-8 rounded-2xl text-center">
              <div className="w-16 h-16 gradient-purple rounded-full flex items-center justify-center mx-auto mb-4 glow-purple">
                <Sparkles size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Rewarding Dedication</h3>
              <p className="text-gray-400">
                Your passion for BTS music is recognized and celebrated
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-20">
          <h2 className="text-4xl font-bold text-center mb-16">
            Verification Process
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="glass-effect p-6 rounded-xl flex items-start gap-4">
              <div className="w-12 h-12 gradient-purple rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Connect Spotify</h3>
                <p className="text-gray-400">
                  Login securely with your Spotify account to analyze your listening history
                </p>
              </div>
            </div>

            <div className="glass-effect p-6 rounded-xl flex items-start gap-4">
              <div className="w-12 h-12 gradient-purple rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Listening Analysis</h3>
                <p className="text-gray-400">
                  We calculate your fan score based on BTS in your top artists, tracks, and recent plays
                </p>
              </div>
            </div>

            <div className="glass-effect p-6 rounded-xl flex items-start gap-4">
              <div className="w-12 h-12 gradient-purple rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Take the Quiz</h3>
                <p className="text-gray-400">
                  Answer 10 BTS trivia questions to prove your knowledge (70% required to pass)
                </p>
              </div>
            </div>

            <div className="glass-effect p-6 rounded-xl flex items-start gap-4">
              <div className="w-12 h-12 gradient-purple rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Get Access</h3>
                <p className="text-gray-400">
                  Receive a secure token and redirect to the exclusive ticket purchase page
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="container mx-auto px-6 py-12 text-center text-gray-500 border-t border-gray-800">
          <p>&copy; 2024 FanGate. Built for ARMY, by fans.</p>
        </footer>
      </div>
    </div>
  );
}
