"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";

const tiers = [
  {
    tag: "/ Lite",
    name: "After-Hours Line",
    desc: "For owner-operators with 1-4 trucks who need coverage when they're off",
    price: "$500",
    priceSub: "setup + $99/mo",
    features: [
      "AI answers when you can't (after-hours, weekends)",
      "Takes messages, logs every caller",
      "Transcript sent to your inbox",
      "Live in 5 business days",
    ],
    cta: "Get started",
    featured: false,
  },
  {
    tag: "/ Tier 01",
    name: "Inbound Voice",
    desc: "The AI receptionist for your dispatch line — 5-15 trucks",
    price: "$1,500",
    priceSub: "setup + $300/mo",
    features: [
      "AI answers inbound broker check calls",
      "Pulls load status from your system",
      "Logs every call, summarizes to inbox",
      "Transfers to humans when needed",
      "After-hours coverage included",
      "Live in 10 business days",
    ],
    cta: "Start here",
    featured: false,
  },
  {
    tag: "/ Tier 02",
    name: "Two-Way Voice Ops",
    desc: "Your AI dispatcher's phone team — 10-30 trucks",
    price: "$2,500",
    priceSub: "setup + $550/mo",
    features: [
      "Everything in Tier 01",
      "Outbound rate-checking calls to brokers",
      "Driver check-in calls (status updates)",
      "Appointment confirmation calls",
      "SMS recap after every interaction",
      "Call recordings + searchable transcripts",
    ],
    cta: "Most carriers pick this",
    featured: true,
  },
  {
    tag: "/ Tier 03",
    name: "Voice Intelligence",
    desc: "Your phone system becomes a data engine — 30+ trucks",
    price: "$6,500",
    priceSub: "setup + $900/mo",
    features: [
      "Everything in Tier 02",
      "Multi-line concurrent handling (5+ calls)",
      "Custom voice training on your brokers & lanes",
      "Weekly intelligence reports",
      "Sentiment + tone analysis on broker calls",
      "Bulk SMS load offers to driver pool",
    ],
    cta: "Talk about it",
    featured: false,
  },
];

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="offers" className="py-24 md:py-32 bg-[#0A0E1A] relative overflow-hidden" ref={ref}>
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C94A28]/5 rounded-full blur-[200px]" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="font-mono text-xs tracking-[0.15em] text-[#E8A838] uppercase">/ Pricing</span>
          <h2 className="text-4xl md:text-6xl font-extrabold text-[#F5F2EA] mt-4 mb-16 leading-none tracking-tight">
            Four tiers. <em className="text-[#E8A838] italic font-black">One price</em> for each.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-0 border border-white/10">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className={`relative p-8 md:p-10 border-r border-white/10 last:border-r-0 transition-all duration-300 group flex flex-col h-full ${
                tier.featured
                  ? "bg-[#F5F2EA] text-[#0A0E1A] md:scale-y-[1.02] shadow-2xl z-10"
                  : "hover:bg-[#1A1F2E]"
              }`}
            >
              {tier.featured && (
                <>
                  <Spotlight size={200} className="from-[#C94A28]/30 via-[#C94A28]/5 to-transparent" />
                  <div className="absolute top-0 left-0 bg-[#C94A28] text-[#F5F2EA] px-3 py-1 font-mono text-[10px] tracking-widest font-semibold">
                    MOST POPULAR
                  </div>
                </>
              )}

              <div className="relative z-10 flex flex-col h-full">
                <span className={`font-mono text-xs tracking-wider uppercase ${tier.featured ? "text-[#C94A28]" : "text-[#E8A838]"}`}>
                  {tier.tag}
                </span>
                <h3 className={`text-2xl md:text-3xl font-extrabold mt-4 mb-2 tracking-tight ${tier.featured ? "text-[#0A0E1A]" : "text-[#F5F2EA]"}`}>
                  {tier.name}
                </h3>
                <p className={`text-sm mb-8 ${tier.featured ? "text-[#0A0E1A]/60" : "text-white/40"}`}>
                  {tier.desc}
                </p>

                <div className={`text-4xl md:text-5xl font-black mb-1 ${tier.featured ? "text-[#0A0E1A]" : "text-[#F5F2EA]"}`}>
                  {tier.price}
                </div>
                <div className={`font-mono text-sm mb-8 ${tier.featured ? "text-[#C94A28]" : "text-[#E8A838]"}`}>
                  {tier.priceSub}
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className={`flex items-start gap-3 text-sm ${tier.featured ? "text-[#0A0E1A]/70" : "text-white/50"}`}>
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${tier.featured ? "text-[#C94A28]" : "text-[#E8A838]"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex-grow" />
                <a
                  href="#book"
                  className={`flex items-center justify-center gap-2 w-full py-4 font-bold text-sm transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] ${
                    tier.featured
                      ? "bg-[#0A0E1A] text-[#F5F2EA] hover:bg-[#C94A28] hover:shadow-[3px_3px_0_#0A0E1A]"
                      : "bg-[#E8A838] text-[#0A0E1A] hover:bg-[#F5F2EA] hover:shadow-[3px_3px_0_#E8A838]"
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
