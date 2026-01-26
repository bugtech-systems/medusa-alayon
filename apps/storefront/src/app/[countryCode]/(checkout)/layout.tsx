import { ProfileBadge } from '@/components/common/profile-badge';
import Footer from "@/components/common/footer";
import { retrieveUser } from "@/lib/data1";
import { FlyingBox } from "@medusajs/icons";
import type { Metadata } from "next";
import { Link } from "next-view-transitions";
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: "Medusa Eats",
  description: "Order food from your favorite restaurants",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {


// if (!user) notFound();


  return (
    <>
      <header className="sticky top-0 z-40 h-16 bg-ui-fg-base text-ui-fg-on-inverted">
        <nav className="flex h-full items-center justify-between px-4 md:px-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-semibold transition-colors hover:text-ui-bg-base-hover"
          >
            <FlyingBox />
            <span>Alayon Express</span>
          </Link>
        </nav>
      </header>

      <main className="min-h-[calc(100vh-8rem)] p-4 md:p-10 transition-all duration-150 ease-in-out">
        {children}
      </main>
      <Footer />
    </>
  );
}
