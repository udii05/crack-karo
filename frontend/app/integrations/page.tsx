import type { Metadata } from "next";
import InfoPage from "@/components/landing/InfoPage";

export const metadata: Metadata = {
  title: "Integrations | Crack Karo",
  description: "Connect your own Gemini or OpenAI API key to power Crack Karo.",
};

export default function IntegrationsPage() {
  return (
    <InfoPage
      eyebrow="Product"
      title="Your models. Your keys."
      description="Crack Karo uses a bring-your-own-key model so you stay in control of the AI provider that powers your practice."
    >
      <p>
        Connect a Google Gemini or OpenAI API key from your workspace settings. The
        key is encrypted before it is stored and is only used to make requests on
        your behalf.
      </p>
      <h2 className="pt-4 text-base font-bold text-ink-900">Supported providers</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Google Gemini</li>
        <li>OpenAI</li>
      </ul>
      <p>
        Your provider bills you directly for model usage. Crack Karo does not add a
        markup to those requests, and you can change or remove your key at any time.
      </p>
    </InfoPage>
  );
}
