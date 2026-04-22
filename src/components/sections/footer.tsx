export function Footer() {
  return (
    <footer className="bg-[#0A0E1A] text-[#F5F2EA] py-16">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid md:grid-cols-3 gap-12 mb-12 pb-12 border-b border-white/10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/logo-dr.png" alt="DR" className="w-8 h-8 rounded-[4px]" />
              <span className="font-extrabold text-base">Dispatch <span className="text-[#C94A28]">Relay</span></span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              AI voice systems for small trucking carriers. Get your dispatcher off the phone and back to booking loads.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-mono text-[10px] tracking-widest text-[#E8A838] uppercase mb-4">Product</h4>
            <div className="space-y-2">
              {[
                { label: "How it works", href: "#how" },
                { label: "Pricing", href: "#offers" },
                { label: "Case study", href: "#proof" },
                { label: "FAQ", href: "#faq" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-white/50 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-mono text-[10px] tracking-widest text-[#E8A838] uppercase mb-4">Contact</h4>
            <div className="space-y-2">
              <a href="mailto:erisdothard1@gmail.com" className="block text-sm text-white/50 hover:text-white transition-colors">
                erisdothard1@gmail.com
              </a>
              <a href="#book" className="block text-sm text-white/50 hover:text-white transition-colors">
                Book a call
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="font-mono text-xs text-white/30">&copy; 2026 Syntra AI · Nashville, TN</span>
          <span className="font-mono text-xs text-white/30">Built with AI. Shipped for freight.</span>
        </div>
      </div>
    </footer>
  );
}
