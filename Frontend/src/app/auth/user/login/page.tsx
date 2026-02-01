"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

export default function UserLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [showResend, setShowResend] = useState(false);

  // ================================
  // 🔁 Resend Verification
  // ================================
  const resendVerification = async () => {
    if (!email) {
      setMessageType("error");
      setMessage("Please enter your email first.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/resend-verification/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(typeof data?.detail === "string" ? data.detail : "Failed to resend verification email.");
        return;
      }

      setMessageType("success");
      setMessage("Verification email sent. Please check your inbox.");
      setShowResend(false);
    } catch {
      setMessageType("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // 🔐 Login
  // ================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setShowResend(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          user_type: "job_seeker",

        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("user_type", data.user_type);
        localStorage.setItem("user_email", data.email);

        if (remember) {
          localStorage.setItem("remember_email", email);
        }

        setMessageType("success");
        setMessage("Login successful!");

        setTimeout(() => {
          router.push("/user/onboarding");
        }, 800);
      } else {
        const errorText =
          typeof data?.detail === "string"
            ? data.detail
            : Array.isArray(data?.non_field_errors)
            ? data.non_field_errors[0]
            : "Invalid email or password";

        // 🔴 رسالة أوضح لعدم التفعيل
        if (typeof errorText === "string" && errorText.toLowerCase().includes("verify")) {
          setMessageType("error");
          setMessage("Your email is not verified. Please check your inbox.");
          setShowResend(true);
        } else {
          setMessageType("error");
          setMessage("Invalid email or password");
        }
      }
    } catch {
      setMessageType("error");
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-sky-300 hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Card className="bg-slate-900/80 border border-slate-700 text-slate-100">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Welcome back!</CardTitle>
            <CardDescription className="text-slate-400">Access your CV dashboard.</CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div>
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <div className="flex justify-between text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Checkbox checked={remember} onCheckedChange={(v) => setRemember(v as boolean)} />
                  Remember me
                </div>
                <Link href="/auth/user/forgot-password" className="text-sky-400">
                  Forgot password?
                </Link>
              </div>

              {message && <p className={`text-sm text-center ${messageType === "success" ? "text-green-400" : "text-red-400"}`}>{message}</p>}

              {showResend && (
                <button type="button" onClick={resendVerification} className="block w-full text-sm text-sky-400 underline text-center">
                  Resend verification email
                </button>
              )}

              <Button
                type="submit"
                disabled={loading}
                className={`w-full bg-sky-600 hover:bg-sky-500 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <p className="text-center text-sm text-slate-400">
                Don&apos;t have an account?{" "}
                <Link href="/auth/user/register" className="text-sky-400 hover:underline">
                  Create account
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
