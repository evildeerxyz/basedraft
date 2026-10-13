import { Ask } from "@/components/home/ask";
import { Cta } from "@/components/home/cta";
import { DayOne } from "@/components/home/day-one";
import { Faq } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { Overtime } from "@/components/home/overtime";
import { Payroll } from "@/components/home/payroll";
import { Pricing } from "@/components/home/pricing";
import { Privacy } from "@/components/home/privacy";
import { Stories } from "@/components/home/stories";
import { TimeOff } from "@/components/home/time-off";
import { Week } from "@/components/home/week";

/* One Friday at Fieldwork: the day as it opens, then its moments in order, then what it costs. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <TimeOff />
      <Ask />
      <Payroll />
      <DayOne />
      <Overtime />
      <Privacy />
      <Week />
      <Stories />
      <Pricing />
      <Faq />
      <Cta />
    </>
  );
}
