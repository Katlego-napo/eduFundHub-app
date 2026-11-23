import Link from "next/link";
import { STUDY_ASSISTANT_ENABLED } from "@/lib/features";
import { Mail } from "lucide-react";

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.83c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04Z" />
    </svg>
  );
}

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="font-display text-base font-semibold text-foreground">
                EduFund Hub
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted">
              Helping South African students access study materials, bursaries,
              and career resources.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://www.facebook.com/share/19zaCkG34X/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-muted hover:text-primary"
              >
                <FacebookIcon style={{ height: 18, width: 18 }} />
              </a>
              <a
                href="https://www.tiktok.com/@edufundhub"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="text-muted hover:text-primary"
              >
                <TikTokIcon style={{ height: 18, width: 18 }} />
              </a>
              <a
                href="https://whatsapp.com/channel/0029Vb8jT050bIdisDDvxL2N"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Channel"
                className="text-muted hover:text-primary"
              >
                <WhatsAppIcon style={{ height: 18, width: 18 }} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-foreground">
              Quick Links
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link href="/quizzes" className="hover:text-primary">Quizzes</Link></li>
              {STUDY_ASSISTANT_ENABLED && (
                <li><Link href="/study-assistant" className="hover:text-primary">AI Study Assistant</Link></li>
              )}
              {/* <li><Link href="/past-papers" className="hover:text-primary">Study Materials</Link></li> */}
              <li><Link href="/bursaries" className="hover:text-primary">Bursaries</Link></li>
              {/* <li><Link href="/blog" className="hover:text-primary">Blog</Link></li>  */}
              <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-foreground">
              Contact
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <Mail size={14} /> admin@edufundhub.co.za
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-foreground">
              Legal
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link href="/privacy-policy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary">Terms and Conditions</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} EduFund Hub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
