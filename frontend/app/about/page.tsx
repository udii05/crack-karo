import type { Metadata } from "next";
import InfoPage from "@/components/landing/InfoPage";

export const metadata: Metadata = {
  title: "About | Crack Karo",
  description: "Why Crack Karo exists and how it helps candidates prepare with evidence.",
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="Company"
      title="Built for the interview you actually want."
      description="Crack Karo is a voice-first interview practice workspace for people who want to walk into the room prepared, not just hopeful."
    >
      <p>
        Most interview preparation is passive: reading lists, watching videos, and
        rehearsing answers silently. Crack Karo is designed around the part that
        actually changes outcomes — practising out loud and reviewing what you said.
      </p>
      <p>
        Every session gives you a realistic interview, a transcript, a score, and a
        clear next step. Over time, those sessions become a record of your progress
        and a practical plan for the role you are targeting.
      </p>
      <h2 className="pt-4 text-base font-bold text-ink-900">What we believe</h2>
      <p>
        Good preparation should be specific to you. That is why feedback is grounded
        in your own answers, your target role, and the skills you need to strengthen
        next — not generic advice that could apply to anyone.
      </p>
    </InfoPage>
  );
}
