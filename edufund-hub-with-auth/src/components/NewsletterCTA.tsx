export default function NewsletterCTA() {
  return (
    <section className="bg-primary py-14">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
          Never miss a closing date
        </h2>
        <p className="mt-2 text-white/75">
          Get new bursaries and past papers delivered to your inbox, weekly.
        </p>
        <form className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            placeholder="your.email@example.com"
            className="flex-1 rounded-full bg-white px-5 py-3 text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-[#3A2E0A] transition-colors hover:bg-accent/90">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
