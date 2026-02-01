"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ✅ نستورد الـ API_BASE_URL من lib/api.ts
import { API_BASE_URL } from "@/lib/api";

export default function CreateAccount() {
  const router = useRouter(); // ✅ للـ redirect

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedType, setSelectedType] = useState("candidate");

  // form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  const userTypeMap: Record<string, string> = {
    candidate: "job_seeker",
    employer: "company",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      setMessage(" Passwords do not match!");
      return;
    }

    try {
      const payload = {
        email,
        full_name: `${firstName} ${lastName}`,
        password,
        user_type: userTypeMap[selectedType],
      };

      const res = await fetch(`${API_BASE_URL}/api/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(" Account created successfully!");
        // ✅ بعد النجاح redirect على صفحة Login
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);

        // Reset form
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setConfirm("");
      } else {
        setMessage(" Error: " + JSON.stringify(data));
      }
    } catch (err: any) {
      console.error("Error:", err);
      setMessage(" Something went wrong: " + err.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-background">
      {/* Left Image */}
      <div className="hidden lg:flex flex-[1.3] items-center justify-end">
        <Image src="/auth/login/BG.png" alt="Decor" width={800} height={800} className="w-[97%] h-[97vh] object-contain mr-[-40px]" />
      </div>

      {/* Right Form Area */}
      <div className="flex flex-1 min-w-[400px] items-center justify-center">
        <div className="bg-[#ededed] rounded-[22px] px-12 pt-12 pb-10 min-w-[420px] max-w-[550px] min-h-[700px] flex flex-col items-center text-center">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <Image src="/auth/login/logo.png" alt="logo" width={38} height={38} className="rounded-full" />
            <span className="font-bold text-[1.3rem] text-[#111]">Careery</span>
          </div>

          <h2 className="text-[2.2rem] font-bold text-[#181818] mb-3">Create Account</h2>
          <p className="text-[#444] text-[1.03rem] mb-4">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-[#32c24d] font-semibold hover:underline">
              Login
            </Link>
          </p>

          {/* User Type Buttons */}
          <div className="flex gap-3 mb-5 w-full">
            <button
              type="button"
              onClick={() => setSelectedType("candidate")}
              className={`flex-1 py-2 rounded-lg font-semibold border ${selectedType === "candidate" ? "bg-black text-white border-black" : "bg-white text-gray-800 border-gray-300"}`}
            >
              👤 Candidate
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("employer")}
              className={`flex-1 py-2 rounded-lg font-semibold border ${selectedType === "employer" ? "bg-black text-white border-black" : "bg-white text-gray-800 border-gray-300"}`}
            >
              🏢 Employer
            </button>
          </div>

          {/* Form */}
          <form className="w-full" onSubmit={handleSubmit}>
            <div className="flex gap-3 mb-3">
              <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="flex-1 px-3 py-[12px] rounded-[7px] bg-[#e6e7e9]" />
              <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="flex-1 px-3 py-[12px] rounded-[7px] bg-[#e6e7e9]" />
            </div>
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full mb-3 px-3 py-[12px] rounded-[7px] bg-[#e6e7e9]" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mb-3 px-3 py-[12px] rounded-[7px] bg-[#e6e7e9]"
            />
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full mb-4 px-3 py-[12px] rounded-[7px] bg-[#e6e7e9]"
            />
            <button type="submit" className="w-full py-[13px] rounded-[9px] bg-[#32c24d] text-white font-bold hover:bg-green-600">
              Sign Up →
            </button>
          </form>

          {/* ✅ Message */}
          {message && <p className={`mt-4 text-sm ${message.startsWith("") ? "text-green-600" : "text-red-600"}`}>{message}</p>}
        </div>
      </div>
    </div>
  );
}
