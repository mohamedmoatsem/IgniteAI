# 🚀 IgniteAI — Multi-Agent Developer, Career & Content Accelerator

> **Empowering Developers, Founders, and Creators to Build Applications, Master Skills, and Launch AI-Powered Content Effortlessly.**

IgniteAI is a unified, multi-agent SaaS platform designed to streamline full-stack application creation, code debugging, asset generation, career alignment, and automated skill-to-video learning—fully localized for global markets with native RTL and dynamic i18n support.

---

## 🌟 Key Features & Core Modules

IgniteAI integrates five core AI-powered modules into a single, cohesive ecosystem:

### 1. ⚡ JumpStart (Idea to Blueprint)
* Converts raw product ideas into structured, actionable development blueprints instantly.
* Generates clear task boards (Kanban), tech stack recommendations, and execution timelines.
* Designed with clean UI component hierarchies to prevent state conflicts and ensure smooth board interactions.

### 2. 🧪 LiveLab (Real-Time Code & Debugging)
* AI-driven code explainers and live refactoring suite powered by Google Gemini models.
* Built-in Pomodoro productivity timer to keep developers focused during execution sessions.
* Real-time snippet analysis with syntax feedback and safety checks.

### 3. 🎨 Asset Reviver (Smart Content Transformation)
* File ingestion engine supporting `.csv`, `.xlsx`, `.pdf`, `.txt`, and `.md`.
* Automatically extracts and repurposes legacy content into marketing copy, documentation, or digital books.
* Streamlined background processing with visual status badges.

### 4. 💼 Career Catalyst (Context-Aware Job Matching)
* ATS-friendly resume parsing paired with targeted Cover Letter generation.
* **Unified DataHub Context Integration:** Dynamically injects verified real-world project portfolios—such as *Aman* (Crisis Psychological First Aid), *SyncSolar Systems* (IoT SCADA Monitoring), and *Namaa* (Smart Agriculture Ecosystem)—into generated job applications for hyper-personalized credibility.
* Built-in Kanban application tracker to manage candidate pipeline states seamlessly.

### 5. 🎓 EduPulse & YouTube AutoCreator Agent (EdTech & Automation)
* **Autonomous Learning Roadmaps:** Transforms any study topic or technical field into a structured, step-by-step learning path.
* **YouTube Knowledge Retrieval:** Queries the YouTube API to dynamically fetch, rank, and embed the highest-rated video tutorials for each specific roadmap unit.
* **Faceless Video Creation Engine:** Synthesizes generated lesson notes into YouTube Shorts/Video scripts, SEO-optimized titles, tags, and visual scene prompts for automated channel monetization.

---

## 🌐 Full i18n & RTL Support

* **Multi-Language Engine:** Built-in dynamic localization supporting **English, Arabic, French, Spanish, and German**.
* **First-Class RTL Layouts:** Complete bidirectional layout enforcement (`dir="rtl"`, mirrored margins/paddings, and auto text-alignment) tailored for seamless Arabic UI rendering.
* **Mobile Responsive Drawer:** Collapsible hamburger drawer navigation providing 100% usable canvas area on mobile viewports.

---

## 🏗️ Technical Architecture & DataHub Integration

┌──────────────────────────┐
│ User Inputs / Resumes    │
└────────────┬─────────────┘
│
▼
┌──────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────┐
│ Unified DataHub Context  │──►│ Multi-Agent Gemini Engine│◄──│ i18n & RTL Middleware    │
│ (Aman, SyncSolar, Namaa) │   └────────────┬─────────────┘   └──────────────────────────┘
└──────────────────────────┘                │
▼
┌──────────────────────────┐
│ Code, Blueprints, Career │
│   & YouTube Automation   │
└──────────────────────────┘

### Multi-Tenancy & Privacy Standard
IgniteAI employs a **Multi-Tenant User Isolation Model**:
* All project data, uploaded resumes, and user records are tightly scoped to the individual `userId`.
* **DataHub Privacy:** Pre-seeded project profiles serve as demonstration context for new user sessions. Once a user creates or links their own projects, private user records isolate and override demo data completely.

---

## 💰 Monetization & Business Model

IgniteAI is structured around a highly scalable B2C/B2B hybrid revenue system:

* **Freemium Plan (Starter):** Free access to basic JumpStart blueprints, limited daily LiveLab executions, and standard application tracking.
* **Pro Developer & Creator ($19/month):** Unlimited multi-agent invocations, priority Gemini API throughput, extended Asset Reviver file limits, deep DataHub context injections, and full YouTube script/automation exports.
* **Enterprise & Institutional Tier:** Custom deployment for universities, coding bootcamps, and corporate teams requiring dedicated privacy pipelines, custom LLM fine-tuning, and team analytics.

---

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Tailwind CSS, Lucide Icons, Radix UI.
* **AI & Intelligence Engine:** Google Gemini API (Multi-Agent Workflows).
* **Integrations:** YouTube Data API v3 (Educational Video Linking).
* **Internationalization:** Custom lightweight i18n framework with full RTL support.
* **Deployment & Environment:** Replit, Node.js API Server.

---

## 🚀 Getting Started

1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/your-username/ignite-ai.git](https://github.com/your-username/ignite-ai.git)
   cd ignite-ai
   2.Install Dependencies:
   npm install
3.Configure Environment Variables:
Create a .env file in the root directory and set your API keys:
GEMINI_API_KEY=your_gemini_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here
4.Run Development Server:
npm run dev
