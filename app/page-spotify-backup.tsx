'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Music, Shield, CheckCircle, LogOut, ArrowRight, Sparkles, TrendingUp, Clock, Award, Info, Swords, Users, Trophy, Heart, X } from 'lucide-react';
import { getScoringBreakdown } from '@/lib/scoring';
import Footer from '@/components/Footer';
import { useState } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const enableSpotifyVerification =
    process.env.NEXT_PUBLIC_ENABLE_SPOTIFY_VERIFICATION === 'true';
  const [showDonationModal, setShowDonationModal] = useState(false);

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
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/quiz-battle')}
                className="group relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600 hover:to-pink-600 text-purple-300 hover:text-white font-semibold rounded-lg transition-all border border-purple-500/30 hover:border-transparent hover:scale-105"
              >
                <Swords size={16} className="group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">BATTLE</span>
              </button>
              <button
                onClick={() => setShowDonationModal(true)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/20"
              >
                <span>DONATE</span>
              </button>
              {session && (
                <>
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
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-16 lg:pt-24 pb-12 sm:pb-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 mb-5 sm:mb-8 bg-purple-500/10 border border-purple-500/20 rounded-full">
              <Sparkles className="text-purple-400" size={14} />
              <span className="text-xs sm:text-sm text-purple-300 font-medium">Fun ARMY Game Challenge</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 leading-tight">
              <span className="text-white">Prove You&apos;re a</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Real ARMY
              </span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-lg lg:text-xl text-white/70 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
              Play the FanGate game! Take a fun quiz challenge to see if you &quot;deserve&quot; your concert ticket.
              Get verified as ARMY and unlock your &quot;ticket&quot; - it&apos;s all just for fun, not serious! 🎟️💜
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
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => {
                    if (enableSpotifyVerification) {
                      signIn('spotify', { callbackUrl: '/' });
                    } else {
                      router.push('/verification');
                    }
                  }}
                  className="btn-primary inline-flex items-center gap-2 text-base sm:text-lg px-8 py-4"
                >
                  <Music size={20} />
                  Connect with Spotify
                  <ArrowRight size={20} />
                </button>
                {!enableSpotifyVerification && (
                  <p className="text-xs sm:text-sm text-amber-300/90 max-w-md text-center px-4">
                    <span className="font-semibold">Note:</span> Spotify analysis is currently turned off due to Spotify restrictions, but you can still proceed. An average score will be provided for the verification process.
                  </p>
                )}
              </div>
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

        {/* Quiz Battle Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="relative overflow-hidden rounded-[2rem] bg-zinc-900/50 border border-white/10 shadow-2xl group">
              {/* Abstract Background Elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-50" />
              <div className="absolute top-0 right-0 p-12 bg-purple-500/10 blur-[120px] rounded-full w-96 h-96 pointer-events-none" />
              <div className="absolute bottom-0 left-0 p-12 bg-indigo-500/10 blur-[120px] rounded-full w-96 h-96 pointer-events-none" />
              
              <div className="relative z-10 grid lg:grid-cols-2 gap-8 lg:gap-16 p-6 sm:p-12 lg:p-16 items-center">
                
                {/* Left Column: Content */}
                <div className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-6 sm:space-y-8">
                  {/* Live Badge */}
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-sm font-semibold tracking-wider text-emerald-100 uppercase">Live Now</span>
                  </div>

                  {/* Main Title */}
                  <div className="space-y-2">
                    <h2 className="text-4xl sm:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter">
                      QUIZ
                      <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">BATTLE</span>
                    </h2>
                    <p className="text-base sm:text-xl text-zinc-400 max-w-md leading-relaxed pt-2 sm:pt-4 mx-auto lg:mx-0">
                      Join the ultimate BTS trivia showdown. Play with other fans, test your knowledge, and have fun!
                    </p>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => router.push('/quiz-battle')}
                    className="group relative inline-flex items-center justify-center gap-4 px-8 py-4 bg-white text-black rounded-xl font-bold text-lg tracking-wide hover:scale-105 transition-all duration-300 overflow-hidden w-full sm:w-auto"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      JOIN THE FUN
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-indigo-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                </div>

                {/* Right Column: Visual Stats Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                  {/* Stat Card 1 */}
                  <div className="bg-black/40 backdrop-blur-md border border-white/5 p-4 sm:p-6 rounded-2xl hover:border-purple-500/30 transition-colors duration-300">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mb-2 sm:mb-4" />
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">5</div>
                    <div className="text-xs sm:text-sm text-zinc-500 font-medium uppercase tracking-wider">Players Max</div>
                  </div>

                  {/* Stat Card 2 */}
                  <div className="bg-black/40 backdrop-blur-md border border-white/5 p-4 sm:p-6 rounded-2xl hover:border-purple-500/30 transition-colors duration-300 lg:mt-8">
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400 mb-2 sm:mb-4" />
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">150s</div>
                    <div className="text-xs sm:text-sm text-zinc-500 font-medium uppercase tracking-wider">Time Limit</div>
                  </div>

                  {/* Stat Card 3 */}
                  <div className="bg-black/40 backdrop-blur-md border border-white/5 p-4 sm:p-6 rounded-2xl hover:border-purple-500/30 transition-colors duration-300 lg:-mt-8">
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 mb-2 sm:mb-4" />
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">15</div>
                    <div className="text-xs sm:text-sm text-zinc-500 font-medium uppercase tracking-wider">Questions</div>
                  </div>

                  {/* Stat Card 4 */}
                  <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-md border border-white/10 p-4 sm:p-6 rounded-2xl flex flex-col justify-between group cursor-pointer" onClick={() => router.push('/quiz-battle')}>
                    <div className="flex justify-between items-start">
                      <Swords className="w-6 h-6 sm:w-8 sm:h-8 text-white mb-2 sm:mb-4" />
                      <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white leading-tight">Play Now</div>
                      <div className="text-sm text-white/60 mt-1">Multiplayer</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
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
                Complete transparency on how we calculate your fan score in this fun game
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
                Your final verification in this fun game uses a <span className="font-semibold text-purple-400">combined scoring system</span> that 
                averages your Spotify listening history (40%) and quiz performance (60%). 
                The quiz is weighted more, but your Spotify dedication can help boost your score! Remember - it&apos;s all just for fun! 🎮
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
                💜 Remember: This is just a fun game! Even if you don&apos;t ace the quiz, your Spotify listening can help you pass! 
                Being a real ARMY is about your love for BTS, not just memorizing trivia - so have fun and don&apos;t take it too seriously!
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
                Play the fun ARMY verification game - see if you &quot;deserve&quot; your concert ticket!
              </p>
            </div>
            
            <div className="space-y-4">
              {[
                { step: '1', title: 'Connect Spotify', desc: 'Login securely with your Spotify account (or skip if analysis is disabled)' },
                { step: '2', title: 'Listening Analysis', desc: 'We calculate your Spotify fan score based on BTS in your listening history (average score provided if analysis is off)' },
                { step: '3', title: 'Take the Quiz', desc: 'Answer 10 BTS trivia questions. Final score combines Spotify (40%) + Quiz (60%)' },
                { step: '4', title: 'Get Verified', desc: 'If your combined score is 70+, get verified and unlock your &quot;concert ticket&quot; - it&apos;s all just for fun!' },
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
        <Footer />
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
