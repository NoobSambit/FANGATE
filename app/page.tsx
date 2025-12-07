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
          <div className="max-w-6xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
              {/* Animated background gradient mesh */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-pink-950/30 to-purple-950/40" />
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
                <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
              </div>

              {/* Grid pattern overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(147,51,234,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(147,51,234,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />

              {/* Glowing border effect */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 p-[2px]">
                <div className="h-full w-full bg-[#0a0a0f] rounded-2xl sm:rounded-3xl" />
              </div>

              <div className="relative z-10 p-6 sm:p-10 lg:p-16">
                {/* Floating decorative elements - hidden on mobile */}
                <div className="hidden sm:block absolute top-8 right-8 w-20 h-20 border-2 border-purple-500/20 rounded-2xl rotate-12 animate-float" />
                <div className="hidden sm:block absolute bottom-8 left-8 w-16 h-16 border-2 border-pink-500/20 rounded-2xl -rotate-12 animate-float animation-delay-2000" />

                <div className="text-center mb-8 sm:mb-12">
                  {/* Enhanced badge with glow */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 sm:mb-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-full backdrop-blur-xl shadow-lg shadow-purple-500/20 animate-pulse-glow">
                    <Swords className="text-purple-400 animate-swing" size={14} />
                    <span className="text-xs sm:text-sm text-transparent bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text font-bold tracking-wide">
                      LIVE MULTIPLAYER
                    </span>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-ping" />
                  </div>

                  {/* Dynamic title with text effects */}
                  <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 leading-tight">
                    <span className="inline-block animate-gradient-x bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto]">
                      Quiz Battle
                    </span>
                  </h2>

                  <p className="text-sm sm:text-lg lg:text-xl text-white/80 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed font-medium px-2">
                    Challenge your fellow ARMYs in <span className="text-purple-400 font-bold">real-time battles</span>!
                    Prove your knowledge and claim your throne as the <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold">ultimate ARMY</span>.
                  </p>

                  {/* Enhanced Features Grid with hover effects */}
                  <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8 sm:mb-12 max-w-4xl mx-auto">
                    {[
                      { icon: Users, color: 'purple', title: 'Up to 5 Players', desc: 'Battle with friends', stat: '5' },
                      { icon: Trophy, color: 'pink', title: '15 Questions', desc: 'Test your knowledge', stat: '15' },
                      { icon: Clock, color: 'purple', title: '150 Seconds', desc: 'Fast-paced action', stat: '150s' }
                    ].map((feature, idx) => (
                      <div
                        key={idx}
                        className="group relative p-3 sm:p-6 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl sm:rounded-2xl backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
                      >
                        {/* Hover glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 rounded-xl sm:rounded-2xl transition-all duration-300" />

                        <div className="relative">
                          {/* Icon with animated background */}
                          <div className="relative w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4">
                            <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-500/20 to-pink-500/20 rounded-lg sm:rounded-xl blur-lg sm:blur-xl group-hover:blur-xl sm:group-hover:blur-2xl transition-all`} />
                            <div className={`relative w-full h-full bg-gradient-to-br from-${feature.color}-500/10 to-pink-500/10 border border-${feature.color}-500/30 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <feature.icon className={`text-${feature.color}-400 group-hover:scale-110 transition-transform`} size={20} />
                            </div>
                          </div>

                          {/* Stat number */}
                          <div className="text-xl sm:text-3xl font-black text-transparent bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
                            {feature.stat}
                          </div>

                          <div className="text-white font-bold text-xs sm:text-lg mb-0.5 sm:mb-1">{feature.title}</div>
                          <div className="text-xs sm:text-sm text-white/60 hidden sm:block">{feature.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Enhanced CTA Button with multiple effects */}
                  <div className="relative inline-block group">
                    {/* Button glow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl sm:rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse-slow" />

                    <button
                      onClick={() => router.push('/quiz-battle')}
                      className="relative inline-flex items-center gap-2 sm:gap-3 px-6 py-3 sm:px-10 sm:py-5 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 rounded-xl sm:rounded-2xl text-white font-black text-base sm:text-lg tracking-wide transition-all duration-300 hover:scale-105 shadow-2xl shadow-purple-500/50 group-hover:shadow-purple-500/70 bg-[length:200%_auto] hover:bg-right"
                    >
                      <Swords size={20} className="group-hover:rotate-12 transition-transform duration-300" />
                      <span className="relative">
                        START BATTLE
                        <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      </span>
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>

                  {/* Additional context text */}
                  <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-white/50 flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="hidden sm:inline">Real-time multiplayer • No downloads required</span>
                    <span className="sm:hidden">Real-time • No downloads</span>
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
