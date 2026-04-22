"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";

const links = [
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#offers" },
  { label: "Proof", href: "#proof" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Scroll progress */}
      <div className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-[#C94A28] to-[#E8A838] z-[100]" style={{ width: `${progress}%` }} />

      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#F5F2EA]/90 backdrop-blur-xl shadow-lg py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <img src="/logo-dr.png" alt="DR" className="w-8 h-8 rounded-[4px] group-hover:rotate-[-6deg] group-hover:scale-110 transition-transform duration-300" />
            <span className={`font-extrabold text-base tracking-tight ${scrolled ? "text-[#0A0E1A]" : "text-[#F5F2EA]"}`}>
              Dispatch <span className="text-[#C94A28]">Relay</span>
            </span>
            <span className={`hidden sm:inline font-mono text-[10px] ${scrolled ? "text-[#0A0E1A]/40" : "text-white/40"}`}>
              / by Syntra AI
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium relative group ${scrolled ? "text-[#0A0E1A]" : "text-[#F5F2EA]/80 hover:text-[#F5F2EA]"}`}
              >
                {link.label}
                <span className="absolute left-0 bottom-[-2px] w-0 h-[2px] bg-[#C94A28] group-hover:w-full transition-all duration-300" />
              </a>
            ))}
            <a
              href="#book"
              className={`group flex items-center gap-2 px-5 py-2.5 font-semibold text-sm transition-all duration-200 ${
                scrolled
                  ? "bg-[#0A0E1A] text-[#F5F2EA] hover:bg-[#C94A28]"
                  : "bg-[#F5F2EA] text-[#0A0E1A] hover:bg-[#E8A838]"
              }`}
            >
              <span>Book a call</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className={`w-6 h-6 ${scrolled ? "text-[#0A0E1A]" : "text-[#F5F2EA]"}`} />
            ) : (
              <Menu className={`w-6 h-6 ${scrolled ? "text-[#0A0E1A]" : "text-[#F5F2EA]"}`} />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#F5F2EA] z-40 flex flex-col items-start justify-center px-8 gap-6"
          >
            {links.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="text-3xl font-bold text-[#0A0E1A] hover:text-[#C94A28] transition-colors"
              >
                {link.label}
              </motion.a>
            ))}
            <motion.a
              href="#book"
              onClick={() => setMenuOpen(false)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: links.length * 0.08 }}
              className="mt-4 px-8 py-4 bg-[#C94A28] text-[#F5F2EA] font-bold text-lg"
            >
              Book a call
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
