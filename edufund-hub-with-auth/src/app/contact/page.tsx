import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { Mail, Phone } from "lucide-react";

export const metadata = {
  title: "Contact Us | EduFund Hub",
  description:
    "Get in touch with the EduFund Hub team : questions, feedback, or partnership enquiries.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <section className="border-b border-border bg-primary py-12">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Contact Us
            </h1>
            <p className="mt-2 text-white/75">
              Questions, feedback, or partnership ideas we&apos;d love to hear from you.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Send a message
              </h2>
              <p className="mt-1 text-sm text-muted">
                This opens your email app with the message pre-filled just hit send.
              </p>
              <div className="mt-5">
                <ContactForm />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Reach us directly
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-foreground">
                <li className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Mail size={16} />
                  </span>
                  <a href="mailto:admin@edufundhub.co.za" className="hover:text-primary">
                    admin@edufundhub.co.za
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  {/* <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Phone size={16} />
                  </span> */}
                  {/* <a href="tel:+27210000000" className="hover:text-primary">
                    +27 21 000 0000
                  </a> */}
                </li>
              </ul>
              <p className="mt-5 text-sm text-muted">
                We typically respond within 1–5 business days.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}