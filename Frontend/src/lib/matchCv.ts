// lib/matchCv.ts
export type MatchingOutput = {
  matching_analysis: { job_title: string }[];
  description: string[];
  recommendation: { job_title: string; action: string }[];
};

export async function matchCv(
  cvText: string,
  targetRoles: string[] = [],
  extra?: Record<string, any>
): Promise<MatchingOutput> {
  const endpoint = process.env.NEXT_PUBLIC_N8N_MATCHING_ENDPOINT!;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // اختياري: لو بتشيّك Secret في n8n خليه environment متاح للفرونت
      "X-Client-Secret": process.env.NEXT_PUBLIC_MATCH_SECRET ?? ""
    },
    body: JSON.stringify({
      cv_text: cvText,
      target_roles: targetRoles,
      extra_context: extra
    }),
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`n8n ${res.status}: ${text}`);
  }

  const data = (await res.json()) as MatchingOutput;

  // تحقق بسيط من الشكل
  if (
    !Array.isArray(data?.matching_analysis) ||
    !Array.isArray(data?.description) ||
    !Array.isArray(data?.recommendation)
  ) {
    throw new Error("Invalid response shape");
  }

  return data;
}
