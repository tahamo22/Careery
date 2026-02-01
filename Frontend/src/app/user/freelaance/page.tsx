"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/user/Navbar";
import {
  Sparkles,



ExternalLink,

  Briefcase,
  DollarSign,
  Calendar,
 
  Layers,
  AlertCircle,
  SearchX,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton  } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Button from "@/components/Button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Job {
  jobid: string;
  url: string;
  published_at: string;
  title: string;
  description: string;
  skills: string[];
  budget_type: string;
  budget_total_usd: string | null;
  experience_level: string;
}
// to change end point  if u reach max in day (:)
const BASE_URL = "https://upwork-jobs-api3.p.rapidapi.com/upwork"
export default function FreelancePage() {

  const [getData, setGetData] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");

  // Get job title from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cvAnalysis");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Get first job title from matching_analysis array
        const firstJobTitle = parsed?.matching_analysis?.[0]?.job_title;
        
        if (firstJobTitle) {
          setSearchQuery(firstJobTitle);
        } else {
          setSearchQuery("JavaScript"); // fallback
        }
      } else {
        setSearchQuery("JavaScript"); // fallback if no localStorage
      }
    } catch (err) {
      console.error("Error reading localStorage:", err);
      setSearchQuery("JavaScript"); // fallback on error
    }
  }, []);

  // need to remove java and place with data that i save in local {Ai,Eng} and if i need to pass 2 job title use %7
 useEffect(() => {
    if (!searchQuery) return; // Wait until we have the query

    const getJobs = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Encode the job title for URL (handles spaces: "Data Scientist" -> "Data%20Scientist")
        const encodedQuery = encodeURIComponent(searchQuery);
        
        const response = await fetch(
          `${BASE_URL}?q=${encodedQuery}&limit=10`,
          {
            method: "GET",
            headers: {
              // change me if u  get error 428 or something like that 
              "x-rapidapi-key": "b2cecd5240mshffb7ab0812e6baep15abeajsndcc265f64318",
              "x-rapidapi-host": "upwork-jobs-api3.p.rapidapi.com",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch jobs: ${response.status}`);
        }

        const data = await response.json();
        setGetData(data.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load jobs";
        setError(errorMessage);
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    getJobs();
  }, [searchQuery]); 
 
  // to edit date 
 const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
// this will display when data isloading = true 
 const JobCardSkeleton = () => (
    <Card className="bg-[#050816] border-slate-800">
      <CardHeader className="space-y-4 pb-4">
        <Skeleton className="h-6 w-3/4 bg-slate-800" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full bg-slate-800" />
          <Skeleton className="h-6 w-16 rounded-full bg-slate-800" />
          <Skeleton className="h-6 w-24 rounded-full bg-slate-800" />
        </div>
      </CardHeader>
      <Separator className="bg-slate-800" />
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-slate-800" />
          <Skeleton className="h-20 w-full rounded-lg bg-slate-800/50" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full bg-slate-800" />
          <Skeleton className="h-6 w-20 rounded-full bg-slate-800" />
          <Skeleton className="h-6 w-14 rounded-full bg-slate-800" />
        </div>
        <Skeleton className="h-10 w-full rounded-md bg-slate-800" />
      </CardContent>
    </Card>
  );


  return (
    <main className="bg-black min-h-screen flex flex-col text-white">
      <Navbar />

      {/* ===== HEADER ===== */}
           <section className="px-6 pt-8">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-sky-500" />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
            Freelance Jobs
          </h1>
        </div>

        <p className="text-slate-400 max-w-6xl mx-auto mt-2 text-sm md:text-base">
          Based on your CV analysis:
          <span className="text-slate-100 font-semibold ml-1">
            {searchQuery || "Loading..."}
          </span>
        </p>
      </section>

      {/* ===== CONTENT ===== */}
      <section className="max-w-6xl mx-auto w-full px-6 mt-8 mb-10 flex-1">
        
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <Alert className="bg-red-950/30 border-red-900/50 text-red-200 max-w-2xl mx-auto">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <AlertDescription className="ml-2">
              <p className="font-semibold mb-1">Failed to load jobs</p>
              <p className="text-sm text-red-300/80">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()} 
                className="mt-3 border-red-800/50 hover:bg-red-950/50 text-red-200"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && getData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <SearchX className="h-8 w-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No jobs found</h3>
            <p className="text-slate-500 max-w-sm">
              We couldn't find any freelance jobs matching your criteria. Try adjusting your search terms.
            </p>
          </div>
        )}

        {/* Success State - Job Cards */}
        {!isLoading && getData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {getData.map((job) => (
              <Card 
                key={job.jobid} 
                className="bg-[#050816] border-slate-800 text-white overflow-hidden hover:border-sky-600/50 transition-colors flex flex-col"
              >
                <CardHeader className="space-y-4 pb-4">
                  {/* Title & Link */}
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-lg font-bold text-sky-300 leading-tight flex-1 line-clamp-2">
                      {job.title}
                    </h2>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-sky-400 transition-colors shrink-0 mt-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  {/* Meta Row */}
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant="secondary" 
                      className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 text-xs"
                    >
                      <Briefcase className="h-3 w-3 mr-1" />
                      {job.experience_level}
                    </Badge>
                    
                    <Badge 
                      variant="secondary" 
                      className="bg-sky-950/30 text-sky-300 border-sky-800/50 hover:bg-sky-950/50 text-xs"
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      {job.budget_total_usd || job.budget_type}
                    </Badge>

                    <Badge 
                      variant="outline" 
                      className="border-slate-700 text-slate-400 text-xs"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(job.published_at)}
                    </Badge>
                  </div>
                </CardHeader>

                <Separator className="bg-slate-800" />

                <CardContent className="space-y-4 pt-4 flex-1 flex flex-col">
                  {/* Description */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-slate-400 flex items-center gap-2 uppercase tracking-wider">
                      <Layers className="h-3 w-3 text-sky-500" />
                      Description
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed line-clamp-4">
                      {job.description}
                    </p>
                  </div>

                  {/* Skills */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Skills
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {job.skills.slice(0, 4).map((skill, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-normal"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {job.skills.length > 4 && (
                          <Badge
                            variant="outline"
                            className="border-slate-800 text-slate-500 text-[10px]"
                          >
                            +{job.skills.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex-1"></div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <Button
                      asChild
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white border-0 text-sm"
                    >
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Job
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
