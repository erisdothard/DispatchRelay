"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const metrics = [
  { value: 40, suffix: "+", label: "Calls handled per day" },
  { value: 2, suffix: "s", label: "Average answer time" },
  { value: 10, suffix: "", label: "Days to go live" },
  { value: 24, suffix: "/7", label: "Always on, never burned out" },
];

export function Metrics() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 md:py-28 bg-[#0A0E1A] border-b border-[#1A1F2E]" ref={ref}>
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center py-8 md:py-10 border-r border-white/5 last:border-r-0"
            >
              <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#F5F2EA] to-[#E8A838] leading-none mb-3">
                <AnimatedCounter target={m.value} suffix={m.suffix} />
              </div>
              <div className="font-mono text-[10px] md:text-xs tracking-wider text-white/40 uppercase">
                {m.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
