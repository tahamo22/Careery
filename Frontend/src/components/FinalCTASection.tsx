import type React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Briefcase } from "lucide-react";
import Link from "next/link";

export function FinalCTASection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-sky-700/15 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Ready to transform your hiring or job search?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">Join thousands of job seekers and companies using AI to make smarter connections</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto ">
          <Link href="/auth/user/login">
            <CTACard
              icon={<FileText className="h-8 w-8  text-sky-500 " />}
              title="For Job Seekers"
              description="Create your AI-powered CV and get matched with your dream job"
              buttonText="Create Your CV Now"
              buttonVariant="default"
            />
          </Link>
          <Link href="/auth/company/login">
            <CTACard
              icon={<Briefcase className="h-8 w-8 text-sky-500" />}
              title="For Companies"
              description="Find the perfect candidates with AI-powered matching"
              buttonText="Find the Right Talent"
              buttonVariant="secondary"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

function CTACard({ icon, title, description, buttonText, buttonVariant }: { icon: React.ReactNode; title: string; description: string; buttonText: string; buttonVariant: "default" | "secondary" }) {
  return (
    <div className="p-8 rounded-xl border border-border bg-card/15 hover:border-accent/50 transition-colors">
      <div className="p-3 rounded-lg bg-sky-700/15 text-accent w-fit mb-4">{icon}</div>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 leading-relaxed">{description}</p>

      <Button variant={buttonVariant} className="w-full gap-2 group cursor-pointer">
        {buttonText}
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
}
