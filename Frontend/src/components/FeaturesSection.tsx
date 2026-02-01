import type React from "react";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Brain,
  Target,
  Send,
  Building2,
  Users,
  LayoutDashboard,
} from "lucide-react";

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 bg-slate-950">
      <div className="container mx-auto max-w-7xl">
        {/* العنوان الأساسي */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white text-balance">
            Powerful features for everyone
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto text-pretty">
            Whether you're looking for your next opportunity or searching for
            talent, we've got you covered.
          </p>
        </div>

        {/* For Job Seekers */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-sky-900/40">
              <Users className="h-6 w-6 text-sky-400" />
            </div>
            <h3 className="text-3xl font-bold text-white">For Job Seekers</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<FileText className="h-6 w-6 text-sky-400" />}
              title="Create CV"
              description="Build a professional CV easily with our intuitive builder. Add skills, experience, education, and custom sections."
            />
            <FeatureCard
              icon={<Brain className="h-6 w-6 text-sky-400" />}
              title="AI CV Analysis"
              description="Our AI analyzes your CV and suggests the most suitable job descriptions matching your profile."
            />
            <FeatureCard
              icon={<Target className="h-6 w-6 text-sky-400" />}
              title="Smart Recommendations"
              description="Get real, up-to-date job opportunities from multiple APIs that perfectly match your skills."
            />
            <FeatureCard
              icon={<Send className="h-6 w-6 text-sky-400" />}
              title="Apply Directly"
              description="Apply for matched jobs directly through our platform with one click. Track all applications."
            />
          </div>
        </div>

        {/* For Companies */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-sky-900/40">
              <Building2 className="h-6 w-6 text-sky-400" />
            </div>
            <h3 className="text-3xl font-bold text-white">For Companies</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Briefcase className="h-6 w-6 text-sky-400" />}
              title="Post Jobs"
              description="Register your company and easily post job listings with detailed requirements and descriptions."
            />
            <FeatureCard
              icon={<SparklesIcon className="h-6 w-6 text-sky-400" />}
              title="View Suitable CVs"
              description="AI automatically recommends CVs that best match each job posting based on skills and experience."
            />
            <FeatureCard
              icon={<LayoutDashboard className="h-6 w-6 text-sky-400" />}
              title="Company Dashboard"
              description="Manage all posted jobs, track applications, and view applicant CVs in one centralized dashboard."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-6 bg-slate-800/90 border border-slate-600 text-slate-50 hover:border-sky-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="p-3 rounded-lg bg-sky-900/60 text-sky-400 w-fit mb-4">
        {icon}
      </div>
      <h4 className="text-xl font-semibold mb-2 text-slate-50">{title}</h4>
      <p className="text-sm text-slate-200 leading-relaxed">{description}</p>
    </Card>
  );
}

function Briefcase({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3v18M3 12h18M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  );
}
