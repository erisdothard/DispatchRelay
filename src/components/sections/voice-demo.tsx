"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, PhoneOff } from "lucide-react";

export function VoiceDemo() {
  return (
    <ConversationProvider agentId="agent_5701kprvvdgefb4r1tc9nnease5a">
      <VoiceDemoInner />
    </ConversationProvider>
  );
}

function VoiceDemoInner() {
  const { status, startSession, endSession } = useConversation();

  const isActive = status === "connected" || status === "connecting";

  function handleToggle() {
    if (isActive) {
      endSession();
    } else {
      startSession();
    }
  }

  const statusLabel: Record<string, string> = {
    disconnected: "Ready",
    connecting: "Connecting...",
    connected: "Listening...",
    error: "Connection error — try again",
  };

  return (
    <section className="relative overflow-hidden bg-[#0A0E1A] py-20 md:py-28">
      {/* Subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(245,242,234,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,242,234,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Gradient orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#C94A28]/8 blur-[150px]" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#C94A28]/30 rounded-full mb-6"
        >
          <span className="font-mono text-xs tracking-widest text-[#E8A838] uppercase">
            / Try it now
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#F5F2EA] leading-tight tracking-tight mb-4"
        >
          Talk to Dispatch{" "}
          <span className="text-[#C94A28]">Relay</span>.
          <br />
          Right now.
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base md:text-lg text-[#F5F2EA]/50 mb-12 max-w-xl mx-auto"
        >
          Click the button. Ask about load #4581. See what your dispatcher
          won&apos;t have to.
        </motion.p>

        {/* Button area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative inline-flex flex-col items-center"
        >
          {/* Pulsing rings when connected */}
          <AnimatePresence>
            {status === "connected" && (
              <>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0.6, scale: 1 }}
                    animate={{ opacity: 0, scale: 2.2 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.6,
                      ease: "easeOut",
                    }}
                    className="absolute inset-0 rounded-full border-2 border-[#22C55E]/40 pointer-events-none"
                    style={{
                      top: "50%",
                      left: "50%",
                      width: "100%",
                      height: "auto",
                      aspectRatio: "1",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleToggle}
            disabled={status === "connecting"}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className={`
              relative z-10 flex items-center justify-center gap-3
              px-10 py-5 text-lg font-bold transition-all duration-300
              w-full sm:w-auto cursor-pointer
              disabled:opacity-60 disabled:cursor-not-allowed
              ${
                isActive
                  ? "bg-[#0F1320] text-[#22C55E] border-2 border-[#22C55E]/60 shadow-[0_0_30px_rgba(34,197,94,0.15)]"
                  : "bg-[#C94A28] text-[#F5F2EA] border-2 border-[#C94A28] hover:bg-[#E05A35] hover:border-[#E05A35]"
              }
            `}
          >
            {isActive ? (
              <>
                <PhoneOff className="w-5 h-5" />
                End Call
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Start a Demo Call
              </>
            )}
          </motion.button>

          {/* Audio indicator when connected */}
          <AnimatePresence>
            {status === "connected" && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-1 mt-4"
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ scaleY: [1, 2.5, 1] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut",
                    }}
                    className="w-1 h-3 bg-[#22C55E] rounded-full origin-center"
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Status text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="font-mono text-xs text-[#F5F2EA]/30 mt-6 tracking-wider uppercase"
        >
          {statusLabel[status] ?? status}
        </motion.p>
      </div>
    </section>
  );
}
