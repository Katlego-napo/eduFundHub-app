import { createClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogBrowser from "@/components/BlogBrowser";
import type { BlogPost } from "@/lib/types/blog";

import { redirect } from "next/navigation";

export default async function BlogPage() {
  redirect("/");
}

// export const metadata = {
//   title: "Blog | EduFund Hub",
//   description:
//     "Study tips, NSFAS information, career guidance, and student success stories for South African students.",
// };

// export default async function BlogPage() {
//   const supabase = await createClient();
//   const { isAdmin } = await getCurrentUserWithRole();
//   const { data, error } = await supabase
//     .from("blog_posts")
//     .select("*")
//     .order("created_at", { ascending: false });

//   const posts: BlogPost[] = error ? [] : (data ?? []);

//   return (
//     <>
//       <Header />
//       <main className="flex-1 bg-background">
//         <section className="border-b border-border bg-primary py-12">
//           <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
//             <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
//               Educational Blog
//             </h1>
//             <p className="mt-2 text-white/75">
//               Study tips, NSFAS guidance, career advice, and student success stories.
//             </p>
//           </div>
//         </section>

//         <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
//           {error ? (
//             <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
//               Couldn&apos;t load articles right now. Please refresh the page.
//             </p>
//           ) : (
//             <BlogBrowser posts={posts} isAdmin={isAdmin} />
//           )}
//         </section>
//       </main>
//       <Footer />
//     </>
//   );
// }