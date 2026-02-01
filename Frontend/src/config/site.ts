// src/config/site.ts
export const site = {
  name: "Mohamed Kohail",
  role: "Freelance Product Designer & Frontend Engineer",
  city: "Cairo · Dubai",
  skills: [
    "Next.js",
    "React",
    "TypeScript",
    "Tailwind",
    "shadcn/ui",
    "Framer Motion",
    "Node.js",
    "Django REST",
    "n8n",
    "Hugging Face",
    "PostgreSQL",
  ],
};

export function buildWhatsAppURL(message?: string) {
  const num = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  const base = `https://wa.me/${num}`;
  if (!message) return base;
  const q = encodeURIComponent(message);
  return `${base}?text=${q}`;
}

export const contacts = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@yourdomain.com",
  whatsapp: buildWhatsAppURL(
    "Hi Mohamed, I found your freelance page. I'd like to discuss a project (brief/budget/timeline)."
  ),
};
