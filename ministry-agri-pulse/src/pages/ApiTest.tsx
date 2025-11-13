import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Server, Database, Network } from "lucide-react";
import { apiClient } from "@/services/api-client";

interface TestResult {
  name: string;
  status: "pending" | "success" | "error" | "testing";
  message: string;
  details?: any;
}

export default function ApiTest() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Backend Connection", status: "pending", message: "Not tested" },
    { name: "API Root", status: "pending", message: "Not tested" },
    { name: "Authentication Endpoint", status: "pending", message: "Not tested" },
    { name: "CORS Configuration", status: "pending", message: "Not tested" },
  ]);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests((prev) =>
      prev.map((test, i) => (i === index ? { ...test, ...updates } : test))
    );
  };

  const testBackendConnection = async () => {
    updateTest(0, { status: "testing", message: "Testing..." });
    try {
      const response = await fetch("http://localhost:8000/api/", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.ok) {
        updateTest(0, {
          status: "success",
          message: `Connected successfully (${response.status})`,
          details: { status: response.status, statusText: response.statusText },
        });
        return true;
      } else {
        updateTest(0, {
          status: "error",
          message: `Connection failed (${response.status})`,
          details: { status: response.status, statusText: response.statusText },
        });
        return false;
      }
    } catch (error: any) {
      updateTest(0, {
        status: "error",
        message: error.message || "Connection failed",
        details: error,
      });
      return false;
    }
  };

  const testApiRoot = async () => {
    updateTest(1, { status: "testing", message: "Testing..." });
    try {
      const response = await apiClient.get("/");
      updateTest(1, {
        status: "success",
        message: "API root accessible",
        details: response.data,
      });
      return true;
    } catch (error: any) {
      updateTest(1, {
        status: "error",
        message: error.response?.data?.detail || error.message || "Failed to access API root",
        details: error.response?.data,
      });
      return false;
    }
  };

  const testAuthEndpoint = async () => {
    updateTest(2, { status: "testing", message: "Testing..." });
    try {
      // Test with invalid credentials to check if endpoint exists
      const response = await apiClient.post("/auth/login/", {
        username: "test",
        password: "test",
      });
      
      // If we get here, endpoint exists but credentials are wrong (expected)
      updateTest(2, {
        status: "success",
        message: "Authentication endpoint accessible",
        details: response.data,
      });
      return true;
    } catch (error: any) {
      if (error.response?.status === 400) {
        // 400 means endpoint exists but credentials are invalid (expected)
        updateTest(2, {
          status: "success",
          message: "Authentication endpoint accessible (400 expected for test credentials)",
          details: error.response?.data,
        });
        return true;
      } else {
        updateTest(2, {
          status: "error",
          message: error.response?.data?.detail || error.message || "Auth endpoint not accessible",
          details: error.response?.data,
        });
        return false;
      }
    }
  };

  const testCORS = async () => {
    updateTest(3, { status: "testing", message: "Testing..." });
    try {
      const response = await fetch("http://localhost:8000/api/", {
        method: "OPTIONS",
        headers: {
          "Origin": window.location.origin,
          "Access-Control-Request-Method": "GET",
        },
      });
      
      const corsHeaders = {
        allowOrigin: response.headers.get("Access-Control-Allow-Origin"),
        allowMethods: response.headers.get("Access-Control-Allow-Methods"),
        allowHeaders: response.headers.get("Access-Control-Allow-Headers"),
      };
      
      if (corsHeaders.allowOrigin) {
        updateTest(3, {
          status: "success",
          message: "CORS configured correctly",
          details: corsHeaders,
        });
        return true;
      } else {
        updateTest(3, {
          status: "error",
          message: "CORS headers not found",
          details: corsHeaders,
        });
        return false;
      }
    } catch (error: any) {
      updateTest(3, {
        status: "error",
        message: error.message || "CORS test failed",
        details: error,
      });
      return false;
    }
  };

  const runAllTests = async () => {
    await testBackendConnection();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await testApiRoot();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await testAuthEndpoint();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await testCORS();
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "testing":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Success</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "testing":
        return <Badge className="bg-blue-500">Testing...</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const allTestsPassed = tests.every((test) => test.status === "success");
  const anyTestRunning = tests.some((test) => test.status === "testing");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">API Connection Test</h1>
          <p className="text-gray-600">
            Test the connection between frontend and backend
          </p>
        </div>

        <Alert>
          <Server className="h-4 w-4" />
          <AlertDescription>
            <strong>Backend:</strong> http://localhost:8000/api/ <br />
            <strong>Frontend:</strong> {window.location.origin}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Connection Tests</CardTitle>
            <CardDescription>
              Run these tests to verify the API connection is working correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={runAllTests}
              disabled={anyTestRunning}
              className="w-full"
              size="lg"
            >
              {anyTestRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Network className="mr-2 h-4 w-4" />
                  Run All Tests
                </>
              )}
            </Button>

            <div className="space-y-3">
              {tests.map((test, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getStatusIcon(test.status)}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{test.name}</h3>
                            {getStatusBadge(test.status)}
                          </div>
                          <p className="text-sm text-gray-600">{test.message}</p>
                          {test.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                View Details
                              </summary>
                              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                {JSON.stringify(test.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {allTestsPassed && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>All tests passed!</strong> Your API connection is working correctly.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">API Base URL:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">
                {import.meta.env.VITE_API_BASE_URL || "/api"}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Frontend Origin:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">
                {window.location.origin}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Auth Token:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">
                {localStorage.getItem("agri_app_auth_token") ? "Present" : "Not set"}
              </code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-gray-600">If tests fail, check:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Django backend is running on port 8000</li>
              <li>PostgreSQL database is running</li>
              <li>CORS settings in Django settings.py</li>
              <li>Environment variables in .env file</li>
              <li>Browser console for error messages</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
