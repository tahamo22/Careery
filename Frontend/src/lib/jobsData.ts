// بيانات مؤقتة لحد ما يتربط بالـ API
export const jobsData = [
  {
    id: "1", // 👈 string
    title: "Interaction Designer",
    company: "Samsung Electronics",
    location: "Assiut, Egypt",
    type: "Part-time",
    source: "Company",
    logo: "/user/navbar/google.png",
    description: `
We are looking for a talented Interaction Designer. 
Responsibilities:
- Create wireframes and prototypes
- Collaborate with dev team for implementation
- Conduct usability testing
    `,
    overview: {
      posted: "14 Jun, 2025",
      expire: "14 Aug, 2025",
      level: "Mid Level",
      salary: "$3k - $5k / month",
      education: "Bachelor's Degree"
    }
  },
  {
    id: "2",
    title: "Software Engineer",
    company: "Apple Inc.",
    location: "Port Said, Egypt",
    type: "Full-time",
    source: "LinkedIn", // خارجي
    logo: "/user/navbar/apple.png",
    description: `
Join Apple’s engineering team and work on exciting projects with global impact.
Responsibilities:
- Write clean, maintainable code
- Participate in code reviews
- Work on performance optimization
    `,
    overview: {
      posted: "05 Jul, 2025",
      expire: "05 Sep, 2025",
      level: "Junior Level",
      salary: "$5k - $7k / month",
      education: "Bachelor's Degree"
    },
    link: "https://www.linkedin.com/jobs/view/123"
  },
  {
    id: "3",
    title: "Front End Developer",
    company: "Facebook Inc.",
    location: "Alexandria, Egypt",
    type: "Part-time",
    source: "Wuzzuf",
    logo: "/user/navbar/facebook.png",
    description: `
We are hiring a Front End Developer with React and Next.js experience.
Responsibilities:
- Build scalable UI components
- Ensure responsive design
- Work with APIs and GraphQL
    `,
    overview: {
      posted: "01 Jul, 2025",
      expire: "01 Sep, 2025",
      level: "Mid Level",
      salary: "$4k - $6k / month",
      education: "Bachelor's Degree"
    },
    link: "https://wuzzuf.net/jobs/456"
  },
  {
    id: "4",
    title: "Data Analyst",
    company: "Microsoft",
    location: "Dubai, UAE",
    type: "Remote",
    source: "Forasna",
    logo: "/user/navbar/microsoft.png",
    description: `
Microsoft is seeking a Data Analyst who will transform raw data into meaningful insights. 
You should be comfortable with SQL, Python, and visualization tools like Power BI.
Responsibilities:
- Clean and analyze large datasets
- Create dashboards and reports
- Work with business teams for decision making
    `,
    overview: {
      posted: "10 Jul, 2025",
      expire: "10 Sep, 2025",
      level: "Entry Level",
      salary: "$2k - $4k / month",
      education: "Graduation"
    },
    link: "https://forasna.com/jobs/456"
  }
];
