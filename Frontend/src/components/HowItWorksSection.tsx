import type React from "react";
import { Card } from "@/components/ui/card";
import { Users, Building2 } from "lucide-react";

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-24 px-4 bg-slate-950 border-t border-slate-800"
    >
      <div className="container mx-auto max-w-6xl">
        {/* العنوان الرئيسي */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            How it works
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Two connected services working together to create the perfect match.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* For Job Seekers */}
          <Card className="bg-slate-900/90 border border-sky-500/60 text-slate-50 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-sky-900/60">
                <Users className="h-6 w-6 text-sky-400" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold">
                For Job Seekers
              </h3>
            </div>

            <div className="space-y-6 text-sm md:text-base">
              <StepItem
                number={1}
                title="Create Your CV"
                description="Use our templates or customize your own. Fill in personal details, skills, education, experience, and add extra sections like projects or achievements."
              />
              <StepItem
                number={2}
                title="AI Analysis"
                description="Our AI model analyzes your CV content to identify the most relevant job descriptions based on your skills and experience."
              />
              <StepItem
                number={3}
                title="Get Matched"
                description="The AI enriches your CV with optimized keywords and displays real job openings from integrated APIs that match your profile."
              />
              <StepItem
                number={4}
                title="Apply Seamlessly"
                description="Apply directly through our platform. The entire process is seamless and intelligent, from creation to application."
              />
            </div>
          </Card>

          {/* For Companies */}
          <Card className="bg-slate-900/90 border border-slate-600 text-slate-50 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-sky-900/60">
                <Building2 className="h-6 w-6 text-sky-400" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold">For Companies</h3>
            </div>

            <div className="space-y-6 text-sm md:text-base">
              <StepItem
                number={1}
                title="Register & Setup"
                description="Create your company account and access a dedicated dashboard. Add your company information and branding."
              />
              <StepItem
                number={2}
                title="Post Jobs"
                description="Easily post job listings with detailed requirements. Manage all your active postings from one central location."
              />
              <StepItem
                number={3}
                title="AI Matching"
                description="Our AI automatically analyzes and recommends CVs that best match each job posting based on skills and requirements."
              />
              <StepItem
                number={4}
                title="Review & Hire"
                description="View applicants' AI-analyzed CVs, quickly identify the most suitable candidates, and manage the entire hiring process."
              />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function StepItem({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-slate-950 font-bold text-sm">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-base md:text-lg mb-1">{title}</h4>
        <p className="text-slate-200 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
