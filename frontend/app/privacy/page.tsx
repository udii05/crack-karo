import type { Metadata } from "next";
import InfoPage from "@/components/landing/InfoPage";

export const metadata: Metadata = {
  title: "Privacy | Crack Karo",
  description: "How Crack Karo handles account, interview, and provider data.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy, plainly."
      description="This page explains the data Crack Karo needs to run your practice workspace and how it is handled."
    >
      <p>
        We store the account details you provide, the interview questions and
        transcripts you create, your scores and feedback, and the preferences you
        save in your workspace.
      </p>
      <h2 className="pt-4 text-base font-bold text-ink-900">AI provider keys</h2>
      <p>
        API keys are encrypted at rest. When you run an interview, relevant content
        is sent to the AI provider you configured so it can generate questions and
        feedback. That provider processes the request under its own terms.
      </p>
      <h2 className="pt-4 text-base font-bold text-ink-900">Your choices</h2>
      <p>
        You can remove your provider key from settings at any time. To request
        access, correction, or deletion of your account data, contact us through
        GitHub Issues. We do not sell personal data.
      </p>
      <p className="text-xs text-[#8b98aa]">
        This policy is a working draft and may be updated as the product evolves.
      </p>
    </InfoPage>
  );
}
