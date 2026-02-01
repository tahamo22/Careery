"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ForgetPass() {
  const [email, setEmail] = useState("");

  return (
    <div className="flex min-h-screen bg-black">
      {/* LEFT IMAGE */}
      <div className="hidden lg:flex flex-[1.3] items-center justify-end">
        <Image
          src="/auth/login/BG.png"
          alt="Decor"
          width={800}
          height={800}
          className="w-[97%] h-[97vh] object-contain mr-[-40px]"
        />
      </div>

      {/* RIGHT AREA */}
      <div className="flex flex-1 min-w-[400px] bg-black items-center justify-center">
        <div className="bg-white rounded-[22px] shadow-[0_0_40px_#1dd16022] px-12 pt-12 pb-10 min-w-[420px] max-w-[550px] min-h-[650px] w-[98%] my-8 flex flex-col items-center relative text-center">
          {/* Header */}
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

          <h2 className="text-[2.1rem] font-bold text-[#181818] mb-3 tracking-wide">
            Forgot password
          </h2>
          <p className="text-[#444] text-[1.02rem] mb-2">
            Go back to{" "}
            <Link
              href="/auth/login"
              className="text-[#32c24d] font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
          <p className="text-[#444] text-[1.02rem] mb-6">
            Don’t have an account?{" "}
            <Link
              href="/auth/create-new-account"
              className="text-[#32c24d] font-semibold hover:underline"
            >
              Create account
            </Link>
          </p>

          {/* Form */}
          <form className="w-full">
            <div className="relative mb-3 w-full flex justify-center">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 pr-11 py-[13px] rounded-[7px] bg-[#e6e7e9] text-[1.07rem] text-[#222] text-center focus:outline focus:outline-[1.5px] focus:outline-[#32c24d] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                if (email.trim()) {
                  window.location.href = `/auth/email-verification?email=${encodeURIComponent(
                    email
                  )}`;
                }
              }}
              className="w-full py-3 bg-green-500 text-white font-semibold rounded-md shadow hover:bg-green-600 transition"
            >
              Reset Password →
            </button>
          </form>

          {/* Separator */}
          <div className="flex items-center my-6 text-[#888] text-[1.01rem] font-medium tracking-wide w-full">
            <hr className="flex-1 border-[#e6e7e9]" />
            <span className="px-3 bg-white">or</span>
            <hr className="flex-1 border-[#e6e7e9]" />
          </div>

          {/* Social Buttons */}
          <div className="flex flex-wrap gap-[11px] w-full justify-center">
            <button className="flex flex-1 min-w-[46%] items-center justify-center gap-2 bg-[#f6f7f9] text-[#ea4335] rounded-[6px] py-[9px] px-3 text-[0.97rem] font-medium shadow-sm hover:bg-[#e2fbe5]">
              <Image
                src="/auth/login/google.png"
                alt="Google"
                width={20}
                height={20}
              />
              Google
            </button>
            <button className="flex flex-1 min-w-[46%] items-center justify-center gap-2 bg-[#f6f7f9] text-[#4064ac] rounded-[6px] py-[9px] px-3 text-[0.97rem] font-medium shadow-sm hover:bg-[#e2fbe5]">
              <Image
                src="/auth/login/face.png"
                alt="Facebook"
                width={20}
                height={20}
              />
              Facebook
            </button>
            <button className="flex flex-1 min-w-[46%] items-center justify-center gap-2 bg-[#f6f7f9] text-[#2176ac] rounded-[6px] py-[9px] px-3 text-[0.97rem] font-medium shadow-sm hover:bg-[#e2fbe5]">
              <Image
                src="/auth/login/linked in.png"
                alt="LinkedIn"
                width={20}
                height={20}
              />
              LinkedIn
            </button>
            <button className="flex flex-1 min-w-[46%] items-center justify-center gap-2 bg-[#f6f7f9] text-[#181717] rounded-[6px] py-[9px] px-3 text-[0.97rem] font-medium shadow-sm hover:bg-[#e2fbe5]">
              <Image
                src="/auth/login/githup.png"
                alt="GitHub"
                width={20}
                height={20}
              />
              GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
