"use client";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "Does the AI sound robotic?",
    a: "No. It uses modern voice AI, not 2015-era IVR. Brokers have trouble telling it's not human on routine calls. When it can't handle something, it transfers — it doesn't pretend.",
  },
  {
    q: "What if a broker asks something it can't answer?",
    a: "Transfers to your dispatcher with the caller name, load reference, and a summary. They pick up already knowing the context.",
  },
  {
    q: "Do I need to replace my existing dispatch software?",
    a: "No. DispatchRelay integrates on top of whatever you use — TMS, load board, ELD, even spreadsheets. We build the bridge.",
  },
  {
    q: "What happens after the 10-day setup?",
    a: "The system is yours. $300/month covers the phone line, voice infrastructure, and ongoing tuning.",
  },
  {
    q: "Why $2,500 when enterprise tools cost $2,000 a month?",
    a: "Enterprise tools are built for 200-truck fleets with IT departments. You need your dispatcher off the phone — that's what this costs to build well.",
  },
  {
    q: "What's the deposit?",
    a: "50% upfront, 50% at go-live. We don't start building until the deposit clears, and you don't pay the rest until it's working on your line.",
  },
];

export function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 md:py-32 bg-[#ECE7D9]" ref={ref}>
      <div className="max-w-4xl mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="font-mono text-xs tracking-[0.15em] text-[#0A0E1A]/50 uppercase">/ Common questions</span>
          <h2 className="text-4xl md:text-6xl font-extrabold text-[#0A0E1A] mt-4 mb-16 leading-none tracking-tight">
            Answered <em className="text-[#C94A28] italic font-black">straight</em>.
          </h2>
        </motion.div>

        <div className="border-t border-black/15">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="border-b border-black/15"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center gap-4 py-6 text-left hover:text-[#C94A28] transition-colors group"
              >
                <span className="font-mono text-sm text-[#C94A28] font-bold shrink-0 w-6">Q</span>
                <span className="text-lg md:text-xl font-bold text-[#0A0E1A] group-hover:text-[#C94A28] transition-colors flex-1">
                  {faq.q}
                </span>
                <div className="shrink-0">
                  {openIndex === i ? (
                    <Minus className="w-5 h-5 text-[#C94A28]" />
                  ) : (
                    <Plus className="w-5 h-5 text-[#0A0E1A]/30" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="text-[#0A0E1A]/60 leading-relaxed pl-10 pb-6">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
