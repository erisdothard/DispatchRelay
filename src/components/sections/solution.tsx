"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    num: "01",
    title: "We port your dispatch line",
    desc: "Answers in under two rings.",
  },
  {
    num: "02",
    title: "It pulls live load data",
    desc: "Connected to your dispatch board, ELD, or spreadsheet.",
  },
  {
    num: "03",
    title: "It answers and logs the call",
    desc: "Status, ETA, location, POD. Handled. Summary in your inbox.",
  },
  {
    num: "04",
    title: "Escalation when it matters",
    desc: "Angry broker or rate negotiation? Transfers with full context.",
  },
];

export function Solution() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how" className="py-24 md:py-32 bg-[#0A0E1A] border-b border-white/10" ref={ref}>
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="font-mono text-xs tracking-[0.15em] text-[#F5F2EA]/50 uppercase">/ The fix</span>
          <h2 className="text-4xl md:text-6xl font-extrabold text-[#F5F2EA] mt-4 mb-16 leading-none tracking-tight max-w-3xl">
            How <em className="italic font-black">Dispatch <span className="text-[#C94A28]">Relay</span></em> works.
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Steps */}
          <div className="space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="group grid grid-cols-[48px_1fr] gap-5 py-6 border-b border-white/10 last:border-b-0 hover:pl-2 transition-all duration-300"
              >
                <div className="w-10 h-10 bg-[#1A1F2E] border border-[#C94A28]/30 text-[#E8A838] flex items-center justify-center font-mono text-sm font-bold group-hover:bg-[#C94A28] group-hover:rotate-[-4deg] group-hover:scale-105 transition-all duration-300">
                  {step.num}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#F5F2EA] mb-1 tracking-tight">{step.title}</h4>
                  <p className="text-sm text-[#F5F2EA]/50 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Audio waveform / visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative bg-[#0A0E1A] p-8 md:p-10 rounded-none border border-white/10">
              <div className="absolute top-[-1px] left-[-1px] right-[-1px] h-1 bg-gradient-to-r from-[#C94A28] to-[#E8A838]" />

              {/* Voice waveform visualization */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                  <span className="font-mono text-[10px] tracking-widest text-[#22C55E] uppercase">Live Processing</span>
                </div>
                <div className="flex items-end gap-[3px] h-20 mb-4">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 bg-[#C94A28]/60 rounded-t-sm"
                      animate={{
                        height: [
                          `${20 + Math.random() * 60}%`,
                          `${20 + Math.random() * 60}%`,
                          `${20 + Math.random() * 60}%`,
                        ],
                      }}
                      transition={{
                        duration: 0.8 + Math.random() * 0.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.03,
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between font-mono text-[10px] text-white/20">
                  <span>00:00</span>
                  <span>00:47</span>
                </div>
              </div>

              {/* Processing pipeline */}
              <div className="space-y-3">
                {["Voice Recognition", "Load Lookup", "Response Generation", "Call Summary"].map((step, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.5 + i * 0.15, duration: 0.4 }}
                    className="flex items-center gap-3 p-3 bg-white/5 border border-white/5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                    <span className="font-mono text-xs text-white/50">{step}</span>
                    <span className="ml-auto font-mono text-[10px] text-[#E8A838]">
                      {["124ms", "89ms", "203ms", "67ms"][i]}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
