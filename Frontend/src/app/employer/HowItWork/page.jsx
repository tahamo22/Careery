"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HowItWork() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/employer/settings");
  }, []);

  return null;
}
