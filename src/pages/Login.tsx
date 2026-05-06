import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [loginEmail,     setLoginEmail]     = useState("");
  const [loginPassword,  setLoginPassword]  = useState("");
  const [signupEmail,    setSignupEmail]    = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm,  setSignupConfirm]  = useState("");
  const [submitting,     setSubmitting]     = useState(false);
  const [showLoginPw,    setShowLoginPw]    = useState(false);
  const [showSignupPw,   setShowSignupPw]   = useState(false);
  const [showConfirmPw,  setShowConfirmPw]  = useState(false);
  const [loginError,     setLoginError]     = useState("");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-foreground/40" />
          <p className="text-sm text-foreground/50">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setSubmitting(false);
    if (error) setLoginError(error.message);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== signupConfirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword);
    setSubmitting(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created", description: "Wait for an admin to assign your role before signing in." });
    }
  };

  const pwMatch    = signupConfirm.length > 0 && signupPassword === signupConfirm;
  const pwMismatch = signupConfirm.length > 0 && signupPassword !== signupConfirm;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10 relative">

      {/* Soft AMC accent in the corner — yellow glow only */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-amc-yellow/8 blur-[120px]" />
        <div className="absolute bottom-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-amc-blue/5 blur-[120px]" />
      </div>

      {/* ── Login card ─────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[420px]">

        {/* Brand mark */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="h-11 w-11 rounded-xl bg-amc-yellow/15 ring-1 ring-amc-yellow/30 flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-amc-yellow text-lg leading-none">A</span>
          </div>
          <div className="text-left">
            <p className="font-display font-bold text-[14px] leading-tight tracking-tight">
              Accra Medical Centre
            </p>
            <p className="text-[12px] text-foreground/55 leading-tight">
              Workforce
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-7 shadow-sm">

          <div className="mb-6">
            <h1 className="font-display text-[22px] font-bold tracking-tight">
              Sign in to continue
            </h1>
            <p className="text-[13px] text-foreground/55 mt-1">
              Use your AMC email and password.
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-5 bg-muted/60">
              <TabsTrigger value="login" className="font-display font-semibold text-[12px]">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="font-display font-semibold text-[12px]">Sign Up</TabsTrigger>
            </TabsList>

            {/* ── Sign In ───────────────────────────────────────────── */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-[12px] text-foreground/70 font-medium">Email</Label>
                  <Input
                    id="login-email" type="email"
                    placeholder="you@accramedical.com"
                    value={loginEmail}
                    onChange={e => { setLoginEmail(e.target.value); setLoginError(""); }}
                    required autoComplete="email" autoFocus
                    className={loginError ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-[12px] text-foreground/70 font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPw ? "text" : "password"}
                      value={loginPassword}
                      onChange={e => { setLoginPassword(e.target.value); setLoginError(""); }}
                      required autoComplete="current-password"
                      className="pr-10"
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowLoginPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors">
                      {showLoginPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="px-3 py-2 rounded-md bg-destructive/8 border border-destructive/20">
                    <p className="text-[12px] text-destructive font-medium">{loginError}</p>
                  </div>
                )}

                <Button type="submit" className="w-full gap-2 h-10 bg-foreground hover:bg-foreground/90 text-background font-display font-semibold" disabled={submitting}>
                  {submitting
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                    : <><LogIn className="h-4 w-4" /> Sign in</>}
                </Button>
              </form>
            </TabsContent>

            {/* ── Sign Up ───────────────────────────────────────────── */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="px-3 py-2.5 rounded-md bg-amc-yellow/8 border border-amc-yellow/25">
                  <p className="text-[12px] text-foreground/75 leading-relaxed">
                    New accounts need an administrator to assign a role before access is granted.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-[12px] text-foreground/70 font-medium">Email</Label>
                  <Input
                    id="signup-email" type="email"
                    placeholder="you@accramedical.com"
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    required autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-[12px] text-foreground/70 font-medium">
                    Password <span className="text-foreground/40 font-normal">(min. 6 chars)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPw ? "text" : "password"}
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                      required minLength={6} className="pr-10"
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowSignupPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors">
                      {showSignupPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-confirm" className="text-[12px] text-foreground/70 font-medium">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm"
                      type={showConfirmPw ? "text" : "password"}
                      value={signupConfirm}
                      onChange={e => setSignupConfirm(e.target.value)}
                      required className={`pr-10 ${pwMismatch ? "border-destructive" : pwMatch ? "border-success" : ""}`}
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowConfirmPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors">
                      {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {pwMismatch && <p className="text-[11px] text-destructive">Passwords do not match</p>}
                  {pwMatch    && <p className="text-[11px] text-success">Passwords match</p>}
                </div>

                <Button type="submit" className="w-full gap-2 h-10 bg-foreground hover:bg-foreground/90 text-background font-display font-semibold" disabled={submitting || pwMismatch}>
                  {submitting
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
                    : <><UserPlus className="h-4 w-4" /> Create account</>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] tracking-[0.16em] uppercase text-foreground/30 mt-8 font-display font-semibold">
          © {new Date().getFullYear()} Accra Medical Centre
        </p>

      </div>
    </div>
  );
}