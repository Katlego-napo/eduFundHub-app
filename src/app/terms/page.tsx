import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms and Conditions | EduFund Hub",
  description:
    "Terms and conditions for using EduFund Hub — quizzes, bursaries, and AI study assistant.",
};

const LAST_UPDATED = "30 July 2026";

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <section className="border-b border-border bg-primary py-12">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Terms and Conditions
            </h1>
            <p className="mt-2 text-white/75">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="prose prose-neutral max-w-none text-foreground">
            <p className="leading-relaxed text-foreground/90">
              These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of
              EduFund Hub (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, or the &quot;Platform&quot;), including our
              website, bursary listings, practice quizzes, AI Study Assistant, and any
              paid subscription features. By creating an account or using the Platform,
              you agree to these Terms. If you do not agree, please do not use the
              Platform.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              1. Who can use EduFund Hub
            </h2>
            <p className="leading-relaxed text-foreground/90">
              The Platform is intended for students, parents, educators, and other
              individuals seeking academic and funding resources in South Africa. If
              you are under the age of 18, you confirm that you have your parent or
              guardian&apos;s permission to use the Platform and to create an account
              where applicable.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              2. Accounts
            </h2>
            <p className="leading-relaxed text-foreground/90">
              Some features (such as saving bursaries, using the AI Study Assistant,
              or taking practice quizzes) require you to create an account. You are
              responsible for maintaining the confidentiality of your login details
              and for all activity that occurs under your account. You agree to
              provide accurate information when creating an account and to keep it up
              to date.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              3. Free features
            </h2>
            <p className="leading-relaxed text-foreground/90">
              Certain features of the Platform are available free of charge, including
              browsing bursary listings and trying one practice quiz without an
              account. We reserve the right to adjust which features are available for
              free at any time, with reasonable notice where practicable.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              4. Subscriptions and payments
            </h2>
            <p className="leading-relaxed text-foreground/90">
              Access to the full practice quiz library and the AI Study Assistant
              requires a paid subscription. We currently offer two subscription plans:
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-foreground/90">
              <li>
                <strong>Monthly Plan:</strong> billed on a recurring monthly basis.
                Access renews automatically each month until cancelled.
              </li>
              <li>
                <strong>Exam Season Package:</strong> a time-limited plan available
                annually from approximately September to November, aligned with the
                South African matric and final examination period. Availability and
                duration of this package may vary each year and will be communicated
                on the Platform before the package opens.
              </li>
            </ul>
            <p className="leading-relaxed text-foreground/90">
              All prices are displayed in South African Rand (ZAR) and are inclusive
              of any applicable taxes unless stated otherwise. Payments are processed
              by PayFast, our third-party payment gateway. We do not store your card
              or banking details — these are handled directly by PayFast under their
              own security and privacy practices.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              5. Cancellation
            </h2>
            <p className="leading-relaxed text-foreground/90">
              You may cancel your subscription at any time. Upon cancellation, your
              access to paid features will continue until the end of your current
              billing period, after which it will not renew and access will end. No
              partial refunds are issued for unused time within a billing period.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              6. Refund policy
            </h2>
            <p className="leading-relaxed text-foreground/90">
              All subscription payments are final and non-refundable once processed,
              except where required by applicable South African consumer protection
              law. If you believe you have been charged in error, please contact us
              promptly via our{" "}
              <a href="/contact" className="font-medium text-primary hover:underline">
                Contact page
              </a>{" "}
              and we will investigate.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              7. Price changes
            </h2>
            <p className="leading-relaxed text-foreground/90">
              We reserve the right to change subscription prices. We will give you at
              least <strong>14 days&apos; written notice</strong> before any price change
              takes effect, by email to the address on your account or by a prominent
              notice on the Platform. If you do not cancel before the new price takes
              effect, your continued use of the subscription constitutes acceptance of
              the new price.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              8. Failed payments
            </h2>
            <p className="leading-relaxed text-foreground/90">
              If a recurring payment fails, PayFast will attempt to retry the
              payment. If payment cannot be collected, your subscription may be
              paused or cancelled and access to paid features will be suspended until
              the payment issue is resolved.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              9. Bursary listings
            </h2>
            <p className="leading-relaxed text-foreground/90">
              Bursary information is aggregated from publicly available sources and is
              provided for convenience only. We are not affiliated with, and do not
              represent, the funders or institutions listed unless explicitly stated.
              Closing dates, eligibility criteria, and coverage details can change
              without notice — always confirm details directly with the official source
              before applying. We are not responsible for the outcome of any bursary
              application.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              10. Practice quizzes
            </h2>
            <p className="leading-relaxed text-foreground/90">
              Practice quizzes are provided for educational purposes only. While we
              take care to ensure accuracy, quiz content may not always reflect the
              most current curriculum or examination format. Always verify important
              information against your official study materials and consult your
              teacher or tutor where needed.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              11. AI Study Assistant
            </h2>
            <p className="leading-relaxed text-foreground/90">
              The AI Study Assistant uses artificial intelligence to answer questions
              and generate practice content based on documents you upload.
              AI-generated content may occasionally be inaccurate, incomplete, or out
              of date. This feature is a study aid, not a substitute for your official
              course materials, textbooks, or guidance from a teacher or tutor. You
              are responsible for verifying any information before relying on it for
              exam preparation or academic decisions.
            </p>
            <p className="leading-relaxed text-foreground/90">
              Documents you upload are used solely to generate responses for your own
              use and are subject to any usage limits displayed on the Platform.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              12. User content and comments
            </h2>
            <p className="leading-relaxed text-foreground/90">
              If you post comments or other content on the Platform, you agree not to
              post anything unlawful, abusive, harassing, defamatory, or infringing
              on another person&apos;s rights. We reserve the right to remove any content
              that violates these Terms, at our discretion and without prior notice.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              13. Intellectual property
            </h2>
            <p className="leading-relaxed text-foreground/90">
              The EduFund Hub name, logo, website design, and original content are
              our property or used with permission and may not be copied,
              redistributed, or used commercially without our consent.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              14. Prohibited use
            </h2>
            <p className="leading-relaxed text-foreground/90">
              You agree not to misuse the Platform, including but not limited to:
              attempting to access other users&apos; accounts or data, uploading malicious
              content, scraping or bulk-downloading content without permission, or
              attempting to circumvent usage limits or subscription paywalls.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              15. Disclaimer and limitation of liability
            </h2>
            <p className="leading-relaxed text-foreground/90">
              The Platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. To
              the fullest extent permitted by law, we make no warranties, express or
              implied, regarding the accuracy, reliability, or availability of the
              Platform, and we will not be liable for any indirect, incidental, or
              consequential damages arising from your use of the Platform, including
              but not limited to exam outcomes, missed bursary deadlines, or reliance
              on AI-generated content.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              16. Changes to these Terms
            </h2>
            <p className="leading-relaxed text-foreground/90">
              We may update these Terms from time to time to reflect changes to the
              Platform or legal requirements. We will update the &quot;Last updated&quot; date
              above when we do. Continued use of the Platform after changes take
              effect constitutes acceptance of the revised Terms.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              17. Governing law
            </h2>
            <p className="leading-relaxed text-foreground/90">
              These Terms are governed by the laws of the Republic of South Africa,
              and any disputes will be subject to the jurisdiction of the South
              African courts.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              18. Contact us
            </h2>
            <p className="leading-relaxed text-foreground/90">
              If you have any questions about these Terms, please reach out via our{" "}
              <a href="/contact" className="font-medium text-primary hover:underline">
                Contact page
              </a>
              .
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}