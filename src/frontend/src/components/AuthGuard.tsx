import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";
import { useInitialize, useSaveUserProfile } from "../hooks/useQueries";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const initialize = useInitialize();
  const saveProfile = useSaveUserProfile();
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [name, setName] = useState("");
  const initCalled = useRef(false);

  useEffect(() => {
    if (!isInitializing && !identity) {
      void navigate({ to: "/login" });
    }
  }, [identity, isInitializing, navigate]);

  const initializeMutate = initialize.mutate;

  // Initialize + check profile on first login
  useEffect(() => {
    if (!identity || profileLoading || initCalled.current) return;
    initCalled.current = true;

    initializeMutate(undefined, {
      onSettled: () => {
        // After init, if no profile name, show prompt
        if (!userProfile?.name) {
          setShowNamePrompt(true);
        }
      },
    });
  }, [identity, profileLoading, userProfile, initializeMutate]);

  useEffect(() => {
    if (!profileLoading && userProfile && !userProfile.name) {
      setShowNamePrompt(true);
    }
  }, [userProfile, profileLoading]);

  const handleSaveName = () => {
    if (!name.trim()) return;
    saveProfile.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          setShowNamePrompt(false);
          toast.success("Welcome to HomeBase!");
        },
        onError: () => toast.error("Failed to save profile"),
      },
    );
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!identity) return null;

  return (
    <>
      {children}
      <AnimatePresence>
        {showNamePrompt && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass rounded-2xl p-8 w-full max-w-md mx-4 shadow-card-raised"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-display font-bold text-gradient-cyan mb-2">
                  Welcome to HomeBase
                </h2>
                <p className="text-muted-foreground text-sm">
                  Set your display name to get started with your household
                  expense tracker.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-foreground/80 text-sm">
                    Your Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="mt-1 bg-input border-border focus:ring-primary"
                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                    autoFocus
                  />
                </div>
                <Button
                  onClick={handleSaveName}
                  disabled={!name.trim() || saveProfile.isPending}
                  className="w-full bg-primary text-primary-foreground hover:shadow-glow-cyan transition-all"
                >
                  {saveProfile.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Get Started
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
