import type { Metadata } from "next";
import InfoPage from "@/components/landing/InfoPage";

export const metadata: Metadata = {
  title: "Pricing | Crack Karo",
  description: "Start practising free with your own AI provider key.",
};

export default function PricingPage() {
  return (
    <InfoPage
      eyebrow="Product"
      title="Start free. Stay in control."
      description="Crack Karo does not charge a subscription today. Create a workspace, connect your own AI provider key, and start practising."
    >
      <p>
        You only pay your AI provider for the model usage you generate. Crack Karo
        does not add a platform fee or resell API usage.
      </p>
      <h2 className="pt-4 text-base font-bold text-ink-900">What you need</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>A free Crack Karo account</li>
        <li>A Google Gemini or OpenAI API key</li>
        <li>A quiet space to practise out loud</li>
      </ul>
      <p>
        No credit card is required to create an account. Your provider may require
        billing details before it will process API requests.
      </p>
    </InfoPage>
  );
}
