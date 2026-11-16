"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.94.55 3.75 1.5 5.3L2 22l4.93-1.59a9.82 9.82 0 0 0 5.11 1.4h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.78 14.05c-.24.69-1.42 1.32-1.95 1.4-.5.08-1.13.11-1.83-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.93-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.26-.29.58-.36.77-.36h.55c.18 0 .42-.02.65.5.24.55.81 1.97.88 2.11.07.14.12.31.02.5-.1.18-.16.3-.31.46-.15.16-.31.36-.45.48-.15.13-.3.27-.13.55.18.28.79 1.31 1.7 2.12 1.17 1.04 2.16 1.37 2.46 1.52.3.16.48.13.66-.06.18-.19.77-.9.97-1.21.2-.31.41-.26.68-.16.27.1 1.69.8 1.98.94.3.14.49.21.56.33.07.12.07.69-.17 1.38Z" />
    </svg>
  );
}

export default function BlogShareButtons({
  title,
  url,
}: {
  title: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // share sheet dismissed, fall through to copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;

  return (
    <div className="flex items-center gap-2">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-[#25D366] transition-colors hover:border-[#25D366]"
      >
        <WhatsAppIcon className="h-4 w-4" />
      </a>
      <button
        onClick={handleShare}
        aria-label="Share"
        className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-primary"
      >
        {copied ? <Check size={14} /> : <Share2 size={14} />}
        {copied ? "Copied" : "Share"}
      </button>
    </div>
  );
}
