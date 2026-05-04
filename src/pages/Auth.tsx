import { useEffect, useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Bell, PlayCircle } from "lucide-react";

export default function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Sign in · Tuubmix";
  }, []);

  if (!loading && user) return <Navigate to="/" replace />;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate("/");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName || email.split("@")[0] },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Check your inbox to confirm your email");
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 15% 10%, hsl(var(--primary) / 0.18), transparent 60%), radial-gradient(50% 40% at 85% 90%, hsl(var(--primary) / 0.10), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        {/* Left — editorial panel */}
        <aside className="hidden lg:flex flex-col justify-between p-12 xl:p-16 border-r border-border/60">
          <Link to="/" className="font-display text-3xl font-semibold tracking-tight">
            Tuubmix<span className="text-primary">.</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-lg"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-6">
              A calmer YouTube
            </p>
            <h2 className="font-display text-5xl xl:text-6xl leading-[1.05] tracking-tight">
              Only the channels <em className="text-primary not-italic">you chose</em>.
              <br />Nothing else.
            </h2>
            <p className="mt-6 text-base text-muted-foreground leading-relaxed">
              No infinite feed. No recommendations. No outrage bait.
              Just a quiet reading room for the creators you actually subscribed to.
            </p>

            <ul className="mt-10 space-y-4">
              {[
                { icon: PlayCircle, text: "Distraction-free player" },
                { icon: Bell, text: "Newest uploads, in order" },
                { icon: Sparkles, text: "No algorithm. Ever." },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-foreground/80">{text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Tuubmix · Made for slow viewing
          </p>
        </aside>

        {/* Right — auth card */}
        <main className="flex items-center justify-center px-4 py-10 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <Link
              to="/"
              className="lg:hidden font-display text-2xl font-semibold tracking-tight inline-block mb-8"
            >
              Tuubmix<span className="text-primary">.</span>
            </Link>

            <div className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl p-8 sm:p-10 shadow-soft">
              <h1 className="font-display text-3xl tracking-tight">Welcome back</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to your quiet corner of the internet.
              </p>

              <Tabs defaultValue="signin" className="mt-8">
                <TabsList className="grid grid-cols-2 w-full mb-6 bg-muted/60">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="si-email" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                      <Input id="si-email" type="email" placeholder="you@domain.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="si-pw" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                      <Input id="si-pw" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
                    </div>
                    <Button type="submit" className="w-full h-11 mt-2" disabled={busy}>
                      {busy ? "Signing in…" : "Sign in"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="su-name" className="text-xs uppercase tracking-wider text-muted-foreground">Display name</Label>
                      <Input id="su-name" placeholder="Jane Doe" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="su-email" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                      <Input id="su-email" type="email" placeholder="you@domain.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="su-pw" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                      <Input id="su-pw" type="password" placeholder="At least 6 characters" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
                    </div>
                    <Button type="submit" className="w-full h-11 mt-2" disabled={busy}>
                      {busy ? "Creating…" : "Create account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="relative my-7">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-[0.22em]">
                  <span className="bg-card px-3 text-muted-foreground">or continue with</span>
                </div>
              </div>

              <Button variant="outline" className="w-full h-11" onClick={handleGoogle}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.1S8.69 6 12 6c1.88 0 3.14.8 3.86 1.49l2.63-2.54C16.86 3.43 14.66 2.5 12 2.5 6.76 2.5 2.5 6.76 2.5 12S6.76 21.5 12 21.5c6.93 0 9.5-4.86 9.5-7.81 0-.52-.05-.92-.13-1.49H12z"/>
                </svg>
                Continue with Google
              </Button>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                By continuing you agree to our calm-by-default principles.
              </p>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}