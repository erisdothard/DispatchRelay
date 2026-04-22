"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Spotlight } from "@/components/ui/spotlight";
import { Zap, Clock, ShieldCheck, Sparkles } from "lucide-react";

const stats = [
  { value: "< 2s", label: "Average pickup time", icon: Zap },
  { value: "10", label: "Days to go live", icon: Clock },
  { value: "24/7", label: "Always on coverage", icon: ShieldCheck },
  { value: "", label: "Anthropic Certified", icon: Sparkles },
];

export function Proof() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="proof" className="py-24 md:py-32 bg-[#F5F2EA] border-b border-black/10" ref={ref}>
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Text + Stats */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <span className="font-mono text-xs tracking-[0.15em] text-[#0A0E1A]/50 uppercase">/ The proof</span>
              <h2 className="text-4xl md:text-6xl font-extrabold text-[#0A0E1A] mt-4 mb-8 leading-none tracking-tight">
                Built by people who actually <em className="text-[#C94A28] italic font-black">build for freight</em>.
              </h2>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-[#0A0E1A]/60 text-lg leading-relaxed mb-10"
            >
              Already trusted by carriers who can&apos;t afford to miss a single check call.
            </motion.p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 border-t border-l border-black/15">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="p-6 border-r border-b border-black/15 hover:bg-[#ECE7D9] transition-colors"
                >
                  <stat.icon className="w-5 h-5 text-[#C94A28] mb-3" />
                  {stat.value ? (
                    <div className="text-5xl font-black text-[#C94A28] mb-2 leading-none">
                      {stat.value}
                    </div>
                  ) : (
                    <div className="text-2xl font-black text-[#C94A28] mb-2 leading-none">
                      {stat.label}
                    </div>
                  )}
                  {stat.value && (
                    <div className="font-mono text-[10px] tracking-wider text-[#0A0E1A]/50 uppercase leading-snug">
                      {stat.label}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right - Client cards */}
          <div className="space-y-6">
            {[
              {
                name: "3 Aces Trucking Inc.",
                role: "Small carrier · Nashville, TN",
                quote: "We were losing broker relationships because nobody could pick up the phone fast enough. Now every call gets answered before the second ring.",
              },
              {
                name: "More carriers coming soon",
                role: "Pilot program · Now accepting applications",
                quote: "We\u2019re onboarding carriers running 5\u201350 trucks who are tired of burning dispatch hours on check calls. Be next.",
                isCta: true,
              },
            ].map((client, i) => (
              <motion.div
                key={client.name}
                initial={{ opacity: 0, x: 40 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.2 + i * 0.15 }}
                className="relative group"
              >
                <div className={`relative p-8 md:p-10 hover:translate-y-[-4px] transition-transform duration-400 ${
                  client.isCta
                    ? "bg-[#0A0E1A]/5 border-2 border-dashed border-[#C94A28]/30"
                    : "bg-[#0A0E1A] text-[#F5F2EA]"
                }`}>
                  {!client.isCta && (
                    <Spotlight size={250} className="from-[#E8A838]/20 via-[#E8A838]/5 to-transparent" />
                  )}

                  <div className="relative z-10">
                    <h3 className={`text-2xl md:text-3xl font-extrabold tracking-tight mb-1 ${
                      client.isCta ? "text-[#0A0E1A]" : ""
                    }`}>
                      {client.name}
                    </h3>
                    <div className={`font-mono text-sm mb-6 tracking-wider ${
                      client.isCta ? "text-[#C94A28]" : "text-[#E8A838]"
                    }`}>
                      {client.role}
                    </div>
                    <p className={`leading-relaxed ${
                      client.isCta ? "text-[#0A0E1A]/60" : "text-white/70"
                    }`}>
                      &ldquo;{client.quote}&rdquo;
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
