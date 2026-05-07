import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Search,
  Bell,
  EyeOff,
  Sparkles,
  PlayCircle,
  Shield,
  Crown,
  ArrowRight,
} from "lucide-react";

const sections = [
  {
    icon: Search,
    title: "1. Etsi kanavia",
    body: "Mene Channels-sivulle ja hae YouTube-kanavia nimellä. Klikkaa Subscribe lisätäksesi kanavan tilauksiisi.",
  },
  {
    icon: Bell,
    title: "2. Seuraa feediäsi",
    body: "Etusivu (Home) näyttää uusimmat videot kaikilta tilaamiltasi kanavilta — ei algoritmia, ei suosituksia.",
  },
  {
    icon: PlayCircle,
    title: "3. Katso häiriöttä",
    body: "Klikkaa videota avataksesi sen sisäänrakennetussa soittimessa. Ei sivupaneelia, ei autoplaytä.",
  },
  {
    icon: EyeOff,
    title: "4. Piilota ei-kiinnostavat",
    body: "Jokaisessa videokortissa on piilotuspainike. Header-valikon Hidden-kytkimellä voit selata piilotettuja videoita.",
  },
  {
    icon: Sparkles,
    title: "5. Kampanjakanavat",
    body: "Aika ajoin tarjolla on ilmaisia kampanjakanavia. Ne näkyvät bannerina ja niillä on oma voimassaoloaika.",
  },
  {
    icon: Crown,
    title: "Free vs. Plus",
    body: "Free-tason käyttäjä voi tilata yhden kanavan (kampanjakanavat eivät kuluta kiintiötä). Plus-taso avaa rajattomat tilaukset.",
  },
  {
    icon: Shield,
    title: "Tietosi",
    body: "Tilaukset ja piilotukset ovat henkilökohtaisia ja näkyvät vain sinulle. Voit poistua koska tahansa Account-sivulta.",
  },
];

export default function GuidePage() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "User guide · Tuubmix";
  }, []);

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    user ? (
      <div className="min-h-screen bg-background">
        <Header />
        {children}
      </div>
    ) : (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <div className="container flex h-16 items-center justify-between">
            <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
              Tuubmix<span className="text-primary">.</span>
            </Link>
            <Button asChild size="sm">
              <Link to="/auth">
                Sign in <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </header>
        {children}
      </div>
    );

  return (
    <Wrapper>
      <main className="container py-12 max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" /> User guide
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4">
          Hiljaisempi tapa katsoa YouTubea.
        </h1>
        <p className="text-muted-foreground text-lg mb-12 max-w-2xl">
          Tuubmix näyttää vain ne kanavat jotka itse valitset — ei algoritmia,
          ei suosituksia, ei loputonta selausta. Näin pääset alkuun.
        </p>

        <div className="space-y-6">
          {sections.map(({ icon: Icon, title, body }) => (
            <section
              key={title}
              className="flex gap-5 p-6 rounded-2xl border border-border bg-card"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-xl mb-1">{title}</h2>
                <p className="text-muted-foreground leading-relaxed">{body}</p>
              </div>
            </section>
          ))}
        </div>

        {!user && (
          <div className="mt-12 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-8 text-center">
            <h3 className="font-display text-2xl mb-2">Valmis kokeilemaan?</h3>
            <p className="text-muted-foreground mb-5">
              Luo tili sekunneissa ja rakenna oma rauhallinen feedisi.
            </p>
            <Button asChild size="lg">
              <Link to="/auth">Aloita ilmaiseksi</Link>
            </Button>
          </div>
        )}
      </main>
    </Wrapper>
  );
}