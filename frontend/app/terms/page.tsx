import type { Metadata } from "next";
import InfoPage from "@/components/landing/InfoPage";

export const metadata: Metadata = {
  title: "Terms | Crack Karo",
  description: "The terms that apply when you use Crack Karo.",
};

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms of use."
      description="These terms apply when you create a Crack Karo account or use the practice workspace."
    >
      <p>
        Use Crack Karo lawfully and only for interview preparation you are entitled
        to undertake. You are responsible for keeping your account secure and for the
        content you submit.
      </p>
      <h2 className="pt-4 text-base font-bold text-ink-900">AI feedback</h2>
      <p>
        Interview questions, scores, and coaching are generated with AI and are
        provided as practice guidance. They are not a guarantee of employment or a
        substitute for professional advice.
      </p>
      <h2 className="pt-4 text-base font-bold text-ink-900">Provider costs</h2>
      <p>
        When you connect your own Gemini or OpenAI key, you are responsible for the
        usage charges on that provider account. Crack Karo does not control provider
        pricing or availability.
      </p>
      <p>
        We may update the service or these terms as the product evolves. Continued
        use after an update means you accept the revised terms.
      </p>
    </InfoPage>
  );
}
