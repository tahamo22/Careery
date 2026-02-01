"use client";

import React, { useEffect, useRef, useState } from "react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import { Button } from "@/components/ui/button";
import { useVideoAnalysis } from "../create-cv/FinalCV/postData/useVideoAnalysis";
import ReactMarkdown from "react-markdown";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Table } from "lucide-react";


/* ================= TYPES ================= */

type AiMessage = {
  id: number;
  text: string;
  createdAt: string;
  type: "upload" | "analysis" | "error";
};

/* ================= CONSTANTS ================= */

const QUESTIONS = [
  "1- Introduce yourself quickly.",
  "2- Tell me about a time when you've found a team or individual challenging to work with. How did you resolve the situation?",
  "3- Tell me about a time when you've had to learn something quickly for a new project or task. What steps did you take?",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MAX_TIME = 120;

/* ================= COMPONENT ================= */

export default function InterviewTrainingPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    videos,
    selectedVideo,
    analysisResult,
    isFetchingVideos,
    isAnalyzing,
    isLoading,
    error: aiError,
    fetchVideos,
    analyzeVideo,
    clearAnalysis,
    setSelectedVideo,
  } = useVideoAnalysis();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [questionsConfirmed, setQuestionsConfirmed] = useState(false);
  const [lastUploadedVideoUrl, setLastUploadedVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("interviewAnalysis");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAiMessages((prev) => [
          {
            id: Date.now(),
            text: `Previous Analysis: ${JSON.stringify(parsed, null, 2)}`,
            createdAt: new Date(parsed.analyzed_at).toLocaleTimeString(),
            type: "analysis",
          },
          ...prev,
        ]);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (analysisResult) {
      const message =
        analysisResult.analysis ||
        analysisResult.feedback ||
        JSON.stringify(analysisResult, null, 2);

      setAiMessages((prev) => [
        {
          id: Date.now(),
          text: typeof message === "string" ? message : JSON.stringify(message, null, 2),
          createdAt: new Date().toLocaleTimeString(),
          type: "analysis",
        },
        ...prev,
      ]);
    }
  }, [analysisResult]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stream]);

  const startCamera = async (): Promise<MediaStream | null> => {
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      setStream(camStream);

      if (videoRef.current) {
        videoRef.current.srcObject = camStream;
        videoRef.current.muted = true;
        videoRef.current.controls = false;
        videoRef.current.play().catch(() => {});
      }

      return camStream;
    } catch {
      setError("Failed to access camera or microphone.");
      return null;
    }
  };

  const startSession = async () => {
    if (!API_URL) return;
    const token = localStorage.getItem("access");
    if (!token) return;

    const res = await fetch(`${API_URL}/api/interview/start/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setSessionId(data.session_id);
    }
  };

  const startRecording = async () => {
    if (!questionsConfirmed) {
      setError("Please read and confirm the questions before starting.");
      return;
    }

    if (recordedBlob) {
      setError("You already have a recorded video. Delete it to record again.");
      return;
    }

    let activeStream = stream;
    if (!activeStream) activeStream = await startCamera();
    if (!activeStream) return;

    if (!sessionId) await startSession();

    chunksRef.current = [];
    setRecording(true);
    setRecordingTime(0);
    setError(null);
    setLastUploadedVideoUrl(null);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordingTime((t) => {
        if (t + 1 >= MAX_TIME) {
          stopRecording();
          return MAX_TIME;
        }
        return t + 1;
      });
    }, 1000);

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm;codecs=vp8,opus";

    const recorder = new MediaRecorder(activeStream, {
      mimeType,
      videoBitsPerSecond: 1_000_000,
      audioBitsPerSecond: 96_000,
    });

    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      setRecordedBlob(blob);

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.src = URL.createObjectURL(blob);
        videoRef.current.muted = false;
        videoRef.current.controls = true;
        videoRef.current.load();
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    recorder.start();
  };

  const stopRecording = () => {
    setRecording(false);
    recorderRef.current?.stop();
  };
  const uploadVideo = async () => {
    if (!recordedBlob || !API_URL) return;

    try {
      setUploading(true);
      setError(null);

      const token = localStorage.getItem("access");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const formData = new FormData();
      formData.append("video", recordedBlob, "interview.mp4");
      formData.append("session_id", String(sessionId));

      const res = await fetch(`${API_URL}/api/interview/upload/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      if (data.video_url) {
        setLastUploadedVideoUrl(data.video_url);

        const newVideo = {
          id: data.id,
          video_url: data.video_url,
          session_id: data.session_id || sessionId,
          uploaded_at: new Date().toISOString(),
          feedback: null,
          question: null,
        };
        setSelectedVideo(newVideo);
      }

      setAiMessages((prev) => [
        {
          id: Date.now(),
          text: ` Video uploaded successfully! URL: ${data.video_url || "Processing..."}`,
          createdAt: new Date().toLocaleTimeString(),
          type: "upload",
        },
        ...prev,
      ]);

      await fetchVideos();
    } catch (err: any) {
      setError(err.message || "Upload failed.");
      setAiMessages((prev) => [
        {
          id: Date.now(),
          text: ` Upload Error: ${err.message}`,
          createdAt: new Date().toLocaleTimeString(),
          type: "error",
        },
        ...prev,
      ]);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    setError(null);

    let videoUrlToAnalyze = lastUploadedVideoUrl;

    if (!videoUrlToAnalyze && selectedVideo?.video_url) {
      videoUrlToAnalyze = selectedVideo.video_url;
    }

    if (!videoUrlToAnalyze && videos.length > 0) {
      const videoWithUrl = videos.find((v) => v.video_url);
      if (videoWithUrl) {
        videoUrlToAnalyze = videoWithUrl.video_url;
        setSelectedVideo(videoWithUrl);
      }
    }

    if (!videoUrlToAnalyze) {
      setError("No video URL available. Please upload a video first and wait for processing.");
      return;
    }

    try {
      setAiMessages((prev) => [
        {
          id: Date.now(),
          text: ` Analyzing video: ${videoUrlToAnalyze}`,
          createdAt: new Date().toLocaleTimeString(),
          type: "upload",
        },
        ...prev,
      ]);

      await analyzeVideo(videoUrlToAnalyze);
    } catch (err: any) {
      setAiMessages((prev) => [
        {
          id: Date.now(),
          text: ` Analysis Error: ${err.message}`,
          createdAt: new Date().toLocaleTimeString(),
          type: "error",
        },
        ...prev,
      ]);
    }
  };

  const deleteCurrentVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
      videoRef.current.srcObject = null;
      videoRef.current.controls = false;
    }

    setRecordedBlob(null);
    setRecordingTime(0);
    setQuestionsConfirmed(false);
    setLastUploadedVideoUrl(null);
    startCamera();
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />

      <div className="flex-1 px-4 py-8 flex justify-center">
        <div className="w-full max-w-5xl bg-[#050816] border border-slate-800 rounded-2xl p-6 space-y-6">
          {/* Questions */}
          <div className="bg-[#020617] border border-slate-700 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3 text-sky-400">
              Interview Questions (Read carefully)
            </h2>

            <ul className="list-disc list-inside space-y-2 text-sm">
              {QUESTIONS.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>

            <label className="flex items-center gap-2 mt-4 text-sm">
              <input
                type="checkbox"
                checked={questionsConfirmed}
                onChange={(e) => setQuestionsConfirmed(e.target.checked)}
              />
              I have read and understood all questions
            </label>
          </div>

          {/* Video Player */}
          <div className="max-w-3xl mx-auto">
            <video
              ref={videoRef}
              autoPlay={!recordedBlob}
              playsInline
              muted={!recordedBlob}
              className={`w-full aspect-video rounded-xl border border-slate-800 bg-black ${
                !recordedBlob ? "scale-x-[-1]" : ""
              }`}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 justify-center items-center">
            {!recording && (
              <Button
                onClick={startRecording}
                disabled={!questionsConfirmed || !!recordedBlob}
                className="bg-green-600 hover:bg-green-700"
              >
                Start Recording
              </Button>
            )}

            {recording && (
              <Button onClick={stopRecording} className="bg-red-600 hover:bg-red-700">
                Stop Recording ({formatTime(recordingTime)})
              </Button>
            )}

            <Button
              onClick={uploadVideo}
              disabled={!recordedBlob || uploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>

            <Button
              onClick={handleAnalyze}
              disabled={(!selectedVideo && !lastUploadedVideoUrl) || isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
            </Button>

            <Button
              variant="destructive"
              disabled={!recordedBlob}
              onClick={() => confirm("Delete this video?") && deleteCurrentVideo()}
            >
              Delete Video
            </Button>
          </div>

          {/* Status */}
          <div className="text-xs text-slate-400 text-center space-y-1">
            {lastUploadedVideoUrl && (
              <div className="text-green-400"> Direct upload URL ready</div>
            )}
            {selectedVideo && (
              <div>
                Selected Video: ID {selectedVideo.id} |{" "}
                {selectedVideo.video_url ? "Ready for analysis" : "URL not available"}
              </div>
            )}
          </div>

          {(error || aiError) && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error || aiError}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-lg">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span>
                {isFetchingVideos
                  ? "Fetching videos from database..."
                  : "Analyzing video with AI..."}
              </span>
            </div>
          )}

          {/* Interview AI Output */}
       <div className="bg-[#020617] border border-slate-700 rounded-xl p-5 space-y-4">
  <h3 className="text-xl font-semibold text-sky-400">AI Interview Analysis</h3>

  {!analysisResult && (
    <p className="text-slate-500 text-sm">
      No analysis yet. Record, upload, and analyze your interview to see AI feedback.
    </p>
  )}
    {analysisResult && (
    <div className="bg-[#050816] border border-slate-800 rounded-xl p-5 space-y-6">

      <div className="prose prose-invert prose-slate max-w-none">
        <ReactMarkdown
       
          components={{
      
            table: ({ children }) => (
              <div className="my-6 overflow-hidden rounded-lg border border-slate-700">
                <Table className="border-collapse">
                  {children}
                </Table>
              </div>
            ),
            thead: ({ children }) => (
              <TableHeader className="bg-slate-800/80 border-b border-slate-700">
                {children}
              </TableHeader>
            ),
            tbody: ({ children }) => (
              <TableBody className="divide-y divide-slate-800 bg-[#080b14]">
                {children}
              </TableBody>
            ),
            tr: ({ children }) => (
              <TableRow className="hover:bg-slate-800/50 border-0 transition-colors">
                {children}
              </TableRow>
            ),
            th: ({ children }) => (
              <TableHead className="text-sky-300 font-semibold py-3 px-4 text-left text-sm border-0">
                {children}
              </TableHead>
            ),
            td: ({ children }) => (
              <TableCell className="text-slate-300 py-3 px-4 text-sm leading-relaxed border-0 align-top">
                {children}
              </TableCell>
            ),
            
            // Headers - styled for dark theme
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold text-white mb-4 pb-2 border-b border-slate-700">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold text-sky-300 mb-4 mt-8 first:mt-0 flex items-center gap-2">
                <span className="w-1 h-6 bg-sky-500 rounded-full inline-block"></span>
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold text-slate-200 mb-3 mt-6">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-base font-semibold text-sky-200 mb-2 mt-4">
                {children}
              </h4>
            ),
            
            // Lists - handle both bullet (*) and numbered (1. 2. 3.) lists
            ul: ({ children }) => (
              <ul className="space-y-2 my-4 text-slate-300 list-none pl-0">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="space-y-3 my-4 text-slate-300 list-decimal list-inside pl-2 marker:text-sky-400 marker:font-semibold">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="pl-3 border-l-2 border-slate-700 hover:border-sky-500/50 transition-colors leading-relaxed">
                <span className="ml-2">{children}</span>
              </li>
            ),
            
            // Text formatting
            p: ({ children }) => (
              <p className="text-slate-300 leading-relaxed mb-4 last:mb-0 text-sm">
                {children}
              </p>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-sky-200">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-slate-400">
                {children}
              </em>
            ),
            
            // Horizontal rule (if any)
            hr: () => (
              <hr className="my-6 border-slate-800" />
            ),
          }}
        >
          {analysisResult.analysis || "No analysis provided."}
        </ReactMarkdown>
      </div>

      {/* Score/Confidence Footer (if available) */}
      {(analysisResult.score || analysisResult.confidence) && (
        <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-6 text-sm">
          {analysisResult.score && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Performance Score:</span>
              <span className="text-emerald-400 font-bold text-lg">
                {analysisResult.score}/100
              </span>
            </div>
          )}
          {analysisResult.confidence && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">AI Confidence:</span>
              <span className="text-sky-400 font-semibold">
                {analysisResult.confidence}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )}

</div>
        </div>
      </div>

      <Footer />
    </main>
  );
}