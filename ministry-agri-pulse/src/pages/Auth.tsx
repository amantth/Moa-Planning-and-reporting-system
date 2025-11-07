import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "@/services/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Leaf } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    authClient.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      } else {
        setCheckingSession(false);
      }
    });

    // Set up auth state listener
    const {
      data: { subscription },
    } = authClient.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard");
      } else if (event === "SIGNED_OUT") {
        setCheckingSession(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await authClient.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Successfully logged in!");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Leaf className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Ministry of Agriculture
          </h1>
          <p className="text-muted-foreground mt-2">
            Planning & Performance Measurement System
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in to access the planning system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@agriculture.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={checkingSession}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={checkingSession}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || checkingSession}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Need an account? Contact the Strategic Affairs Office to request
                access.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
