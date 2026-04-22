"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

export function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="book" className="relative py-28 md:py-40 bg-[#C94A28] overflow-hidden" ref={ref}>
      {/* Ghost text */}
      <div className="absolute bottom-[-40px] left-[-20px] text-[200px] md:text-[280px] font-black text-white/[0.04] leading-none tracking-tighter pointer-events-none select-none">
        DISPATCHRELAY
      </div>

      {/* Gradient blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E05A35]/50 rounded-full blur-[200px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#8F3319]/50 rounded-full blur-[150px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center max-w-3xl mx-auto px-6"
      >
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-[#F5F2EA] leading-[0.95] tracking-tight mb-8">
          Get your dispatcher off the phone.
        </h2>
        <p className="text-xl md:text-2xl text-white/80 mb-12 leading-relaxed">
          15-minute call. We&apos;ll look at your current call volume, show you a live demo, and quote your build.
          No slide decks. No BS.
        </p>
        <a
          href="mailto:erisdothard1@gmail.com?subject=DispatchRelay%20inquiry"
          className="group inline-flex items-center gap-3 px-10 py-5 bg-[#0A0E1A] text-[#F5F2EA] font-bold text-lg hover:bg-[#F5F2EA] hover:text-[#0A0E1A] transition-all duration-200 hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[6px_6px_0_rgba(10,14,26,0.3)]"
        >
          Book a call
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
        </a>
      </motion.div>
    </section>
  );
}
