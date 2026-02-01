"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("candidate");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const router = useRouter();

  const userTypeMap: Record<string, string> = {
    candidate: "job_seeker",
    employer: "company",
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setStatus(null);

    try {
      const payload = { email, password, user_type: userTypeMap[userType] };

      const res = await fetch(`${API_BASE_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        setStatus("error");
        setMessage("Backend did not return JSON:\n" + text);
        return;
      }

      if (!res.ok) {
        setStatus("error");
        setMessage("Error: " + JSON.stringify(data));
        return;
      }

      // ✅ حفظ التوكنات
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("user_type", data.user_type);
      localStorage.setItem("user_email", data.email);
      if (data.full_name) {
        localStorage.setItem("user_name", data.full_name);
      }

      setStatus("success");
      setMessage("Login successful!");

      // ✅ ضرب heartbeat لتحديث Active Session
      try {
        await fetch(`${API_BASE_URL}/api/heartbeat/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.access}`,
          },
        });
      } catch (err) {
        console.error("Heartbeat error:", err);
      }

      // ✅ التوجيه الذكي حسب نوع المستخدم وحالة الـ CV / Profile
      if (data.user_type === "company") {
        // ===== EMPLOYER =====
        try {
          const resProfile = await fetch(
            `${API_BASE_URL}/api/company-profiles/`,
            {
              headers: { Authorization: `Bearer ${data.access}` },
            }
          );
          const profiles = await resProfile.json();

          if (!Array.isArray(profiles) || profiles.length === 0) {
  // 🟡 شركة جديدة أو لسه مكملتش بياناتها
  router.push("/employer/settings");
  return;
}

const company = profiles[0];

if (company.status !== "approved") {
  // 🟡 Pending أو Rejected → Settings فقط
  router.push("/employer/settings");
  return;
}

// ✅ Approved
router.push("/employer/dashboard");

        } catch (err) {
          console.error("Profile check error:", err);
          
        }
      } else {
        // ===== CANDIDATE / JOB_SEEKER =====
        try {
          const settingsRes = await fetch(`${API_BASE_URL}/api/settings/`, {
            headers: {
              Authorization: `Bearer ${data.access}`,
            },
          });

          let settings: any = {};
          try {
            settings = await settingsRes.json();
          } catch {
            settings = {};
          }

          const cv = settings?.cv || {};
          const hasCV = cv && Object.keys(cv).length > 0;

          if (hasCV) {
            // ✅ عنده CV محفوظ قبل كده → نخيره
            const goEdit = window.confirm(
              "You already have a saved CV.\n\nOK → Edit CV\nCancel → View Final CV"
            );

            if (goEdit) {
              router.push("/user/create-cv");
            } else {
              router.push("/user/create-cv/FinalCV");
            }
          } else {
            // ✅ أول مرة يسجل → يكمّل Onboarding
            router.push("/user/onboarding");
          }
        } catch (err) {
          console.error("Settings check error:", err);
          router.push("/user/onboarding");
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage("Something went wrong: " + err.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-background">
      {/* Left Image */}
      <div className="hidden lg:flex flex-[1.3] items-center justify-end">
        <Image
          src="/auth/login/BG.png"
          alt="Decor"
          width={800}
          height={800}
          className="w-[97%] h-[97vh] object-contain mr-[-40px]"
        />
      </div>

      {/* Right Form */}
      <div className="flex flex-1 min-w-[400px] bg-black items-center justify-center">
        <div className="bg-white rounded-[22px] px-12 pt-12 pb-10 min-w-[420px] max-w-[550px] min-h-[650px] w-[98%] my-8 flex flex-col items-center relative text-center">
          <div className="flex items-center gap-3 mb-4 justify-center w-full">
            <Image
              src="/auth/login/logo.png"
              alt="logo"
              width={36}
              height={36}
              className="rounded-full"
            />
            <span className="font-bold text-[1.32rem] text-[#111]">
              Careery
            </span>
          </div>

          <h2 className="text-[2.1rem] font-bold text-[#181818] mb-3">
            Sign In
          </h2>
          <p className="text-[#444] text-[1.02rem] mb-4">
            Don’t have an account?{" "}
            <Link
              href="/auth/create-new-account"
              className="text-[#32c24d] font-semibold hover:underline"
            >
              Create account
            </Link>
          </p>

          {/* User Type */}
          <div className="flex gap-3 mb-5 w-full">
            <button
              type="button"
              onClick={() => setUserType("candidate")}
              className={`flex-1 py-2 rounded-lg font-semibold border ${
                userType === "candidate"
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-800 border-gray-300"
              }`}
            >
              👤 Candidate
            </button>
            <button
              type="button"
              onClick={() => setUserType("employer")}
              className={`flex-1 py-2 rounded-lg font-semibold border ${
                userType === "employer"
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-800 border-gray-300"
              }`}
            >
              🏢 Employer
            </button>
          </div>

          {/* Login Form */}
          <form className="w-full" onSubmit={handleLogin}>
            <div className="relative mb-3 w-full flex justify-center">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-[13px] rounded-[7px] bg-[#e6e7e9] text-[1.07rem] text-center"
              />
            </div>
            <div className="relative mb-3 w-full flex justify-center">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-[13px] rounded-[7px] bg-[#e6e7e9] text-[1.07rem] text-center"
              />
              <Image
                src="/auth/login/eye.png"
                alt="toggle password"
                width={20}
                height={20}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer opacity-70"
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>

            <div className="flex justify-end mb-2">
              <Link
                href="/auth/forget-password"
                className="text-[#32c24d] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-[13px] rounded-[8px] bg-[#32c24d] text-white font-bold"
            >
              Sign In →
            </button>
          </form>

          {/* Messages */}
          {message && (
            <p
              className={`mt-4 text-sm ${
                status === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
