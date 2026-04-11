import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Shield, LogIn, UserPlus, Loader2,
  Eye, EyeOff, Clock, Users, TrendingUp,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast }                          = useToast();

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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
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

  const pwMatch = signupConfirm.length > 0 && signupPassword === signupConfirm;
  const pwMismatch = signupConfirm.length > 0 && signupPassword !== signupConfirm;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10 relative overflow-hidden">

      {/* Subtle background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%]  w-[500px] h-[500px] rounded-full bg-primary/5  blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
      </div>

      {/* ── Centred card ──────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[900px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">

        {/* Left — branding panel */}
        <div className="lg:w-[42%] bg-sidebar-background p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Decorative circle */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-sidebar-primary/10 blur-2xl pointer-events-none" />

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-lg shrink-0">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-sidebar-foreground leading-none">AMC</p>
              <p className="text-[11px] text-sidebar-foreground/50 mt-0.5">Accra Medical Centre</p>
            </div>
          </div>

          {/* Centre text */}
          <div className="my-8 space-y-4">
            <h2 className="text-2xl lg:text-3xl font-black text-sidebar-foreground leading-tight">
              Attendance<br />Monitoring<br />System
            </h2>
            <p className="text-sm text-sidebar-foreground/60 leading-relaxed max-w-xs">
              Track staff attendance, manage shift schedules, and generate payroll reports.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { icon: Clock,      label: "Live clock-in tracking",       sub: "Real-time fingerprint data" },
                { icon: TrendingUp, label: "Automated deduction reports",  sub: "Monthly GH₵ calculations" },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0">
                    <f.icon className="h-3.5 w-3.5 text-sidebar-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-sidebar-foreground leading-none">{f.label}</p>
                    <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-[10px] text-sidebar-foreground/30">
            © {new Date().getFullYear()} Accra Medical Centre
          </p>
        </div>

        {/* Right — form panel */}
        <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto space-y-6">

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground mt-1">Sign in to your account to continue</p>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-5">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* ── Sign In ───────────────────────────────────────────── */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">Email address</Label>
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
                    <Label htmlFor="login-password">Password</Label>
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showLoginPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-xs text-destructive font-medium">{loginError}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full gap-2" disabled={submitting}>
                    {submitting
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                      : <><LogIn className="h-4 w-4" /> Sign In</>}
                  </Button>
                </form>
              </TabsContent>

              {/* ── Sign Up ───────────────────────────────────────────── */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-primary font-medium leading-relaxed">
                      New accounts require role assignment by an administrator before access is granted.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email">Email address</Label>
                    <Input
                      id="signup-email" type="email"
                      placeholder="you@accramedical.com"
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      required autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password">
                      Password <span className="text-muted-foreground font-normal text-xs">(min. 6 chars)</span>
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showSignupPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-confirm">Confirm password</Label>
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {pwMismatch && <p className="text-[11px] text-destructive">Passwords do not match</p>}
                    {pwMatch    && <p className="text-[11px] text-success">Passwords match ✓</p>}
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={submitting || pwMismatch}>
                    {submitting
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
                      : <><UserPlus className="h-4 w-4" /> Create Account</>}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <Separator />
          </div>
        </div>
      </div>
    </div>
  );
}