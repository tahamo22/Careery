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
import { Mail, Lock, Building2, Globe, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

export default function CompanyRegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage(" Passwords do not match!");
      return;
    }

    if (password.length < 8) {
      setMessageType("error");
      setMessage(" Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email,
        full_name: companyName,
        password,
        user_type: "company",
        website: website || null,
      };

      const res = await fetch(`${API_BASE_URL}/api/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessageType("success");
        setMessage(" Company registered successfully!");

        setCompanyName("");
        setEmail("");
        setWebsite("");
        setPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          router.push("/auth/company/login");
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(" " + (data.message || data.email?.[0] || "Registration failed"));
      }
    } catch (err: any) {
      setMessageType("error");
      setMessage("⚠️ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#020617] text-slate-100">
      {/* خلفية نيون */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-20 -left-24 h-72 w-72 bg-sky-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 bg-indigo-500/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Card className="border border-slate-700 bg-slate-900/80 backdrop-blur-sm shadow-xl shadow-black/40">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-slate-50">
              Register your company
            </CardTitle>
            <CardDescription className="text-slate-400">
              Post jobs and find top talent using AI-powered tools.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="company-name"
                    type="text"
                    placeholder="Acme Inc."
                    className="pl-10 bg-slate-900/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="company@example.com"
                    className="pl-10 bg-slate-900/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">
                  Website <span className="text-slate-400 text-sm">(optional)</span>
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    className="pl-10 bg-slate-900/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-slate-900/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-slate-900/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Message */}
              {message && (
                <p
                  className={`text-center text-sm ${
                    messageType === "success"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {message}
                </p>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/40"
                disabled={loading}
              >
                {loading ? "Registering..." : "Register"}
              </Button>

              <p className="text-center text-sm text-slate-400">
                Already have an account?{" "}
                <Link
                  href="/auth/company/login"
                  className="text-sky-400 hover:text-sky-300 hover:underline font-medium"
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
