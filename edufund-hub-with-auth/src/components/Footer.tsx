import Link from "next/link";
import { GraduationCap, Mail, Phone } from "lucide-react";

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.83c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.9 3h3.1l-6.77 7.73L23.3 21h-6.7l-5.24-6.85L5.2 21H2.1l7.24-8.27L1.7 3h6.86l4.74 6.27L18.9 3Zm-2.18 16.17h1.72L7.36 4.74H5.5l11.22 14.43Z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
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
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <GraduationCap size={16} />
              </span>
              <span className="font-display text-base font-semibold text-foreground">
                EduFund Hub
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted">
              Helping South African students access study materials, bursaries,
              and career resources.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="#" aria-label="Facebook" className="text-muted hover:text-primary">
                <FacebookIcon className="h-[18px] w-[18px]" />
              </a>
              <a href="#" aria-label="Twitter" className="text-muted hover:text-primary">
                <TwitterIcon className="h-[18px] w-[18px]" />
              </a>
              <a href="#" aria-label="Instagram" className="text-muted hover:text-primary">
                <InstagramIcon className="h-[18px] w-[18px]" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-foreground">
              Quick Links
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link href="/quizzes" className="hover:text-primary">Quizzes</Link></li>
              <li><Link href="/study-assistant" className="hover:text-primary">AI Study Assistant</Link></li>
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
              {/* <li className="flex items-center gap-2">
                <Phone size={14} /> +27 21 000 0000
              </li> */}
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
