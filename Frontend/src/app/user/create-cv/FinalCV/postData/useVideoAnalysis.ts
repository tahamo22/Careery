"use client";

import { useState, useCallback } from "react";

interface InterviewVideo {
  id: number;
  video_url: string;
  session_id: number;
  uploaded_at: string;
  feedback: string | null;
  question: number | null;
}

interface AIAnalysisResult {
  analysis?: string;
  feedback?: string;
  score?: number;
  confidence?: number;
  recommendations?: string[];
  [key: string]: any;
}

interface UseVideoAnalysisReturn {
  videos: InterviewVideo[];
  selectedVideo: InterviewVideo | null;
  analysisResult: AIAnalysisResult | null;
  isFetchingVideos: boolean;
  isAnalyzing: boolean;
  isLoading: boolean;
  error: string | null;
  fetchVideos: () => Promise<void>;
  analyzeVideo: (videoUrl: string) => Promise<AIAnalysisResult | undefined>;
  analyzeLatestVideo: () => Promise<void>;
  clearAnalysis: () => void;
  setSelectedVideo: (video: InterviewVideo | null) => void;
}

const DJANGO_API = "http://127.0.0.1:8000/api";
const AI_API = "https://47uxbmdpup3zor-7878.proxy.runpod.net";
// ✅ تأكد أن هذا الرابط هو رابط Ngrok الحالي الخاص بك
const NGROK_BASE_URL = "https://59e3b862d391.ngrok-free.app";

export function useVideoAnalysis(): UseVideoAnalysisReturn {
  const [videos, setVideos] = useState<InterviewVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<InterviewVideo | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [isFetchingVideos, setIsFetchingVideos] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    setIsFetchingVideos(true);
    setError(null);

    try {
      const token = localStorage.getItem("access");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${DJANGO_API}/interview_videos/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized - Please login again");
        }
        throw new Error(`Failed to fetch videos: ${response.status}`);
      }

      const result: InterviewVideo[] = await response.json();
      setVideos(result);

      const videoWithUrl = result.find((v) => v.video_url);
      if (videoWithUrl) {
        setSelectedVideo(videoWithUrl);
      } else if (result.length > 0) {
        setSelectedVideo(result[0]);
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch videos");
      console.error("Fetch videos error:", err);
      throw err;
    } finally {
      setIsFetchingVideos(false);
    }
  }, []);

  const analyzeVideo = useCallback(async (videoUrl: string) => {
    if (!videoUrl || typeof videoUrl !== "string") {
      setError("Invalid video URL provided");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // ✅ إصلاح الرابط: تحويل الرابط النسبي إلى رابط كامل باستخدام Ngrok
      let absoluteVideoUrl = videoUrl;
      if (videoUrl.startsWith("/media")) {
        absoluteVideoUrl = `${NGROK_BASE_URL}${videoUrl}`;
      } else if (!videoUrl.startsWith("http")) {
        // في حالة وجود مسار لا يبدأ بـ http ولا بـ /media
        absoluteVideoUrl = `${NGROK_BASE_URL}/media/${videoUrl.replace(/^\/+/, "")}`;
      }

      console.log("🚀 Sending Absolute URL to AI Service:", absoluteVideoUrl);

      const response = await fetch(`${AI_API}/analyze-interview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ video_url: absoluteVideoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `AI Analysis failed: ${response.status}`);
      }

      const result: AIAnalysisResult = await response.json();

      const dataToStore = {
        ...result,
        video_url: absoluteVideoUrl,
        analyzed_at: new Date().toISOString(),
      };

      localStorage.setItem("interviewAnalysis", JSON.stringify(dataToStore));
      setAnalysisResult(dataToStore);

      console.log("✅ AI Analysis Success:", result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      console.error("❌ Analysis error:", err);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const analyzeLatestVideo = useCallback(async () => {
    try {
      const latestVideos = await fetchVideos();
      if (latestVideos && latestVideos.length > 0) {
        // نأخذ أول فيديو (الأحدث غالباً) ونحلله
        const latest = latestVideos[0];
        const urlToAnalyze = latest.video_url || latest.video; 
        if (urlToAnalyze) {
          await analyzeVideo(urlToAnalyze);
        }
      }
    } catch (err) {
      console.error("Analyze latest error:", err);
    }
  }, [fetchVideos, analyzeVideo]);

  const clearAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setSelectedVideo(null);
    localStorage.removeItem("interviewAnalysis");
  }, []);

  return {
    videos,
    selectedVideo,
    analysisResult,
    isFetchingVideos,
    isAnalyzing,
    isLoading: isFetchingVideos || isAnalyzing,
    error,
    fetchVideos,
    analyzeVideo,
    analyzeLatestVideo,
    clearAnalysis,
    setSelectedVideo,
  };
}