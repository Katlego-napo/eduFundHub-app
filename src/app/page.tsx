import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import FeaturedBursaries from "@/components/FeaturedBursaries";
// import LatestPapers from "@/components/LatestPapers";
// import BlogPreview from "@/components/BlogPreview";
import NewsletterCTA from "@/components/NewsletterCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Stats />
        <FeaturedBursaries />
        {/* <LatestPapers /> */}
        {/* <BlogPreview /> */}
        <NewsletterCTA />
      </main>
      <Footer />
    </>
  );
}
