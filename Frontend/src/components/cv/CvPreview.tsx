"use client";
import React from "react";

/* ================= TYPE DEFINITIONS ================= */

type SkillCategory = {
  category: string;
  items: string;
};

type Education = {
  degree?: string;
  school?: string;
  title?: string;
  from?: string;
  to?: string;
  location?: string;
  desc?: string;
};

type Experience = {
  role?: string;
  company?: string;
  location?: string;
  from?: string;
  to?: string;
  tasks?: string[];
  desc?: string;
  details?: string;
  description?: string;
  text?: string;
  summary?: string;
};

type Project = {
  title?: string;
  subtitle?: string;
  desc?: string;
  from?: string;
  to?: string;
  location?: string;
};

type CustomSectionItem = {
  title?: string;
  subtitle?: string;
  details?: string;
  key_achievements?: string[];
  from?: string;
  to?: string;
  location?: string;
};

type CustomSection = {
  section_name?: string;
  items?: CustomSectionItem[];
  subtitle?: string;
  details?: string;
};

type CVData = {
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
  objective?: string;
  skills?: SkillCategory[] | string[] | string;
  educations?: Education[];
  experiences?: Experience[];
  projects?: Project[];
  custom_sections?: CustomSection[];
};

/* ================= UTILITY FUNCTIONS ================= */

const normalizeSkills = (skills: any): SkillCategory[] => {
  if (!skills) return [];

  if (Array.isArray(skills)) {
    return skills
      .filter((s) => s != null)
      .map((s: any) => ({
        category: typeof s === "object" && s ? (s.category || "Skills") : "Skills",
        items: typeof s === "object" && s ? (s.items || "") : String(s || ""),
      }))
      .filter((s) => s.items.trim().length > 0 || s.category.trim().length > 0);
  }

  if (typeof skills === "string" && skills.trim().length > 0) {
    return [{ category: "Skills", items: skills }];
  }

  return [];
};

const extractBulletPoints = (exp: Experience): string[] => {
  const bulletSources: string[] = [];
  const possibleKeys: (keyof Experience)[] = ["tasks", "desc", "details", "description", "text", "summary"];

  possibleKeys.forEach((key) => {
    const val = exp[key];
    if (!val) return;

    if (Array.isArray(val)) {
      val.forEach((v) => {
        if (typeof v === "string") bulletSources.push(v);
      });
    } else if (typeof val === "string") {
      bulletSources.push(val);
    }
  });

  return bulletSources;
};

/* ================= SECTION COMPONENT ================= */

/* ================= SECTION COMPONENT ================= */

export function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-2">
      <h2 className="uppercase font-bold text-[10px] tracking-[0.18em] text-gray-900 border-b border-gray-700 pb-0.5 mb-1">{title}</h2>
      {children}
    </section>
  );
}

/* ================= SMALL UI COMPONENTS ================= */

const Separator = () => <span className="opacity-70 mx-1">|</span>;

const DateRangeEditable = ({
  from,
  to,
  showPlaceholder,
}: {
  from?: string;
  to?: string;
  showPlaceholder?: boolean;
}) => (
  <span className="text-[9px] text-gray-700 whitespace-nowrap">
    {from || (showPlaceholder ? "From" : "")}
    {((from && to) || showPlaceholder) && " - "}
    {to || (showPlaceholder ? "To" : "")}
  </span>
);

/* ================= MAIN SECTIONS ================= */

const CVHeader = ({
  cv,
}: {
  cv: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website: string;
  };
}) => {
  const isGithub = cv.website && cv.website.toLowerCase().includes("github.com");

  return (
    <header className="text-center mb-1">
      <h1 className="text-[18px] font-bold tracking-wide uppercase">
        {cv.first_name || "FIRSTNAME"} {cv.last_name || "LASTNAME"}
      </h1>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[9px] text-gray-800">
        {cv.location && (
          <>
            <span className="whitespace-nowrap">{cv.location}</span>
            {(cv.phone || cv.email || cv.linkedin || cv.website) && <Separator />}
          </>
        )}

        {cv.phone && (
          <>
            <span className="whitespace-nowrap">{cv.phone}</span>
            {(cv.email || cv.linkedin || cv.website) && <Separator />}
          </>
        )}

        {cv.email && (
          <>
            <a href={`mailto:${cv.email}`} className="whitespace-nowrap underline text-blue-600">
              {cv.email}
            </a>
            {(cv.linkedin || cv.website) && <Separator />}
          </>
        )}

        {cv.linkedin && (
          <>
            <a
              href={cv.linkedin.startsWith("http") ? cv.linkedin : `https://${cv.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap underline text-blue-600"
            >
              LinkedIn
            </a>
            {cv.website && <Separator />}
          </>
        )}

        {cv.website && (
          <a
            href={cv.website.startsWith("http") ? cv.website : `https://${cv.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap underline text-blue-600"
          >
            {isGithub ? "GitHub" : "Website"}
          </a>
        )}
      </div>
    </header>
  );
};

const EducationSection = ({
  educations,
}: {
  educations: Education[];
}) => (
  <Section title="EDUCATION">
    {educations.map((edu, i) => (
      <div key={i} className="mb-2">
        <div className="flex justify-between gap-4">
          <div className="min-w-0">
            {edu.school && <p className="uppercase tracking-[0.16em] text-[9px] font-bold">{edu.school}</p>}
            {(edu.degree || edu.title) && <p className="italic text-[10px] text-gray-900">{edu.degree || edu.title}</p>}
          </div>

          {(edu.from || edu.to || edu.location) && (
            <div className="flex flex-col items-end text-right">
              <DateRangeEditable
                from={edu.from}
                to={edu.to}
                showPlaceholder={false}
              />
              {edu.location && <span className="text-[9px] text-gray-700">{edu.location}</span>}
            </div>
          )}
        </div>

        {edu.desc && (
          <p className="mt-0.5 text-[10px]">
            <span className="font-semibold">Relevant Coursework: </span>
            {edu.desc}
          </p>
        )}
      </div>
    ))}
  </Section>
);

const ExperienceSection = ({
  experiences,
}: {
  experiences: Experience[];
}) => (
  <Section title="EXPERIENCE">
    {experiences.map((exp, i) => {
      const bulletSources = extractBulletPoints(exp);

      return (
        <div key={i} className="mb-2">
          <div className="flex justify-between gap-4">
            <div className="min-w-0">
              {exp.company && <p className="uppercase tracking-[0.16em] text-[9px] font-bold">{exp.company}</p>}
              {exp.role && <p className="italic text-[10px] text-gray-900">{exp.role}</p>}
            </div>

            {(exp.from || exp.to || exp.location) && (
              <div className="flex flex-col items-end text-right">
                <DateRangeEditable
                  from={exp.from}
                  to={exp.to}
                  showPlaceholder={false}
                />
                {exp.location && <span className="text-[9px] text-gray-700">{exp.location}</span>}
              </div>
            )}
          </div>

          {Array.isArray(exp.tasks) && exp.tasks.length > 0 && (
            <ul className="mt-0.5 text-[10px] list-none pl-0">
              {exp.tasks
                .filter((task) => task != null && task.trim())
                .map((task, taskIndex) => (
                  <li key={taskIndex} className="mb-0.5 flex items-start">
                    <span className="mr-1.5 text-gray-900">●</span>
                    <span>{task}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      );
    })}
  </Section>
);

const ProjectsSection = ({
  projects,
}: {
  projects: Project[];
}) => (
  <Section title="PROJECTS">
    {projects.map((project, i) => (
      <div key={i} className="mb-3">
        <div className="flex justify-between gap-4">
          <div className="min-w-0">
            <p className="font-bold text-[10px]">{project.title || "Project"}</p>
            {project.subtitle && <p className="italic text-[9px] text-gray-800">{project.subtitle}</p>}
          </div>

          {(project.from || project.to || project.location) && (
            <div className="flex flex-col items-end text-right">
              <DateRangeEditable
                from={project.from}
                to={project.to}
                showPlaceholder={false}
              />
              {project.location && <span className="text-[9px] text-gray-700">{project.location}</span>}
            </div>
          )}
        </div>

        {project.desc && <p className="mt-0.5 text-[10px]">{project.desc}</p>}
      </div>
    ))}
  </Section>
);

const CustomSectionsDisplay = ({
  customSections,
}: {
  customSections: CustomSection[];
}) => (
  <>
    {customSections.map((section, i) => (
      <Section
        key={i}
        title={section.section_name || "CUSTOM SECTION"}
      >
        <div className="mb-4">
          {Array.isArray(section.items) ? (
            section.items
              .filter((item) => item != null)
              .map((item, k) => (
                <div key={k} className="mb-2">
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0">
                      {item?.title && <p className="font-bold text-[10px]">{item.title}</p>}
                      {item?.subtitle && <p className="italic text-[9px] text-gray-800">{item.subtitle}</p>}
                    </div>

                    {(item?.from || item?.to || item?.location) && (
                      <div className="flex flex-col items-end text-right">
                        <DateRangeEditable
                          from={item?.from}
                          to={item?.to}
                          showPlaceholder={false}
                        />
                        {item?.location && <span className="text-[9px] text-gray-700">{item.location}</span>}
                      </div>
                    )}
                  </div>

                  {/* Key Achievements are now an array - each achievement on a separate line with bullet */}
                  {item?.key_achievements && Array.isArray(item.key_achievements) && item.key_achievements.length > 0 && (
                    <ul className="mt-0.5 text-[10px] list-none pl-0">
                      {item.key_achievements
                        .filter((achievement) => achievement != null && achievement.trim() !== "")
                        .map((achievement, achievementIndex) => (
                          <li key={achievementIndex} className="mb-0.5 flex items-start">
                            <span className="mr-1.5 text-gray-900">●</span>
                            <span>{achievement}</span>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ))
          ) : (
            <>
              {section.subtitle && <p className="italic text-[9px] text-gray-800">{section.subtitle}</p>}
              {section.details && <p className="text-[10px] mt-0.5">{section.details}</p>}
            </>
          )}
        </div>
      </Section>
    ))}
  </>
);

const SkillsSection = ({
  skills,
}: {
  skills: SkillCategory[];
}) => {
  // Filter out null/undefined skills and ensure valid structure
  const validSkills = (skills || []).filter((skill) => skill != null && (skill.category || skill.items));

  if (validSkills.length === 0) return null;

  return (
    <Section title="SKILLS">
      <div className="flex flex-col gap-2">
        {validSkills.map((skillGroup, idx) => {
          const category = skillGroup?.category || "Skills";
          const items = skillGroup?.items || "";

          return (
            <div key={idx} className="mb-1">
              <p className="text-[10px]">
                <span className="font-semibold">{category}: </span>
                <span>{items}</span>
              </p>
            </div>
          );
        })}
      </div>
    </Section>
  );
};

/* ================= MAIN COMPONENT ================= */

const CvPreviewComp = ({ data }: { data: CVData }) => {
  const cv = {
    first_name: data.first_name || data.firstName || "",
    last_name: data.last_name || data.lastName || "",
    email: data.email || "",
    phone: data.phone || "",
    location: data.location || "",
    linkedin: data.linkedin || "",
    website: data.website || "",
    objective: data.objective || "",
    skills: normalizeSkills(data.skills),
    educations: data.educations || [],
    experiences: data.experiences || [],
    projects: data.projects || [],
    custom_sections: data.custom_sections || [],
  };

  return (
    <div className="relative w-full">
      <div
        className="mx-auto bg-white text-black px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 border border-gray-300 shadow-sm"
        style={{
          fontFamily: '"Times New Roman", Georgia, serif',
          fontSize: "10px",
          lineHeight: 1.3,
        }}
      >
        <CVHeader cv={cv} />

        {cv.objective && (
          <Section title="SUMMARY">
            <p className="text-[10px]">{cv.objective}</p>
          </Section>
        )}

        {cv.educations.length > 0 && <EducationSection educations={cv.educations} />}

        {cv.experiences.length > 0 && <ExperienceSection experiences={cv.experiences} />}

        {cv.projects.length > 0 && <ProjectsSection projects={cv.projects} />}

        {cv.custom_sections.length > 0 && (
          <CustomSectionsDisplay customSections={cv.custom_sections} />
        )}

        {cv.skills.length > 0 && <SkillsSection skills={cv.skills} />}
      </div>
    </div>
  );
};

const CvPreview = React.memo(CvPreviewComp);
export default CvPreview;
