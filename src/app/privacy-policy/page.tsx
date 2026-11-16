import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy | EduFund Hub",
  description:
    "How EduFund Hub collects, uses, and protects your personal information.",
};

const LAST_UPDATED = "30 July 2026";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <section className="border-b border-border bg-primary py-12">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-2 text-white/75">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="prose prose-neutral max-w-none text-foreground">
            <p className="leading-relaxed text-foreground/90">
              EduFund Hub (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your
              privacy. This Privacy Policy explains what personal information we
              collect, how we use it, and the rights you have under South Africa&apos;s
              Protection of Personal Information Act (POPIA). By using the Platform,
              you consent to the practices described here.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              1. Information we collect
            </h2>
            <p className="leading-relaxed text-foreground/90">
              We collect the following categories of information:
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-foreground/90">
              <li>
                <strong>Account information:</strong> your name, email address, and
                password (stored securely and encrypted) when you register for an
                account.
              </li>
              <li>
                <strong>Content you provide:</strong> documents you upload to the AI
                Study Assistant, questions you ask it, comments you post, and
                bursaries or quizzes you choose to save.
              </li>
              <li>
                <strong>Usage and progress information:</strong> quiz attempts and
                scores (including per-subject and per-topic breakdown), AI feature
                usage (to enforce daily limits), and general interaction with the
                Platform.
              </li>
              <li>
                <strong>Payment information:</strong> if you subscribe to a paid
                plan, our payment gateway (PayFast) processes your card or banking
                details directly. We do not store your full card number or banking
                credentials — we only receive confirmation of payment and a
                subscription reference token from PayFast.
              </li>
              <li>
                <strong>Technical information:</strong> basic device and browser
                information, and a locally stored theme preference (light/dark mode)
                saved in your browser.
              </li>
            </ul>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              2. How we use your information
            </h2>
            <p className="leading-relaxed text-foreground/90">
              We use your information to:
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-foreground/90">
              <li>
                Create and manage your account, and authenticate your logins.
              </li>
              <li>
                Provide the features you use — saving bursaries and quizzes,
                tracking quiz progress and subject/topic strengths, computing your
                ranking among students, generating AI responses from your uploaded
                documents, and displaying your comments.
              </li>
              <li>
                Process and manage subscription payments and renewals via PayFast.
              </li>
              <li>Enforce fair usage limits on AI features.</li>
              <li>
                Maintain the security of the Platform, including detecting and
                preventing abuse.
              </li>
              <li>
                Send you important account or subscription communications (e.g.
                payment confirmations, price change notices) where necessary.
              </li>
            </ul>
            <p className="leading-relaxed text-foreground/90">
              We do not sell your personal information to third parties.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              3. Third-party service providers
            </h2>
            <p className="leading-relaxed text-foreground/90">
              We rely on trusted third-party providers to operate the Platform, who
              process personal information on our behalf:
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-foreground/90">
              <li>
                <strong>Supabase</strong> — hosts our database, authentication, and
                file storage (including uploaded documents).
              </li>
              <li>
                <strong>Google (Gemini API)</strong> — processes the content of
                documents you submit to the AI Study Assistant in order to generate
                answers and practice content. Uploaded content is sent to Google&apos;s
                API for this purpose and may involve processing on servers outside
                South Africa.
              </li>
              <li>
                <strong>PayFast</strong> — processes subscription payments for our
                Monthly Plan and Exam Season Package. PayFast handles your
                card/banking details directly under its own privacy and security
                practices. We recommend reviewing PayFast&apos;s own privacy policy for
                details on how they handle payment data.
              </li>
              <li>
                <strong>Google Analytics</strong> — used, with your consent, to
                understand how visitors use the Platform. See Section 4 (Cookies)
                for details.
              </li>
              <li>
                <strong>Google AdSense</strong> — used, with your consent, to
                display advertising on the Platform. See Section 4 (Cookies) for
                details.
              </li>
            </ul>
            <p className="leading-relaxed text-foreground/90">
              Where personal information is transferred outside South Africa (for
              example, to process an AI request via Google), we take reasonable steps
              to ensure it is handled in a manner consistent with POPIA.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              4. Cookies and similar technologies
            </h2>
            <p className="leading-relaxed text-foreground/90">
              We use minimal local browser storage to remember your theme preference
              (light or dark mode) — this is always active and does not require
              consent, as it is strictly necessary for the site to work the way
              you&apos;ve set it up.
            </p>
            <p className="mt-3 leading-relaxed text-foreground/90">
              With your consent, given through the cookie banner shown when you first
              visit, we also use:
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-foreground/90">
              <li>
                <strong>Analytics cookies (Google Analytics):</strong> help us
                understand how visitors use the Platform — which pages are popular,
                how people navigate, and where they run into problems — so we can
                improve it. This data is processed by Google and may involve servers
                outside South Africa.
              </li>
              <li>
                <strong>Advertising cookies (Google AdSense):</strong> used to
                display ads on the Platform and, where consented to, to personalize
                which ads you see based on your browsing activity. Google
                independently applies additional protections for visitors it
                identifies as under 18 via their own Google Account, including
                disabling ad personalization for those users regardless of the
                consent choice made on our site.
              </li>
            </ul>
            <p className="mt-3 leading-relaxed text-foreground/90">
              You can accept or reject analytics and advertising cookies separately,
              and change your choice at any time via the &quot;Cookie Preferences&quot;
              option on the site. Your consent choice is stored for 12 months, after
              which we will ask again.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              5. Data retention
            </h2>
            <p className="leading-relaxed text-foreground/90">
              We retain your personal information for as long as your account remains
              active, or as needed to provide the Platform&apos;s features. Quiz attempt
              history and progress data are retained to power your dashboard stats and
              ranking while your account is active. If you delete your account, we
              will delete or anonymise your personal information within a reasonable
              period, except where we are required to retain certain records by law
              (for example, financial transaction records related to subscription
              payments).
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              6. Your rights under POPIA
            </h2>
            <p className="leading-relaxed text-foreground/90">
              You have the right to:
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-foreground/90">
              <li>
                Request access to the personal information we hold about you.
              </li>
              <li>
                Request correction of inaccurate or outdated information.
              </li>
              <li>
                Request deletion of your personal information, subject to any legal
                retention requirements.
              </li>
              <li>
                Object to the processing of your personal information in certain
                circumstances.
              </li>
              <li>
                Lodge a complaint with the Information Regulator of South Africa if
                you believe your information has been mishandled.
              </li>
            </ul>
            <p className="leading-relaxed text-foreground/90">
              To exercise any of these rights, please contact us via our{" "}
              <a href="/contact" className="font-medium text-primary hover:underline">
                Contact page
              </a>
              .
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              7. Security
            </h2>
            <p className="leading-relaxed text-foreground/90">
              We take reasonable technical and organisational measures to protect your
              personal information against loss, unauthorised access, or disclosure,
              including encrypted password storage and access controls on our
              database. However, no method of transmission or storage is completely
              secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              8. Children&apos;s privacy
            </h2>
            <p className="leading-relaxed text-foreground/90">
              The Platform is intended for use by students, including those under 18,
              under the guidance of a parent or guardian where required. We do not
              knowingly collect more personal information from a minor than is
              necessary to provide the Platform&apos;s services. If you are a parent or
              guardian and believe your child has provided us with personal
              information beyond what is necessary, please contact us so we can
              address it.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              9. Changes to this policy
            </h2>
            <p className="leading-relaxed text-foreground/90">
              We may update this Privacy Policy from time to time to reflect changes
              in our practices or legal requirements. We will update the &quot;Last
              updated&quot; date above when we do. We encourage you to review this page
              periodically.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              10. Contact us
            </h2>
            <p className="leading-relaxed text-foreground/90">
              If you have any questions about this Privacy Policy or how we handle
              your personal information, please reach out via our{" "}
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