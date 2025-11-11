'use client';

import { useState } from 'react';
import { X, Twitter } from 'lucide-react';

export default function Footer() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <>
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          {/* Brief Disclaimer Text */}
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed text-center">
              <strong className="text-white/90">Important Disclaimer:</strong> This site is a fun, fan-made activity for entertainment purposes only. 
              It is <strong className="text-white/90">NOT affiliated with HYBE Corporation or BTS</strong>, and is created by a BTS fan. 
              This verification system does not determine whether anyone is "deserving" or not, and should not be taken seriously. 
              All scores and results are for entertainment purposes only.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg border border-purple-500/30 overflow-hidden bg-white/5">
                <img
                  src="/fangate-logo.png"
                  alt="FanGate logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm text-white/40">&copy; {new Date().getFullYear()} FanGate</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Twitter size={16} className="text-purple-400" />
                <a 
                  href="https://x.com/Boy_With_Code" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white/90 transition-colors text-purple-300"
                >
                  @Boy_With_Code
                </a>
                <span className="text-white/40">for support</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-white/40">
                <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
                <button
                  onClick={() => setShowDisclaimer(true)}
                  className="hover:text-white/60 transition-colors cursor-pointer"
                >
                  Disclaimer
                </button>
                <a 
                  href="https://x.com/Boy_With_Code" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white/60 transition-colors"
                >
                  Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-4"
          onClick={() => setShowDisclaimer(false)}
        >
          <div 
            className="glass-effect rounded-xl p-6 sm:p-8 max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-purple-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Disclaimer</h2>
              <button
                onClick={() => setShowDisclaimer(false)}
                className="text-white/60 hover:text-white transition-colors p-1"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4 text-sm sm:text-base text-white/80 leading-relaxed">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <h3 className="font-bold text-red-300 mb-2 text-base sm:text-lg">Legal Disclaimer</h3>
                <p>
                  This website and verification system is <strong>NOT affiliated with, endorsed by, or connected to HYBE Corporation, BTS, or any of their subsidiaries or affiliates</strong>. 
                  This is an independent, fan-made project created solely for entertainment purposes.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2 text-base sm:text-lg">Purpose & Nature</h3>
                <p>
                  FanGate is a fun, fan-created activity designed for entertainment purposes only. 
                  This verification system is <strong>not meant to be taken seriously</strong> and does not determine whether anyone is "deserving" of anything, 
                  including concert tickets, fan status, or any other privileges. The scoring system and quiz are purely for entertainment and should be enjoyed as such.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2 text-base sm:text-lg">No Official Connection</h3>
                <p>
                  This site is created by a BTS fan and is in no way associated with HYBE Corporation, BTS, Big Hit Music, or any official BTS-related entities. 
                  Any references to BTS, their music, members, or related content are used purely for fan appreciation and entertainment purposes.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2 text-base sm:text-lg">Results & Scores</h3>
                <p>
                  All scores, verification results, and quiz outcomes are generated for entertainment purposes only. 
                  They do not reflect any official assessment, do not grant any real privileges or access, and should not be used to make any decisions regarding concert tickets, 
                  fan status, or any other matters. The scoring algorithms are arbitrary and created solely for fun.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2 text-base sm:text-lg">Spotify Integration</h3>
                <p>
                  Spotify analysis features may be limited or disabled due to Spotify API restrictions. 
                  When disabled, average scores may be provided for demonstration purposes. 
                  This does not affect the entertainment nature of this site.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2 text-base sm:text-lg">Creator & Support</h3>
                <p>
                  This site is created and maintained by a BTS fan. For support, questions, or concerns, 
                  please contact <a href="https://x.com/Boy_With_Code" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">@Boy_With_Code</a> on Twitter/X.
                </p>
              </div>

              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-sm sm:text-base">
                  <strong className="text-purple-300">Remember:</strong> This is all in good fun! 
                  Enjoy the quiz, share your results with friends, but please don't take it too seriously. 
                  Being an ARMY is about love for BTS and their music, not about passing a quiz or getting a high score on a fan-made website. 💜
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDisclaimer(false)}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
