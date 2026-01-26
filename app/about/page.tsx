import AboutHero from "@/components/AboutHero";
import FilmStatement from "@/components/FilmStatement";
import ProfileGrid from "@/components/ProfileGrid";
import Footer from "@/components/Footer";

export const metadata = {
  title: "ABOUT CRAK HACK",
  description: "Classified production data for the film CRAK HACK"
};

export default function AboutPage() {
  return (
    <main className="ambient-still text-ice">
      <AboutHero />
      <FilmStatement />
      <ProfileGrid />
      <Footer />
    </main>
  );
}
