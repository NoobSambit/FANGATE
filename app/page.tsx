'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Music, Shield, Trophy, Sparkles, ChevronRight, Star, Zap, Award, AlertCircle } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/verification');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0118]">
        <div className="text-2xl text-purple-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0118] overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-blue-900/20"></div>
      <div className="fixed inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
      }}></div>
      
      <div className="relative z-10">
        <nav className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Music className="text-white" size={20} />
              </div>
              <div className="text-2xl font-bold text-white">
                Fan<span className="text-purple-400">Gate</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
              <a href="#how-it-works" className="hover:text-white transition">How it Works</a>
              <a href="#features" className="hover:text-white transition">Features</a>
            </div>
          </div>
        </nav>

        <section className="container mx-auto px-6 pt-20 pb-32 text-center">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full backdrop-blur-sm">
              <Star className="text-purple-400" size={16} />
              <span className="text-sm text-purple-300 font-medium">Exclusive BTS Concert Access</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              <span className="text-white">Prove You&apos;re a</span>
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                  Real ARMY
                </span>
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 blur-2xl opacity-30 animate-pulse"></div>
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Verify your BTS fandom through Spotify listening history and quiz knowledge
              <br className="hidden md:block" />
              to access exclusive concert ticket sales.
            </p>

            <button
              onClick={() => signIn('spotify', { callbackUrl: '/verification' })}
              className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-lg font-bold text-white overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Music className="relative z-10" size={24} />
              <span className="relative z-10">Login with Spotify</span>
              <ChevronRight className="relative z-10 group-hover:translate-x-1 transition-transform" size={20} />
            </button>

            {error && (
              <div className="mt-6 max-w-md mx-auto p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-red-200 font-semibold">Login Error</p>
                  <p className="text-red-300 text-sm mt-1">
                    {error === 'OAuthCallback' 
                      ? 'Authentication failed. This might be a database connection issue. Please try again or contact support.'
                      : `Error: ${error}`}
                  </p>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
              <Shield size={14} />
              Your data is encrypted and never shared
            </p>

            <div className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">70+</div>
                <div className="text-sm text-gray-400">Fan Score Required</div>
              </div>
              <div className="text-center border-x border-gray-800">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">10</div>
                <div className="text-sm text-gray-400">Quiz Questions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">70%</div>
                <div className="text-sm text-gray-400">Pass Rate</div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Why Fan Verification?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              A fair system that rewards true fans and prevents scalpers
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 p-8 rounded-2xl hover:border-purple-500/50 transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 rounded-2xl transition-all"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Fair Access</h3>
                <p className="text-gray-400 leading-relaxed">
                  Ensure real fans get priority access to limited concert tickets, not bots or scalpers
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 p-8 rounded-2xl hover:border-purple-500/50 transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 rounded-2xl transition-all"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Beat the Bots</h3>
                <p className="text-gray-400 leading-relaxed">
                  Advanced verification prevents automated systems from gaming the ticket system
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 p-8 rounded-2xl hover:border-purple-500/50 transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 rounded-2xl transition-all"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Award className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Rewarding Dedication</h3>
                <p className="text-gray-400 leading-relaxed">
                  Your passion for BTS music is recognized and celebrated with exclusive access
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              A simple 4-step process to verify your ARMY status
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="group relative bg-gradient-to-r from-purple-500/10 to-transparent backdrop-blur-sm border border-purple-500/20 p-6 rounded-xl hover:border-purple-500/50 transition-all">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl font-bold text-white">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Connect Spotify</h3>
                  <p className="text-gray-400">
                    Login securely with your Spotify account to analyze your listening history
                  </p>
                </div>
                <ChevronRight className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="group relative bg-gradient-to-r from-purple-500/10 to-transparent backdrop-blur-sm border border-purple-500/20 p-6 rounded-xl hover:border-purple-500/50 transition-all">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl font-bold text-white">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Listening Analysis</h3>
                  <p className="text-gray-400">
                    We calculate your fan score based on BTS in your top artists, tracks, and recent plays
                  </p>
                </div>
                <ChevronRight className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="group relative bg-gradient-to-r from-purple-500/10 to-transparent backdrop-blur-sm border border-purple-500/20 p-6 rounded-xl hover:border-purple-500/50 transition-all">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl font-bold text-white">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Take the Quiz</h3>
                  <p className="text-gray-400">
                    Answer 10 BTS trivia questions to prove your knowledge (70% required to pass)
                  </p>
                </div>
                <ChevronRight className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="group relative bg-gradient-to-r from-purple-500/10 to-transparent backdrop-blur-sm border border-purple-500/20 p-6 rounded-xl hover:border-purple-500/50 transition-all">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl font-bold text-white">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Get Access</h3>
                  <p className="text-gray-400">
                    Receive a secure token and redirect to the exclusive ticket purchase page
                  </p>
                </div>
                <ChevronRight className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </section>

        <footer className="container mx-auto px-6 py-12 mt-20 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Music className="text-white" size={16} />
              </div>
              <span className="text-gray-400 text-sm">&copy; 2024 FanGate. Built for ARMY, by fans.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
