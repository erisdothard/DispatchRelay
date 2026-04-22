import { Navbar } from "@/components/sections/navbar";
import { Ticker } from "@/components/ui/ticker";
import { Hero } from "@/components/sections/hero";
import { VoiceDemo } from "@/components/sections/voice-demo";
import { Problem } from "@/components/sections/problem";
import { Solution } from "@/components/sections/solution";
import { Metrics } from "@/components/sections/metrics";
import { Pricing } from "@/components/sections/pricing";
import { Proof } from "@/components/sections/proof";
import { FAQ } from "@/components/sections/faq";
import { CTA } from "@/components/sections/cta";
import { Footer } from "@/components/sections/footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Ticker />
      <Hero />
      <VoiceDemo />
      <Problem />
      <Solution />
      <Metrics />
      <Pricing />
      <Proof />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
