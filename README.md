# Careery: Smart AI-Driven Hiring Platform 🚀

**Careery** is an end-to-end intelligent recruitment ecosystem designed to bridge the gap between job seekers and employers. By leveraging state-of-the-art **Generative AI** and **Computer Vision**, the platform automates CV analysis, provides personalized career roadmaps, and offers a multimodal AI interview coaching experience.

---

## 🧠 AI Models & Core Functionality

### 1. Intelligent CV Analyzer & Job Matcher
* **Model:** Fine-tuned **Llama 3-8B**.
* **Training:** Performant fine-tuning on a curated dataset of **30,000+ CVs** to specialize the model in professional semantic analysis and HR-specific context.
* **Key Capabilities:**
    * **Skill Extraction:** Automatically identifies core technical and soft skills.
    * **Gap Analysis:** Highlights weak areas and provides **keyword optimization** suggestions to improve ATS (Applicant Tracking System) compatibility.
    * **Career Roadmap:** Recommends the top 3 most suitable job roles and freelance opportunities based on the user's unique profile.
* **Hosting:** Integrated via **Hugging Face Hub** for seamless model versioning and deployment.

### 2. Multimodal AI Interview Trainer
* **Model:** **Qwen2-VL-2B-Instruct** (Vision-Language Model).
* **Functionality:** Analyzes recorded mock interview videos through a combination of visual and textual prompts.
* **Evaluation Metrics:**
    * **Communication Clarity:** Evaluates pace, tone, and vocal steadiness.
    * **Confidence & Professionalism:** Assesses posture, attire, and general demeanor.
    * **Body Language & Eye Contact:** Uses computer vision to track gaze focus and engagement level.
* **Feedback System:** Generates a comprehensive **Interview Performance Report** with specific strengths, weaknesses, and actionable tips for improvement.

### 3. Smart Job Aggregator
* Connected to multiple external APIs to fetch real-time **freelance projects** and **job listings**.
* Utilizes AI-driven job descriptions to ensure high-accuracy matching between user skills and active market vacancies.

---

## 🛠 Tech Stack

| Category | Technologies |
| :--- | :--- |
| **AI/ML** | Llama 3 (8B), Qwen2-VL, Hugging Face, LangChain |
| **Backend** | FastAPI (Python) |
| **DevOps** | Docker, Containerization |
| **Cloud/Hosting** | RunPod (GPU Cloud Computing) |
| **External APIs** | Job Boards & Freelance Platforms |

---

## 🏗 System Architecture & Deployment

The platform is architected for scalability and low-latency AI inference:

1.  **FastAPI Backend:** Bridges the AI models with the frontend/backend services, handling asynchronous requests for high efficiency.
2.  **Containerization:** All system components (AI Models, Backend, and Frontend) are fully **Dockerized** to ensure consistent deployment environments.
3.  **GPU Deployment:** Deployed on **RunPod** using dedicated GPU instances to handle the intensive compute requirements of the Llama 3 and Qwen2-VL models.
4.  **Integration:** The AI models are linked to the main platform logic via custom APIs, enabling a seamless user experience from CV upload to interview feedback.

---

## 📊 Sample AI Output: Interview Report

> **Confidence:** *Strengths:* "The candidate's vocal steadiness and perceived self-assurance are evident. Posture is upright and engaged."
>
> **Eye Contact:** *Strengths:* "The candidate's eyes are focused on the camera lens, indicating direct engagement with the process."
>
> **Tips for Improvement:** "The candidate could benefit from providing more context about their specific background and technical experience to help the interviewer understand their qualifications."

---

## 👨‍💻 Project Significance
* **For Job Seekers:** Personalized guidance and a safe environment to practice and improve interview skills.
* **For Employers:** Higher screening accuracy and reduced manual effort in the recruitment cycle.
* **Innovation:** Combines Large Language Models (LLMs) with Vision-Language Models (VLMs) to create a truly multimodal hiring assistant.
