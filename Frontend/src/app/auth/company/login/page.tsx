"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

export default function CompanyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          user_type: "company",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage("Invalid email or password");
        return;
      }

      // ✅ Save auth data
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("user_type", data.user_type);
      localStorage.setItem("user_email", data.email);

      if (remember) {
        localStorage.setItem("remember_email", email);
      }

      setMessageType("success");
      setMessage("Login successful!");

      // ✅ Decide next page
      setTimeout(async () => {
        try {
          const resProfile = await fetch(
            `${API_BASE_URL}/api/company-profiles/`,
            {
              headers: {
                Authorization: `Bearer ${data.access}`,
              },
            }
          );

          const profiles = await resProfile.json();

          // 🟢 مفيش Company Profile → Settings
          if (!Array.isArray(profiles) || profiles.length === 0) {
            router.replace("/employer/settings");
            return;
          }

          // ✅ عنده Profile → Dashboard
          router.replace("/employer/dashboard");
        } catch (error) {
          console.error("Profile check failed:", error);
          router.replace("/employer/settings");
        }
      }, 600);
    } catch (err: any) {
      setMessageType("error");
      setMessage("Server error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white px-4 py-12 relative overflow-hidden">
      {/* خلفية */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-sky-300 hover:text-white mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Card className="bg-slate-900/80 border border-slate-700 text-slate-100 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Welcome back!
            </CardTitle>
            <CardDescription className="text-slate-400">
              Manage your job postings.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="company@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(checked) =>
                      setRemember(checked as boolean)
                    }
                  />
                  <span className="text-sm text-slate-300">Remember me</span>
                </div>

                <Link
                  href="/auth/company/forgot-password"
                  className="text-sm text-sky-400"
                >
                  Forgot password?
                </Link>
              </div>

              {message && (
                <p
                  className={`text-sm text-center ${
                    messageType === "success"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {message}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-500"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Login"}
              </Button>

              <p className="text-center text-sm text-slate-400">
                Don't have an account?{" "}
                <Link
                  href="/auth/company/register"
                  className="text-sky-400"
                >
                  Register
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
