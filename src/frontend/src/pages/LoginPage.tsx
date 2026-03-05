import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import {
  FileText,
  Home,
  Loader2,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const features = [
  {
    icon: TrendingUp,
    label: "Smart Analytics",
    desc: "Real-time spending insights and trends",
  },
  {
    icon: Shield,
    label: "Budget Alerts",
    desc: "Stay notified before you overspend",
  },
  {
    icon: Users,
    label: "Family Sharing",
    desc: "All family members, one shared view",
  },
  {
    icon: FileText,
    label: "PDF Reports",
    desc: "Export monthly expense summaries",
  },
];

export default function LoginPage() {
  const { login, identity, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (identity) {
      void navigate({ to: "/" });
    }
  }, [identity, navigate]);

  return (
    <div className="min-h-screen bg-background bg-grid relative flex items-center justify-center px-4 overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-20%] left-[-15%] w-[60vw] h-[60vw] rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, oklch(0.72 0.22 195) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute bottom-[-20%] right-[-15%] w-[55vw] h-[55vw] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, oklch(0.62 0.20 290) 0%, transparent 65%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Branding */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center lg:text-left"
        >
          <div className="flex items-center gap-3 justify-center lg:justify-start mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/50 flex items-center justify-center glow-cyan">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <span className="font-display font-bold text-3xl text-gradient-cyan tracking-tight">
              HomeBase
            </span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground leading-tight mb-4">
            Your Family&apos;s
            <br />
            <span className="text-gradient-violet">Expense Command</span>
            <br />
            Center
          </h1>

          <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto lg:mx-0">
            Track household expenses, monitor budgets, and gain smart insights —
            all in one futuristic dashboard.
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto lg:mx-0">
            {features.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="glass rounded-xl p-3 text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-semibold text-foreground">
                    {label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right: Login card */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="flex justify-center"
        >
          <div className="glass rounded-2xl p-8 w-full max-w-sm shadow-card-raised border-neon-cyan">
            {/* Scan line decoration */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <span className="font-mono text-xs text-primary/70 uppercase tracking-widest">
                  Secure Access
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Sign In
              </h2>
              <p className="text-sm text-muted-foreground">
                Use your Internet Identity to securely access your household
                data.
              </p>
            </div>

            <Button
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              className="w-full h-12 text-base font-semibold bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 hover:border-primary hover:shadow-glow-cyan transition-all duration-300"
            >
              {isLoggingIn || isInitializing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 mr-2" />
                  Sign in with Internet Identity
                </>
              )}
            </Button>

            <div className="mt-6 pt-5 border-t border-border/40 text-center">
              <p className="text-xs text-muted-foreground">
                All data stored securely on the Internet Computer blockchain.
                <br />
                No passwords. No data leaks.
              </p>
            </div>

            {/* Animated border accent */}
            <div className="mt-6 h-0.5 w-full rounded-full overflow-hidden">
              <div
                className="h-full animate-shimmer"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, oklch(0.72 0.22 195), oklch(0.62 0.20 290), transparent)",
                  backgroundSize: "200% 100%",
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
