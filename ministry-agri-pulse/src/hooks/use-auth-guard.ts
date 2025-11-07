import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient, type AuthSession } from "@/services/auth-client";

export const useAuthGuard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    authClient.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (!session) {
        navigate("/auth", { replace: true });
      } else {
        setSession(session);
      }
      setChecking(false);
    });

    const {
      data: { subscription },
    } = authClient.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;
      if (event === "SIGNED_OUT") {
        setSession(null);
        navigate("/auth", { replace: true });
      } else if (nextSession) {
        setSession(nextSession);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return {
    session,
    checking,
    isAuthenticated: !!session,
  };
};
