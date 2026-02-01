// src/app/auth/user/verify-code/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, KeyRound } from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

export default function VerifyCodePage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [type, setType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("reset_email");
    if (!saved) router.push("/auth/user/forgot-password");
    else setEmail(saved);
  }, [router]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/verify-reset-code/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (res.ok) {
        setType("success");
        setMsg(" Code verified");
        setTimeout(() => router.push("/auth/user/reset-password"), 900);
      } else {
        setType("error");
        setMsg(" " + (data.error || "Invalid code"));
      }
    } catch (err: any) {
      setType("error");
      setMsg(" " + err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] px-4 py-12 relative overflow-hidden text-white">

      {/* خلفيات نيون خفيفة */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          href="/auth/user/login"
          className="inline-flex items-center gap-2 text-sm mb-8 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <Card className="bg-slate-900/80 border border-slate-700 text-slate-100 shadow-2xl backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto p-3 rounded-lg bg-sky-500/15 text-sky-400 w-fit mb-2">
              <KeyRound className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Enter Verification Code</CardTitle>
            <CardDescription className="text-slate-400">
              We sent a 6-digit code to your email.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-200">
                  6-digit Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
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
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
