'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Music, Shield, CheckCircle, LogOut, ArrowRight, Sparkles, TrendingUp, Clock, Award, Info } from 'lucide-react';
import { getScoringBreakdown } from '@/lib/scoring';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-75" />
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Subtle background gradient */}
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
            {session && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                  {session.user?.image && (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'User'} 
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-sm text-white/90">
                    {session.user?.name || session.user?.email?.split('@')[0] || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors"
                  title="Disconnect Spotify"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-24 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 bg-purple-500/10 border border-purple-500/20 rounded-full">
              <Sparkles className="text-purple-400" size={14} />
              <span className="text-sm text-purple-300 font-medium">Exclusive BTS Access</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              <span className="text-white">Prove You&apos;re a</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Real ARMY
              </span>
            </h1>
            
            {/* Description */}
            <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Verify your BTS fandom through Spotify listening history and quiz knowledge to access exclusive concert ticket sales.
            </p>

            {/* CTA Button */}
            {session ? (
              <div className="flex flex-col items-center gap-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg mb-2">
                  <CheckCircle className="text-green-400" size={18} />
                  <span className="text-sm text-green-300 font-medium">Spotify Connected</span>
                </div>
                <button
                  onClick={() => router.push('/verification')}
                  className="btn-primary inline-flex items-center gap-2 text-base sm:text-lg px-8 py-4"
                >
                  Start Verification
                  <ArrowRight size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('spotify', { callbackUrl: '/' })}
                className="btn-primary inline-flex items-center gap-2 text-base sm:text-lg px-8 py-4"
              >
                <Music size={20} />
                Connect with Spotify
                <ArrowRight size={20} />
              </button>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 max-w-md mx-auto p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-left">
                <p className="text-red-200 font-semibold text-sm mb-1">Login Error</p>
                <p className="text-red-300/80 text-sm">
                  {error === 'OAuthCallback' 
                    ? 'Authentication failed. Please try again or contact support.'
                    : `Error: ${error}`}
                </p>
              </div>
            )}

            {/* Security Note */}
            <p className="text-xs text-white/40 mt-8 flex items-center justify-center gap-2">
              <Shield size={12} />
              Your data is encrypted and never shared
            </p>
          </div>
        </section>

        {/* Scoring System Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Scoring System
              </h2>
              <p className="text-white/60 text-sm sm:text-base mb-2">
                Complete transparency on how we calculate your fan score
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mt-4">
                <Info className="text-purple-400" size={14} />
                <span className="text-xs sm:text-sm text-purple-300">
                  Minimum score required: 70 points | Quiz: 10 questions (70% to pass)
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {getScoringBreakdown().categories.map((category, idx) => {
                const iconMap: { [key: string]: any } = {
                  topArtists: Music,
                  soloMembers: TrendingUp,
                  topTracks: Award,
                  recentListening: Clock,
                  accountAge: CheckCircle,
                };
                const Icon = iconMap[category.category] || Music;

                return (
                  <div key={idx} className="glass-effect p-5 sm:p-6 rounded-xl">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg flex items-center justify-center border border-purple-500/20">
                        <Icon className="text-purple-400" size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <h3 className="text-lg sm:text-xl font-bold text-white">
                            {category.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            {'pointsPerTrack' in category || 'pointsPerArtist' in category ? (
                              <span className="text-sm font-semibold text-purple-400">
                                {('pointsPerTrack' in category ? category.pointsPerTrack : category.pointsPerArtist)} pts/{'pointsPerTrack' in category ? 'track' : 'artist'}
                              </span>
                            ) : (
                              <span className="text-sm font-semibold text-purple-400">
                                +{'points' in category ? category.points : 0} points
                              </span>
                            )}
                            <span className="text-xs text-white/40">
                              (max {category.maxPoints})
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-white/60 mb-2">{category.description}</p>
                        <p className="text-xs text-white/50 mb-3">{category.requirement}</p>
                        <div className="p-3 bg-white/2 rounded-lg border border-white/5">
                          <p className="text-xs sm:text-sm text-purple-300 font-medium">
                            💡 {category.example}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Combined Scoring Explanation */}
            <div className="mt-8 glass-effect p-6 rounded-xl border-2 border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Award className="text-purple-400" size={20} />
                Final Verification Score
              </h3>
              <p className="text-sm text-white/70 mb-4">
                Your final verification uses a <span className="font-semibold text-purple-400">combined scoring system</span> that 
                averages your Spotify listening history (40%) and quiz performance (60%). 
                The quiz is weighted more, but your Spotify dedication can help boost your score!
              </p>
              <div className="p-4 bg-white/2 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/60">Spotify Score:</span>
                  <span className="text-sm font-semibold text-purple-400">40% weight</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Quiz Score:</span>
                  <span className="text-sm font-semibold text-pink-400">60% weight</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    {getScoringBreakdown().summary.combinedMinimum}+
                  </div>
                  <div className="text-xs sm:text-sm text-white/50">Min Combined</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    {getScoringBreakdown().summary.quizQuestions}
                  </div>
                  <div className="text-xs sm:text-sm text-white/50">Quiz Questions</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    {getScoringBreakdown().summary.maxScore}
                  </div>
                  <div className="text-xs sm:text-sm text-white/50">Max Spotify</div>
                </div>
              </div>
              <p className="text-xs text-purple-300/70 mt-4 italic">
                💜 Remember: Even if you don&apos;t ace the quiz, your Spotify listening can help you pass! 
                Being a real ARMY is about your dedication, not just memorizing trivia!
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                How It Works
              </h2>
              <p className="text-white/60 text-sm sm:text-base">
                Simple verification process to prove your ARMY status
              </p>
            </div>
            
            <div className="space-y-4">
              {[
                { step: '1', title: 'Connect Spotify', desc: 'Login securely with your Spotify account' },
                { step: '2', title: 'Listening Analysis', desc: 'We calculate your Spotify fan score based on BTS in your listening history' },
                { step: '3', title: 'Take the Quiz', desc: 'Answer 10 BTS trivia questions. Final score combines Spotify (40%) + Quiz (60%)' },
                { step: '4', title: 'Get Access', desc: 'If your combined score is 70+, receive your secure token for exclusive ticket access' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 p-5 bg-white/2 border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {item.step}
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-white/60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16 border-t border-white/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg border border-purple-500/30 overflow-hidden bg-white/5">
                <img
                  src="/fangate-logo.png"
                  alt="FanGate logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm text-white/40">&copy; 2024 FanGate</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
              <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
              <a href="#" className="hover:text-white/60 transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
