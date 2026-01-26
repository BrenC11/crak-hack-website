import Hero from "@/components/Hero";
import Description from "@/components/Description";
import TrailerPlaceholder from "@/components/TrailerPlaceholder";
import SocialLink from "@/components/SocialLink";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="ambient-still text-ice">
      <Hero />
      <Description />
      <TrailerPlaceholder />
      <SocialLink />
      <Footer />
    </main>
  );
}
