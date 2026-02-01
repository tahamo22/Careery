// src/lib/api.ts

// ===============================
// 🔹 Base URL
// ===============================
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ===============================
// 🔹 Helpers
// ===============================
function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access");
}

function setTokens(access: string, refresh?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("access", access);
  if (refresh) {
    localStorage.setItem("refresh", refresh);
  }
}

async function safeJson(res: Response) {
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error("Server returned non-JSON response:\n" + text.slice(0, 200));
  }
  return res.json();
}

// ===============================
// 🔹 AUTH
// ===============================
export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await safeJson(res);

  // لو اللوجين نجح وفيه توكن
  if (data?.access) {
    setTokens(data.access, data.refresh);
  }

  return data;
}

// ===============================
// 🔹 Generic Authorized Request
// ===============================
export async function authFetch(
  url: string,
  options: RequestInit = {}
) {
  const token = getAccessToken();

  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return safeJson(res);
}

// ===============================
// 🔹 COMPANY STATUS (IMPORTANT)
// ===============================
export async function getCompanyStatus() {
  try {
    const data = await authFetch("/api/company-profiles/");

    /**
     * DRF بيرجع Array:
     * [
     *   {
     *     id,
     *     company_name,
     *     status: "pending" | "approved" | "rejected"
     *   }
     * ]
     */
    if (Array.isArray(data) && data.length > 0) {
      return data[0].status;
    }

    return null;
  } catch {
    return null;
  }
}