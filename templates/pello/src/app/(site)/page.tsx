import { Ask } from "@/components/home/ask";
import { Cta } from "@/components/home/cta";
import { Faq } from "@/components/home/faq";
import { Features } from "@/components/home/features";
import { Hero } from "@/components/home/hero";
import { How } from "@/components/home/how";
import { Integrations } from "@/components/home/integrations";
import { Logos } from "@/components/home/logos";
import { More } from "@/components/home/more";
import { Payroll } from "@/components/home/payroll";
import { Pricing } from "@/components/home/pricing";
import { Testimonials } from "@/components/home/testimonials";
import { TimeOff } from "@/components/home/time-off";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Logos />
      <How />
      <Ask />
      <TimeOff />
      <Payroll />
      <Features />
      <More />
      <Testimonials />
      <Integrations />
      <Pricing />
      <Faq />
      <Cta />
    </>
  );
}
