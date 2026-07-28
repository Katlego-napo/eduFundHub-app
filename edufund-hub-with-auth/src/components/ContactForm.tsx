"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-secondary";
  const labelClass = "text-sm font-medium text-foreground";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const subject = encodeURIComponent(`Message from ${name || "EduFund Hub visitor"}`);
    const body = encodeURIComponent(
      `${message}\n\n—\nFrom: ${name || "N/A"}\nEmail: ${email || "N/A"}`
    );

    window.location.href = `mailto:support@edufundhub.co.za?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Your Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Thandiwe Nkosi"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Your Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Message</label>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
      >
        Send Message
      </button>
    </form>
  );
}