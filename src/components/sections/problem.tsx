"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Phone, Building2, AlertCircle } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";

const problems = [
  {
    num: "01",
    label: "THE CALL VOLUME",
    icon: Phone,
    title: "40-60 check calls a day",
    desc: "One dispatcher. One phone. The math doesn't work.",
  },
  {
    num: "02",
    label: "THE ENTERPRISE GAP",
    icon: Building2,
    title: "Priced out of the real tools",
    desc: "McLeod, Trimble, Parade — built for 200-truck fleets. Not you.",
  },
  {
    num: "03",
    label: "THE COST OF STAYING MANUAL",
    icon: AlertCircle,
    title: "Loads slip through the cracks",
    desc: "Every call your dispatcher is stuck on is a load someone else booked.",
  },
];

export function Problem() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 md:py-32 bg-[#F5F2EA] border-b border-black/10" ref={ref}>
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="font-mono text-xs tracking-[0.15em] text-[#0A0E1A]/50 uppercase">/ The problem</span>
          <h2 className="text-4xl md:text-6xl font-extrabold text-[#0A0E1A] mt-4 mb-16 leading-none tracking-tight max-w-4xl">
            Every small carrier hits the <em className="text-[#C94A28] italic font-black">same wall</em>.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-0 border border-black/15">
          {problems.map((p, i) => (
            <motion.div
              key={p.num}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="group relative p-8 md:p-10 bg-[#F5F2EA] border-r border-black/10 last:border-r-0 hover:bg-white transition-all duration-300 overflow-hidden"
            >
              <Spotlight size={150} className="from-[#C94A28]/20 via-[#C94A28]/5 to-transparent" />
              {/* Ghost decorative number */}
              <span className="absolute top-2 right-4 text-[80px] font-black text-[#C94A28]/8 leading-none select-none pointer-events-none">
                {p.num}
              </span>
              <div className="relative z-10">
                <span className="font-mono text-xs text-[#C94A28] font-semibold tracking-wider">
                  {p.num} / {p.label}
                </span>
                <div className="w-16 h-16 bg-[#C94A28]/8 flex items-center justify-center mt-5 mb-5 group-hover:bg-[#C94A28]/15 transition-colors">
                  <p.icon className="w-7 h-7 text-[#C94A28]" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-[#0A0E1A] mb-3 tracking-tight leading-tight">
                  {p.title}
                </h3>
                <p className="text-sm text-[#0A0E1A]/60 leading-relaxed">
                  {p.desc}
                </p>
                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 w-0 h-[3px] bg-[#C94A28] group-hover:w-full transition-all duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
