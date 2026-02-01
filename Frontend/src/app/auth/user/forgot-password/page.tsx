// src/app/auth/user/forgot-password/page.tsx
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
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

export default function UserForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [type, setType] = useState<"success" | "error">("success");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/request-password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const raw = await res.text();
      let data: any = {};

      try {
        data = JSON.parse(raw);
      } catch (err) {
        console.error(" SERVER RAW RESPONSE:", raw);
        setType("error");
        setMsg(" Server returned invalid response.");
        setLoading(false);
        return;
      }

      if (res.ok) {
        setType("success");
        setMsg(" Code sent to your email");

        localStorage.setItem("reset_email", email);

        setTimeout(() => router.push("/auth/user/verify-code"), 1000);
      } else {
        setType("error");
        setMsg(" " + (data.error || "Failed to send code"));
      }
    } catch (err: any) {
      setType("error");
      setMsg("" + err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white px-4 py-12 relative overflow-hidden">
      {/* خلفيات نيون زي الهوم/اللوجين */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <Link
          href="/auth/user/login"
          className="inline-flex items-center gap-2 text-sm text-sky-300 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <Card className="bg-slate-900/80 border border-slate-700 text-slate-100 shadow-2xl backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-2 w-fit rounded-lg bg-sky-500/15 p-3 text-sky-400">
              <KeyRound className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Forgot your password?
            </CardTitle>
            <CardDescription className="text-base text-slate-400">
              We&apos;ll send you a 6-digit code to reset your password.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {msg && (
                <p
                  className={`text-center text-sm ${
                    type === "success" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {msg}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-500"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Code"}
              </Button>

              <p className="text-center text-sm text-slate-400">
                Remember your password?{" "}
                <Link
                  href="/auth/user/login"
                  className="text-sky-400 hover:underline font-medium"
                >
                  Login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
