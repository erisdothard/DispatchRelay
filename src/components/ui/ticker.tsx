"use client";
import { motion } from "framer-motion";

const items = [
  "SMALL CARRIER BUILT",
  "LIVE IN 10 DAYS",
  "NO ENTERPRISE CONTRACTS",
  "HANDLES BROKER CHECK CALLS",
  "$2,500 FLAT SETUP",
  "BUILT BY THE TEAM BEHIND FREIGHTX",
];

export function Ticker() {
  return (
    <div className="bg-[#0A0E1A] text-[#F5F2EA] py-2.5 overflow-hidden border-b border-[#1A1F2E]">
      <motion.div
        className="flex gap-12 whitespace-nowrap font-mono text-xs tracking-wider"
        animate={{ x: [0, -50 * items.length * 4] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items, ...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 bg-[#E8A838] rounded-full shrink-0 animate-pulse" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
