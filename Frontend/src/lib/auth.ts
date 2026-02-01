import { API_BASE_URL } from "@/lib/api";

export async function getValidAccessToken(): Promise<string | null> {
  const access = localStorage.getItem("access");
  const refresh = localStorage.getItem("refresh");

  if (!access || !refresh) return null;

  // جرّب بالـ access الأول
  try {
    const test = await fetch(`${API_BASE_URL}/api/auth/me/`, {
      headers: { Authorization: `Bearer ${access}` },
    });

    if (test.ok) return access;
  } catch {}

  // لو فشل → اعمل refresh
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    localStorage.setItem("access", data.access);
    return data.access;
  } catch {
    return null;
  }
}
