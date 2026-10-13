import { Ask } from "@/components/home/ask";
import { Cta } from "@/components/home/cta";
import { Faq } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { Insights } from "@/components/home/insights";
import { Logos } from "@/components/home/logos";
import { Onboarding } from "@/components/home/onboarding";
import { Payroll } from "@/components/home/payroll";
import { Pricing } from "@/components/home/pricing";
import { Security } from "@/components/home/security";
import { Stats } from "@/components/home/stats";
import { Testimonials } from "@/components/home/testimonials";
import { TimeOff } from "@/components/home/time-off";
import { Week } from "@/components/home/week";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Logos />
      <Ask />
      <TimeOff />
      <Onboarding />
      <Payroll />
      <Week />
      <Insights />
      <Stats />
      <Security />
      <Testimonials />
      <Pricing />
      <Faq />
      <Cta />
    </>
  );
}
