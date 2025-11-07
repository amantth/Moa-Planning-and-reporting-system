import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "@/services/auth-client";
import { Button } from "@/components/ui/button";
import { Leaf, FileText, TrendingUp, Target, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    authClient.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const features = [
    {
      icon: FileText,
      title: "Annual Planning",
      description:
        "Create and manage comprehensive annual plans with detailed indicators",
    },
    {
      icon: TrendingUp,
      title: "Performance Tracking",
      description:
        "Submit and monitor quarterly performance reports against planned targets",
    },
    {
      icon: Target,
      title: "Indicator Management",
      description:
        "Define and track key performance indicators across all offices",
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description: "Secure multi-level approval workflows for all stakeholders",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-6">
            <Leaf className="w-10 h-10 text-primary-foreground" />
          </div>

          <h1 className="text-5xl font-bold text-foreground mb-4">
            Ministry of Agriculture
          </h1>

          <p className="text-2xl text-muted-foreground mb-8">
            Planning & Performance Measurement System
          </p>

          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            A comprehensive platform for strategic planning, performance
            monitoring, and data-driven decision making across all ministerial
            offices.
          </p>

          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card p-6 rounded-lg border border-border hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* System Overview */}
        <div className="mt-20 bg-card rounded-lg border border-border p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            System Capabilities
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">
                For State Ministers & Advisors
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    Submit annual plans with detailed performance indicators
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    Upload quarterly performance data via forms or CSV
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Track submission status and approval workflows</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>View performance analytics and trend reports</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">
                For Strategic Affairs Office
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    Review and approve plans from all state minister offices
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Manage performance indicators across the ministry</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Generate cross-office comparison reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Monitor ministry-wide performance metrics</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-6 py-8 text-center text-muted-foreground">
          <p>© 2025 Ministry of Agriculture. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
