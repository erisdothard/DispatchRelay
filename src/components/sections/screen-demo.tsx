"use client";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { PhoneIncoming, Bot, Database, Send } from "lucide-react";

const flowNodes = [
  { icon: PhoneIncoming, label: "Call Comes In", sub: "Broker dials your line" },
  { icon: Bot, label: "AI Picks Up", sub: "Natural voice, under 2 rings" },
  { icon: Database, label: "Data Pulled", sub: "Live load info fetched" },
  { icon: Send, label: "Summary Sent", sub: "Inbox updated instantly" },
];

export function ScreenDemo() {
  return (
    <section className="bg-[#0A0E1A] overflow-hidden" id="how">
      <ContainerScroll
        titleComponent={
          <div className="mb-6">
            <span className="font-mono text-xs tracking-[0.15em] text-[#C94A28] uppercase">
              / See it in action
            </span>
            <h2 className="text-4xl md:text-[5rem] font-extrabold text-[#F5F2EA] mt-4 leading-none tracking-tight">
              Watch your dispatcher
              <br />
              <span className="text-[#C94A28] italic">get their day back</span>.
            </h2>
          </div>
        }
      >
        <AutomationFlow />
      </ContainerScroll>
    </section>
  );
}

function AutomationFlow() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div
      ref={ref}
      className="w-full h-full bg-[#0A0E1A] text-[#F5F2EA] flex items-center justify-center p-4 md:p-8"
    >
      {/* Desktop: horizontal flow */}
      <div className="hidden md:flex items-center gap-0 w-full max-w-4xl mx-auto">
        {flowNodes.map((node, i) => (
          <div key={node.label} className="flex items-center flex-1">
            {/* Node */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.4 }}
              className="flex flex-col items-center text-center min-w-[120px]"
            >
              <div className="w-16 h-16 bg-[#C94A28] flex items-center justify-center rounded-lg mb-3">
                <node.icon className="w-7 h-7 text-[#F5F2EA]" />
              </div>
              <span className="text-sm font-bold text-[#F5F2EA] leading-tight">{node.label}</span>
              <span className="text-xs text-[#F5F2EA]/40 mt-1">{node.sub}</span>
            </motion.div>

            {/* Connecting line (not after last node) */}
            {i < flowNodes.length - 1 && (
              <div className="flex-1 flex items-center px-2">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: 1 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.4 + 0.3 }}
                  className="h-[2px] w-full bg-gradient-to-r from-[#C94A28] to-[#E8A838] origin-left"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: vertical stack */}
      <div className="flex md:hidden flex-col items-center gap-0 w-full">
        {flowNodes.map((node, i) => (
          <div key={node.label} className="flex flex-col items-center">
            {/* Node */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.4 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 bg-[#C94A28] flex items-center justify-center rounded-lg mb-2">
                <node.icon className="w-6 h-6 text-[#F5F2EA]" />
              </div>
              <span className="text-sm font-bold text-[#F5F2EA] leading-tight">{node.label}</span>
              <span className="text-[11px] text-[#F5F2EA]/40 mt-0.5">{node.sub}</span>
            </motion.div>

            {/* Connecting line (not after last node) */}
            {i < flowNodes.length - 1 && (
              <motion.div
                initial={{ scaleY: 0 }}
                animate={isInView ? { scaleY: 1 } : {}}
                transition={{ duration: 0.3, delay: i * 0.4 + 0.3 }}
                className="w-[2px] h-8 bg-gradient-to-b from-[#C94A28] to-[#E8A838] origin-top my-2"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
