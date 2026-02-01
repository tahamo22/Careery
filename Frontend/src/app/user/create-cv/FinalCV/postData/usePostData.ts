import { useState  } from "react";
import { CVData } from "../page";
import { useRouter } from "next/router";
import { redirect } from "next/navigation";

export function usePostData() {
  const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
  const postData = async (cvObj: any) => {
    console.log("Posting CV Data:", cvObj);
    setLoading(true);

    const flattenCV = (obj: any): string => {
      if (typeof obj === "string") return obj.replace(/[\r\n]+/g, " ").trim();
      if (Array.isArray(obj)) return obj.map(flattenCV).join(" ");
      if (obj && typeof obj === "object") return Object.values(obj).map(flattenCV).join(" ");
      return String(obj);
    };

    const cvText = flattenCV(cvObj);

    try {
      const response = await fetch(
        "https://47uxbmdpup3zor-7878.proxy.runpod.net/analyze-cv",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cv_text: cvText }),
        }
      );

      if (!response.ok) throw new Error("Request failed");

      const result = await response.json();
      localStorage.setItem("cvAnalysis", JSON.stringify(result));
      setData(result);
      console.log("Analysis Result:", result);
      return result;
    } finally {
      setLoading(false);
    }
  };
  

  return { postData, loading , data };
}

