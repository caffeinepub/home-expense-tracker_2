import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@tanstack/react-router";
import { Home, LogOut, Moon, Sun, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";
import { useTheme } from "../hooks/useTheme";

export default function Layout({ children }: { children: ReactNode }) {
  const { clear } = useInternetIdentity();
  const { data: userProfile } = useUserProfile();
  const { theme, toggleTheme } = useTheme();

  const initials = userProfile?.name
    ? userProfile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "HB";

  return (
    <div className="min-h-screen bg-background bg-grid relative flex flex-col">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-15%] left-[-10%] w-[40vw] h-[40vw] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, oklch(0.72 0.22 195) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[35vw] h-[35vw] rounded-full opacity-8"
          style={{
            background:
              "radial-gradient(circle, oklch(0.62 0.20 290) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center glow-cyan">
              <Home className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display font-bold text-lg text-gradient-cyan tracking-tight hidden sm:block">
              HomeBase
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Neon indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <Zap className="h-3 w-3 text-primary animate-pulse-glow" />
              <span>LIVE</span>
            </div>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-ocid="theme.toggle"
              className="h-9 w-9 rounded-full ring-1 ring-border hover:ring-primary/50 transition-all text-muted-foreground hover:text-foreground"
              aria-label={
                theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 w-9 rounded-full p-0 ring-1 ring-border hover:ring-primary/50 transition-all"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="glass border-border/50 w-48"
              >
                <div className="px-3 py-2 border-b border-border/40">
                  <p className="text-sm font-medium text-foreground truncate">
                    {userProfile?.name ?? "Family Member"}
                  </p>
                  <p className="text-xs text-muted-foreground">HomeBase User</p>
                </div>
                <DropdownMenuItem
                  onClick={clear}
                  className="text-destructive hover:text-destructive cursor-pointer mt-1"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with{" "}
            <span className="text-red-400">♥</span> using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
