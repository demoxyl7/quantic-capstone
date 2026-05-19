QUANTIC CAREER ASSISTANT AI 🚀
Production-Grade Career Optimization Platform

Quantic Career Assistant Ai is a state-of-the-art career optimization SaaS engineered to bridge the gap between job applicants and Modern Applicant Tracking Systems (ATS). The system architecture pairs a high-performance, asynchronous **FastAPI backend microservice** with an ultra-responsive **Next.js 16 (React 19) frontend client**. 

The application empowers candidates with real-time match analysis, deep skill-gap mapping, automated document conversion, and hyper-targeted cover letter generation—backed by an enterprise telemetry engine built to scale securely for real-world users.

---

🌟 KEY FEATURES

Verbatim CV Extraction & Match Analysis: Leverages advanced Large Language Models (LLMs) to scan resumes against target Job Descriptions, returning an objective match score (0-100%) and parsing structured segments without information hallucination.
Targeted Improvement Recommendations: Automatically generates exactly 5 strategic content adjustments mapped to precise elements (`target_id`) in the resume to instantly boost ATS performance.
Dynamic Upskilling Paths: Identifies discrepancies between candidate profiles and job requirements, outputting dedicated course topic recommendations to proactively close skill gaps.
Hyper-Customized Cover Letters: Synthesizes technical achievements with targeted business values to produce professional, high-impact cover letters optimized under 350 words.
Edge Document Processing: Built-in client-side and server-side utilities to transition seamlessly between PDF and DOCX formats using asynchronous streaming.
Enterprise Telemetry & Usage Logging: Secure, automated tracking of transactional queries (IP address routing, timestamps, and data volume caching) powered by a high-performance serverless PostgreSQL instance.

---

🛠️ ARCHITECTURE & TECH STACK


                 ┌────────────────────────────────┐
                 │    Next.js 16 Client (UI)      │
                 └───────────────┬────────────────┘
                                 │
                    HTTP Requests / File Streams
                                 │
                                 ▼
                 ┌────────────────────────────────┐
                 │     FastAPI Backend (API)      │
                 └─────┬────────────────────┬─────┘
                       │                    │
            SQL Logs   │                    │   Inference
                       ▼                    ▼
        ┌───────────────────────┐    ┌───────────────────────┐
        │   Neon Serverless     │    │ Groq Inference Engine │
        │     PostgreSQL        │    │  (Llama 3.3 / 3.1)    │
        └───────────────────────┘    └───────────────────────┘
		
Frontend Layer
Framework: Next.js 16 (App Router Architecture) & React 19 optimized with next/font for high-performance typographic rendering.

State Management: React Query (@tanstack/react-query v5) for optimal server-state caching.

Styling: Tailwind CSS v4 featuring ultra-modern, utility-first user interface controls.

Document Manipulation: Browser-based processing via mammoth, docx, and jszip to enable local file reads and generations.

Persistence: idb-keyval (IndexedDB wrapping) for persistent local session storage against intentional/unintentional page reloads.

Backend Layer
API Framework: FastAPI (Asynchronous Python ASGI)

AI Inference Engine: Groq SDK

CV Analysis & Extraction: llama-3.3-70b-versatile (Strict JSON Mode enforcement)

Cover Letter Drafting: llama-3.1-8b-instant (Low-latency generation)

Database Client: psycopg2-binary for robust cloud PostgreSQL connectivity via connection pooling.

File Converter Engine: pdf2docx combined with Python native tempfile processing.

🧠 AI ENGINE & MODEL SELECTION (GROQ)

The intelligence layer of Quantic Career Assistant Ai is entirely powered by the Groq Inference Engine. Rather than relying on a single one-size-fittall AI model, the platform implements a Separation of Concerns and Cost Efficiency strategy by splitting tasks between two distinct, specialized models:

1. Match Analysis & Recommendations (llama-3.3-70b-versatile)
The Role: When a user requests a resume analysis, the backend routes the payload to this highly intelligent, heavy-duty 70-billion parameter model.

The Execution: The backend forces the model into Strict JSON Mode. Groq evaluates the data, scores it from 0-100%, maps missing skills, and creates exactly 5 highly specific improvement recommendations.

The Advantage: Structurally locked into JSON mode, it never returns conversational "fluff"—ensuring predictable, raw, structured data that the Next.js frontend can instantly render into beautiful dashboards.

2. Cover Letter Generation (llama-3.1-8b-instant)
The Role: When a user clicks "Generate Cover Letter," the backend hands the text over to this smaller, lightning-fast 8-billion parameter model.

The Execution: Cover letters do not require rigid JSON frameworks; they need fluid, creative, and professional prose. This model excels at processing context rapidly, synthesizing user achievements into a business narrative, and returning a polished, sub-350-word letter.

The Advantage: Low-latency text processing that delivers tailored application narratives in fractions of a second.

Production Optimization Insight 💡
By strategically splitting the workloads, the platform optimizes API token usage, drastically reduces server response times, and achieves elite-level AI capabilities without the need for expensive local GPU infrastructure.

📊 DATABASE TELEMETRY & USAGE LOGGING (NEON)

To transition this application from a local prototype to a production-grade SaaS platform, Quantic Career Assistant Ai features a secure, automated data-tracking pipeline powered by a serverless Neon PostgreSQL cluster. This pipeline acts as an internal audit log to monitor application traffic and track how effectively the AI model handles diverse datasets.

1. How the Telemetry Pipeline Works:
Automated Initialization (init_db): Upon backend startup, the FastAPI application extracts the DATABASE_URL environment variable and establishes an SSL-secured handshake (sslmode='require'). 
It runs atomic CREATE TABLE IF NOT EXISTS routines to ensure the data schema is live without breaking existing records.

2: Asynchronous Session Logging (log_usage): Every single time a user hits the /analyze endpoint, the system captures system analytics in real-time before sending the payload to Groq.

The Database Schemas:
1. usage_logs
Tracks overall request volume, timing metrics, and parsed payload footprints:

Column Name,Data Type,Purpose / Logic
id,SERIAL PRIMARY KEY,Auto-incrementing unique identifier for every transaction.
created_at,TIMESTAMP WITH TIME ZONE,Defaults to CURRENT_TIMESTAMP to accurately track user engagement times globally.
ip_address,TEXT,Captures request origin (resolving upstream headers via x-forwarded-for or falling back to the client host).
cv_preview,TEXT,Stores a truncated preview (strictly the first 500 characters) of the parsed CV text for audit purposes while keeping storage footprint lightweight.

2. ai_telemetry_logs
Tracks performance, token throughput, model routing parameters, and API latencies.

Production Optimization Insight 💡
Implementing this telemetry layer ensures that administrators can track API usage frequency, detect spamming IP addresses, and maintain a lightweight audit trail of the resumes being processed—all without compromising user security or inflating cloud storage costs.

📁 SYSTEM DIRECTORY STRUCTURE

CAPSTONE-PROJECT/
├── backend/                  # Python Virtual Environment & configurations
│   └── venv/
├── frontend/                 # Next.js 16 React Web Client
│   ├── src/
│   │   └── app/
│   │       └── page.tsx      # Main application workspace entry point
│   ├── package.json          # Node dependencies & environment configuration
│   └── tailwind.config.js
├── .env                      # Global Shared Environment Credentials (Git ignored)
├── main.py                   # Master FastAPI Endpoint Routing and Core Engine
└── requirements.txt          # Consolidated Python Dependency Specifications

⚙️ LOCAL ENVIRONMENT INSTALLATION

Prerequisites
Python 3.10+

Node.js 18+

Serverless Neon Account (or local PostgreSQL instance)

1. Environment Configuration
Initialize a .env configuration file in the root directory:

GROQ_API_KEY="your_groq_api_key_here"
DATABASE_URL="postgresql://[user]:[password]@[neon_host]/neondb?sslmode=require"

2. Backend Infrastructure Setup
From the project root directory, activate your isolated environment and fetch the packages:

# Activate the virtual environment (Windows)
.\backend\venv\Scripts\activate

# Activate the virtual environment (macOS/Linux)
source backend/venv/bin/activate

# Install required system dependencies
pip install -r requirements.txt

# Launch the FastAPI server
python main.py

The service initializes an atomic database sync routine and binds natively to http://127.0.0.1:8000.

3. Frontend Client Setup
Open a secondary terminal workspace, navigate to the client container, build, and boot:

# Navigate into the UI workspace
cd frontend

# Install client-side dependencies
npm install

# Boot up the local Next.js development engine
npm run dev

The local development web client resolves on port 3000: http://localhost:3000.

4. Local Database Management (pgAdmin 4 Setup)
To safely view or query production data locally using pgAdmin 4:

Create a new Server connection in pgAdmin.

In the Connection tab, map your host to your clean Neon host endpoint and set Maintenance database to neondb.

In the Parameters / SSL tab, set SSL mode to Require. (Neon rejects unencrypted connections).

🔗 CORE API BLUEPRINT REFERENCE

1. System Diagnostics
Endpoint: GET /

Functionality: Returns the application health status and cloud database accessibility verification.

2. Resume Optimization Pipeline
Endpoint: POST /analyze

Payload Schema: AnalysisRequest (cv_text, job_description)

Engine Routing: Feeds data strings to llama-3.3-70b-versatile under a rigid JSON structural contract.

Output Matrix: Matches skills, outputs a dynamic ATS score, logs telemetry, and provides atomic edit identifiers (target_id).

3. Content Assembly Engine
Endpoint: POST /generate-cover-letter

Payload Schema: CoverLetterRequest (cv_text, job_description)

Engine Routing: Evaluates structural attributes via llama-3.1-8b-instant. Returns an executive-ready application narrative.

4. Document Conversion Engine
Endpoint: POST /convert-pdf-to-docx

Payload Schema: Multipart/Form-Data (Binary File Upload)

Functionality: Intercepts volatile .pdf data, structures a temporary local directory target, parses contents via an automated abstract layout matrix, and pipes back an uncorrupted .docx download buffer.

🔒 SECURITY & DATA INTEGRITY

Strict Data Isolation: All resume uploads are converted in isolated volatile memory blocks (tempfile) and instantly erased upon stream termination.

Telemetry Data Scrubbing: To comply with standard data processing guidelines, user logging via log_usage limits database telemetry to the tracking IP address and strings truncated strictly to the first 500 characters of text.

Intelligent Document Validation: The AI layer features built-in type validation. If a non-CV document (e.g., a recipe or textbook chapter) is submitted, the system flags is_cv: false and triggers a structured error_message, preventing system crashes and conserving API token usage.

Cross-Origin Isolation: Configured with robust CORSMiddleware parameters preventing unauthorized network injections into the API framework.

🧪 AUTOMATED TESTING & CI/CD PIPELINE

To ensure the stability and reliability of the platform, the project includes a robust testing suite and automated integration pipeline:

Backend Integration Testing (test_main.py): Features rigorous test coverage for endpoint validation, multipart form data handling, and error response tracking.

Performance Benchmarking (test_benchmark.py): Automated benchmarking suites to track and optimize AI response latency and token throughput boundaries.

GitHub Actions Workflow (.github/workflows/main.yml): A continuous integration (CI) pipeline that automatically triggers on every push to the main branch, building the environment and running tests to ensure no breaking changes reach production.

