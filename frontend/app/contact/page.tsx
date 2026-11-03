import type { Metadata } from "next";
import InfoPage from "@/components/landing/InfoPage";

export const metadata: Metadata = {
  title: "Contact | Crack Karo",
  description: "Get in touch with the Crack Karo team.",
};

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Company"
      title="Let's talk."
      description="Questions, product feedback, bug reports, or a partnership idea? We would love to hear from you."
    >
      <p>
        The fastest way to reach us right now is through GitHub Issues. It keeps the
        conversation visible and helps us track fixes and feature requests properly.
      </p>
      <p>
        <a
          href="https://github.com/udii05/crack-karo/issues"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          Open an issue on GitHub
        </a>
      </p>
      <p>
        For account or data requests, include the email address associated with your
        Crack Karo workspace so we can find your account.
      </p>
    </InfoPage>
  );
}
