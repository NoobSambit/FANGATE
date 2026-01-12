'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Music, Shield, CheckCircle, ArrowRight, Sparkles, TrendingUp, Clock, Award, Info, Swords, Users, Trophy, Heart, X } from 'lucide-react';
import { getScoringBreakdown } from '@/lib/scoring';
import Footer from '@/components/Footer';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLastfmConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/lastfm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect Last.fm account');
      }

      // Store user info in localStorage for session management
      localStorage.setItem('lastfm_user', JSON.stringify(data.user));
      setConnected(true);

      // Redirect to verification after 1 second
      setTimeout(() => {
        router.push('/verification');
      }, 1000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to connect Last.fm account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d12]">
      {/* Navigation */}
      <nav className="border-b border-purple-950/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden bg-purple-900/30 flex items-center justify-center border border-purple-800/30">
                <img
                  src="/fangate-logo.png"
                  alt="FanGate logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-base sm:text-lg font-semibold text-white">
                Fan<span className="text-purple-400">Gate</span>
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => router.push('/quiz-battle')}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-purple-300 hover:text-purple-200 transition-colors"
              >
                <Swords size={13} />
                <span className="hidden sm:inline">Battle</span>
              </button>
              <button
                onClick={() => setShowDonationModal(true)}
                className="px-3 sm:px-5 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-purple-700 hover:bg-purple-600 transition-colors rounded-lg"
              >
                Donate
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-16 sm:pt-24 sm:pb-20">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 mb-6 sm:mb-10 bg-purple-950/40 border border-purple-900/40 rounded-full">
            <Sparkles className="text-purple-400" size={12} />
            <span className="text-xs sm:text-sm text-purple-300 font-medium">Fun ARMY Game Challenge</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-white mb-6 sm:mb-8 leading-[1.1]">
            Prove You&apos;re a
            <br />
            <span className="text-purple-400">Real ARMY</span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg lg:text-xl text-purple-200/60 mb-8 sm:mb-12 max-w-xl mx-auto leading-relaxed px-2">
            Play the FanGate game! Take a fun quiz challenge to see if you &quot;deserve&quot; your concert ticket.
            Get verified as ARMY and unlock your &quot;ticket&quot; - it&apos;s all just for fun, not serious! 🎟️💜
          </p>

          {/* CTA Section */}
          {connected ? (
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-3 bg-emerald-950/40 border border-emerald-900/40 rounded-lg mb-1 sm:mb-2">
                <CheckCircle className="text-emerald-400" size={16} />
                <span className="text-xs sm:text-sm text-emerald-300 font-medium">Last.fm Connected</span>
              </div>
              <button
                onClick={() => router.push('/verification')}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium text-white bg-purple-700 hover:bg-purple-600 transition-colors rounded-lg"
              >
                Start Verification
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:gap-5 max-w-md mx-auto px-4">
              <form onSubmit={handleLastfmConnect} className="w-full space-y-3 sm:space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your Last.fm username"
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-purple-950/40 border border-purple-900/40 rounded-xl text-white placeholder:text-purple-300/40 focus:outline-none focus:border-purple-700 transition-colors text-sm sm:text-base"
                    required
                  />
                  <Music className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-purple-400/40" size={18} />
                </div>
                <button
                  type="submit"
                  disabled={loading || !username.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium text-white bg-purple-700 hover:bg-purple-600 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-purple-300/30 border-t-white rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Music size={18} />
                      <span className="hidden xs:inline">Connect with Last.fm</span>
                      <span className="xs:hidden">Connect</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              {errorMessage && (
                <div className="w-full p-3 sm:p-4 bg-red-950/40 border border-red-900/40 rounded-xl text-left">
                  <p className="text-red-200 font-medium text-xs sm:text-sm mb-1">Connection Error</p>
                  <p className="text-red-300/70 text-xs sm:text-sm">{errorMessage}</p>
                </div>
              )}

              <p className="text-xs sm:text-sm text-purple-200/50 max-w-md text-center px-2">
                We&apos;ll analyze your public Last.fm listening history to calculate your BTS fan score.
                Make sure your profile is public!
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 sm:mt-8 max-w-md mx-auto p-3 sm:p-4 bg-red-950/40 border border-red-900/40 rounded-xl text-left">
              <p className="text-red-200 font-medium text-xs sm:text-sm mb-1">Error</p>
              <p className="text-red-300/70 text-xs sm:text-sm">{error}</p>
            </div>
          )}

          {/* Security Note */}
          <p className="text-xs sm:text-sm text-purple-200/40 mt-6 sm:mt-10 flex items-center justify-center gap-1.5 sm:gap-2">
            <Shield size={11} />
            We only read public data - no password required
          </p>
        </div>
      </section>

      {/* Quiz Battle Section */}
      <section className="border-t border-purple-950/20 bg-purple-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#15151f] border border-purple-900/30">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 p-5 sm:p-8 md:p-12 lg:p-16 items-center">
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-6 sm:space-y-8">
                <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-black/40 border border-purple-900/40 rounded-full">
                  <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs sm:text-sm font-semibold tracking-wider text-emerald-100 uppercase">Live Now</span>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-[0.9] tracking-tighter">
                    QUIZ
                    <br />
                    <span className="text-purple-400">BATTLE</span>
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg text-purple-200/60 max-w-md leading-relaxed pt-2 sm:pt-3 mx-auto lg:mx-0">
                    Join the ultimate BTS trivia showdown. Play with other fans, test your knowledge, and have fun!
                  </p>
                </div>

                <button
                  onClick={() => router.push('/quiz-battle')}
                  className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-white text-black rounded-xl font-bold text-sm sm:text-base tracking-wide hover:bg-purple-50 transition-all w-full sm:w-auto"
                >
                  JOIN THE FUN
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-black/40 border border-purple-900/30 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl hover:border-purple-700/50 transition-colors">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-400 mb-2 sm:mb-3 md:mb-4" />
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">5</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-purple-200/50 font-medium uppercase tracking-wider">Players Max</div>
                </div>

                <div className="bg-black/40 border border-purple-900/30 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl hover:border-purple-700/50 transition-colors lg:mt-8">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-indigo-400 mb-2 sm:mb-3 md:mb-4" />
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">200s</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-purple-200/50 font-medium uppercase tracking-wider">Time Limit</div>
                </div>

                <div className="bg-black/40 border border-purple-900/30 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl hover:border-purple-700/50 transition-colors lg:-mt-8">
                  <Trophy className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-amber-400 mb-2 sm:mb-3 md:mb-4" />
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">15</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-purple-200/50 font-medium uppercase tracking-wider">Questions</div>
                </div>

                <div
                  onClick={() => router.push('/quiz-battle')}
                  className="bg-purple-900/30 border border-purple-700/40 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl flex flex-col justify-between cursor-pointer hover:bg-purple-900/40 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <Swords className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-300 mb-2 sm:mb-3 md:mb-4" />
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300/50" />
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-bold text-white leading-tight">Play Now</div>
                    <div className="text-xs sm:text-sm text-purple-200/60 mt-0.5 sm:mt-1">Multiplayer</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scoring System Section */}
      <section className="border-t border-purple-950/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
              Scoring System
            </h2>
            <p className="text-purple-200/60 text-sm sm:text-base md:text-lg mb-3 sm:mb-4 px-2">
              Complete transparency on how we calculate your fan score in this fun game
            </p>
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-950/40 border border-purple-900/40 rounded-full">
              <Info className="text-purple-400" size={14} />
              <span className="text-xs sm:text-sm text-purple-300">
                Minimum score required: 70 points | Quiz: 10 questions (70% to pass)
              </span>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
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
                <div key={idx} className="bg-purple-950/20 border border-purple-900/30 p-4 sm:p-5 md:p-6 rounded-xl">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-purple-900/40 rounded-lg flex items-center justify-center border border-purple-800/40">
                      <Icon className="text-purple-400" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white">
                          {category.name}
                        </h3>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {'pointsPerTrack' in category || 'pointsPerArtist' in category ? (
                            <span className="text-xs sm:text-sm font-semibold text-purple-400">
                              {('pointsPerTrack' in category ? category.pointsPerTrack : category.pointsPerArtist)} pts/{'pointsPerTrack' in category ? 'track' : 'artist'}
                            </span>
                          ) : (
                            <span className="text-xs sm:text-sm font-semibold text-purple-400">
                              +{'points' in category ? category.points : 0} points
                            </span>
                          )}
                          <span className="text-[10px] sm:text-xs text-purple-200/40">
                            (max {category.maxPoints})
                          </span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-purple-200/60 mb-1.5 sm:mb-2">{category.description}</p>
                      <p className="text-[10px] sm:text-xs text-purple-200/50 mb-2 sm:mb-3">{category.requirement}</p>
                      <div className="p-2 sm:p-3 bg-purple-900/20 rounded-lg border border-purple-800/20">
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
          <div className="mt-6 sm:mt-8 bg-purple-950/30 border border-purple-800/40 p-4 sm:p-5 md:p-6 rounded-xl">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Award className="text-purple-400" size={18} />
              Final Verification Score
            </h3>
            <p className="text-xs sm:text-sm text-purple-200/70 mb-3 sm:mb-5">
              Your final verification in this fun game uses a <span className="font-semibold text-purple-400">combined scoring system</span> that
              averages your Last.fm listening history (40%) and quiz performance (60%).
              The quiz is weighted more, but your Last.fm dedication can help boost your score! Remember - it&apos;s all just for fun! 🎮
            </p>
            <div className="p-3 sm:p-4 bg-purple-900/20 rounded-lg mb-3 sm:mb-5 border border-purple-800/20">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-xs sm:text-sm text-purple-200/60">Last.fm Score:</span>
                <span className="text-xs sm:text-sm font-semibold text-purple-400">40% weight</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-purple-200/60">Quiz Score:</span>
                <span className="text-xs sm:text-sm font-semibold text-purple-400">60% weight</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">
                  {getScoringBreakdown().summary.combinedMinimum}+
                </div>
                <div className="text-[10px] sm:text-sm text-purple-200/50">Min Combined</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">
                  {getScoringBreakdown().summary.quizQuestions}
                </div>
                <div className="text-[10px] sm:text-sm text-purple-200/50">Quiz Questions</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">
                  {getScoringBreakdown().summary.maxScore}
                </div>
                <div className="text-[10px] sm:text-sm text-purple-200/50">Max Last.fm</div>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm text-purple-300/70 mt-3 sm:mt-5 leading-relaxed">
              💜 Remember: This is just a fun game! Even if you don&apos;t ace the quiz, your Last.fm listening can help you pass!
              Being a real ARMY is about your love for BTS, not just memorizing trivia - so have fun and don&apos;t take it too seriously!
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-purple-950/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
              How It Works
            </h2>
            <p className="text-purple-200/60 text-sm sm:text-base md:text-lg px-2">
              Play the fun ARMY verification game - see if you &quot;deserve&quot; your concert ticket!
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {[
              { step: '1', title: 'Connect Last.fm', desc: 'Enter your Last.fm username - no password needed!' },
              { step: '2', title: 'Listening Analysis', desc: 'We analyze your public Last.fm history to calculate your BTS fan score' },
              { step: '3', title: 'Take the Quiz', desc: 'Answer 10 BTS trivia questions. Final score combines Last.fm (40%) + Quiz (60%)' },
              { step: '4', title: 'Get Verified', desc: 'If your combined score is 70+, get verified and unlock your &quot;concert ticket&quot; - it&apos;s all just for fun!' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 md:p-6 bg-purple-950/20 border border-purple-900/30 rounded-xl">
                <div className="flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 bg-purple-800 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base">
                  {item.step}
                </div>
                <div className="flex-1 pt-0.5 sm:pt-1">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-0.5 sm:mb-1">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-purple-200/60">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#15151f] border border-purple-900/40 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowDonationModal(false)}
              className="absolute top-3 sm:top-4 right-3 sm:right-4 p-1.5 sm:p-2 text-purple-200/60 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
                Support FANGATE
              </h2>
              <div className="h-1 w-16 sm:w-20 bg-purple-700 rounded-full" />
            </div>

            <div className="space-y-3 sm:space-y-4 text-purple-200/80 mb-5 sm:mb-8 text-sm sm:text-base">
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

            <a
              href="https://ko-fi.com/noobsambit"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-5 sm:px-6 py-3 sm:py-4 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-xl transition-all text-sm sm:text-base"
            >
              <Heart size={18} className="fill-current" />
              <span>Donate on Ko-fi</span>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
