"use client";
import { motion } from "framer-motion";
import { Phone, ArrowRight } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { AceteritySpotlight } from "@/components/ui/aceternity-spotlight";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0A0E1A]">
      <AceteritySpotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#C94A28" />
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" size={400} />
      <Spotlight className="top-40 right-0 md:right-40" size={300} />

      {/* Animated grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(245,242,234,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,242,234,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-[#C94A28]/10 blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] rounded-full bg-[#E8A838]/8 blur-[100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 w-full py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#C94A28]/30 rounded-full mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="font-mono text-xs tracking-widest text-[#E8A838] uppercase">
                For small trucking carriers
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-[#F5F2EA] leading-[0.95] tracking-tight mb-8"
            >
              Your dispatcher
              <br />
              shouldn&apos;t{" "}
              <span className="italic text-[#C94A28] relative">
                live
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M0 6C50 2 150 2 200 6" stroke="#C94A28" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
              <br />
              on the phone.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg md:text-xl text-[#F5F2EA]/60 max-w-lg mb-10 leading-relaxed"
            >
              DispatchRelay is an AI voice system that handles inbound broker check calls
              for your fleet. Your dispatcher stops answering &ldquo;where&apos;s my load?&rdquo;
              forty times a day and starts booking freight.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <a
                href="#book"
                className="group flex items-center gap-3 px-7 py-4 bg-[#C94A28] text-[#F5F2EA] font-semibold text-base hover:bg-[#E05A35] transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#0A0E1A]"
              >
                Book a 15-min call
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#how"
                className="flex items-center gap-3 px-7 py-4 border border-[#F5F2EA]/20 text-[#F5F2EA] font-semibold text-base hover:bg-[#F5F2EA]/5 transition-all duration-200"
              >
                See how it works
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center gap-4"
            >
              <div className="flex -space-x-2">
                {["3A", "JL", "MR"].map((initials, i) => (
                  <div
                    key={initials}
                    className="w-8 h-8 rounded-full border-2 border-[#0A0E1A] flex items-center justify-center text-[10px] font-bold text-[#F5F2EA]"
                    style={{ background: ["#1A1F2E", "#C94A28", "#252A3A"][i] }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <span className="font-mono text-xs text-[#F5F2EA]/40 tracking-wide">
                Built for carriers running 5–50 trucks
              </span>
            </motion.div>
          </div>

          {/* Right - 3D Scene + Live Call Simulation */}
          <motion.div
            initial={{ opacity: 0, x: 60, rotateY: -8 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <LiveCallSimulation />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function LiveCallSimulation() {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-[#C94A28]/20 via-[#E8A838]/10 to-[#C94A28]/20 blur-2xl rounded-3xl" />

      <div className="relative bg-[#0F1320] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0A0E1A]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
          </div>
          <div className="flex-1 text-center">
            <span className="font-mono text-[10px] text-white/30 tracking-wider">DISPATCHRELAY v2.1</span>
          </div>
        </div>

        {/* Call status bar */}
        <div className="px-5 py-3 bg-[#0D1117] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="font-mono text-xs text-[#22C55E]">ACTIVE CALL</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3 text-white/30" />
            <span className="font-mono text-xs text-white/30">00:47</span>
          </div>
        </div>

        {/* Transcript */}
        <div className="p-5 space-y-3 min-h-[350px]">
          <TranscriptMessage
            label="BROKER INBOUND"
            sender="Mike @ Sunrise Logistics"
            text={`"Hey, this is Mike at Sunrise Logistics. Just checking on load 4581, the Nashville to Dallas run."`}
            delay={0.6}
            type="broker"
          />
          <TranscriptMessage
            label="DISPATCHRELAY"
            sender="AI Voice Agent"
            text={`"Hi Mike. Load 4581 picked up at 7:14 this morning. Driver's currently 42 miles east of Little Rock, ETA to Dallas is 4:20 PM Central. Want me to send a tracking link?"`}
            delay={1.8}
            type="ai"
          />
          <TranscriptMessage
            label="BROKER"
            sender="Mike @ Sunrise Logistics"
            text={`"Yeah send it. Thanks."`}
            delay={3.0}
            type="broker"
          />
          <TranscriptMessage
            label="DISPATCHRELAY"
            sender="AI Voice Agent"
            text={`"Sent. Have a good one, Mike."`}
            delay={3.8}
            type="ai"
          />

          {/* Status update */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 4.6, duration: 0.4 }}
            className="mt-4 p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              <span className="font-mono text-[10px] text-[#22C55E] tracking-wider">CALL LOGGED</span>
            </div>
            <p className="font-mono text-xs text-white/40 mt-1">
              Summary sent to dispatcher inbox. Tracking link delivered to broker.
            </p>
          </motion.div>
        </div>

        {/* Bottom stats */}
        <div className="px-5 py-3 bg-[#0A0E1A] border-t border-white/5 flex items-center justify-between">
          <span className="font-mono text-[10px] text-white/20">47 calls handled today</span>
          <span className="font-mono text-[10px] text-[#E8A838]">avg 1.8s response</span>
        </div>
      </div>
    </div>
  );
}

function TranscriptMessage({
  label,
  sender,
  text,
  delay,
  type,
}: {
  label: string;
  sender: string;
  text: string;
  delay: number;
  type: "broker" | "ai";
}) {
  const isBroker = type === "broker";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`p-3 rounded-lg font-mono text-xs leading-relaxed ${
        isBroker
          ? "bg-white/5 border-l-2 border-[#E8A838]"
          : "bg-[#C94A28]/10 border-l-2 border-[#C94A28]"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] tracking-wider text-white/30 uppercase">{label}</span>
        <span className="text-[10px] text-white/20">{sender}</span>
      </div>
      <p className="text-white/70">{text}</p>
    </motion.div>
  );
}
