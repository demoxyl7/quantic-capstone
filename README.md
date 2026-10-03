QUANTIC CAREER ASSISTANT AI 🚀

Production-Grade Career Optimization Platform

Quantic Career Assistant AI is a production-oriented career optimization platform engineered to bridge the gap between job applicants and modern Applicant Tracking Systems (ATS).

The system architecture combines a high-performance, asynchronous **FastAPI backend** with an ultra-responsive **Next.js 16 / React 19 frontend client**. The application provides real-time CV-to-job matching, structured skill-gap analysis, targeted improvement recommendations, automated document conversion, and personalized cover-letter generation.

The AI inference layer is powered by the **Groq API** using **GPT-OSS models**, with model routing based on the complexity of each task. The platform also incorporates serverless PostgreSQL telemetry through **Neon** for usage monitoring and operational analytics.



🌟 KEY FEATURES

Verbatim CV Extraction & Match Analysis

Leverages large language models to analyze resumes against target Job Descriptions, returning an ATS-oriented match score, structured candidate information, skill alignment and identified gaps while minimizing unsupported information.

Targeted Improvement Recommendations

Generates targeted content improvements mapped to specific resume elements using `target_id` identifiers, helping candidates improve the relevance and quality of their applications.

Dynamic Upskilling Paths

Identifies discrepancies between candidate profiles and job requirements and produces course-topic recommendations to help candidates address relevant skill gaps.

Hyper-Customized Cover Letters

Synthesizes candidate experience and job requirements into professional, targeted cover letters optimized to remain under 350 words.

Document Processing

Provides PDF and DOCX processing utilities for extracting and converting candidate documents through asynchronous backend processing.

Enterprise Telemetry & Usage Logging

Captures application usage and AI processing telemetry through a serverless Neon PostgreSQL database for operational monitoring, usage analysis and troubleshooting.



🛠️ ARCHITECTURE & TECH STACK


             ┌────────────────────────────────────┐
             │      Next.js 16 Client (UI)        │
             │       React 19 / TypeScript        │
             └──────────────────┬─────────────────┘
                                │
                   HTTP Requests / File Streams
                                │
                                ▼
             ┌────────────────────────────────────┐
             │       FastAPI Backend (API)        │
             │          Python 3.11+              │
             └──────────────┬─────────────┬───────┘
                            │             │
                  SQL Logs  │             │  AI Inference
                            ▼             ▼
              ┌───────────────────┐  ┌─────────────────────────┐
              │ Neon Serverless   │  │   Groq Inference       │
              │ PostgreSQL        │  │       Engine            │
              │                   │  │                         │
              │ Usage & Telemetry │  │ GPT-OSS 120B            │
              │                   │  │ GPT-OSS 20B             │
              └───────────────────┘  └─────────────────────────┘


Frontend Layer

Framework: Next.js 16 using the App Router architecture with React 19 and TypeScript.

State Management: React Query (`@tanstack/react-query` v5) for server-state management and caching.

Styling: Tailwind CSS v4 for responsive, utility-first interface development.

Document Manipulation: Browser-based processing using libraries including `mammoth`, `docx`, and `jszip`.

Persistence: idb-keyval for IndexedDB-based local session persistence.

Backend Layer

API Framework: FastAPI using asynchronous Python ASGI architecture.

AI Inference Engine: Groq SDK / Groq API.

CV Analysis & Extraction: openai/gpt-oss-120b using structured JSON output for analysis responses.

Cover Letter Generation: openai/gpt-oss-20b for targeted application narrative generation.

Database Client: PostgreSQL connectivity through the Python PostgreSQL client stack.

File Conversion Engine: pdf2docx combined with Python temporary-file processing.

Database Layer

Database: Neon Serverless PostgreSQL.

Primary Uses:

* Application usage logging
* AI telemetry
* Request timing
* Token and model-routing telemetry
* Operational analytics

Deployment Layer

Frontend / Application Deployment: Vercel.

Source Control: GitHub.

Production Database: Neon Serverless PostgreSQL.

AI Inference: Groq Cloud.



🧠 AI ENGINE & MODEL SELECTION

The intelligence layer of Quantic Career Assistant AI is powered by the **Groq inference platform** using GPT-OSS models.

Rather than relying on a single model for every operation, the application uses task-specific model routing. This separates structured analytical workloads from content-generation workloads.

1. Match Analysis & Recommendations — GPT-OSS 120B

Model:


openai/gpt-oss-120b


Role:

Used for the primary CV and Job Description analysis workflow.

The model processes candidate and job-description information to support:

* Resume information extraction
* Job requirement analysis
* Candidate/job matching
* ATS-oriented scoring
* Skill-gap identification
* Targeted improvement recommendations

The analysis workflow uses structured response requirements so that the backend can validate and process the resulting data reliably before returning it to the Next.js frontend.

2. Cover Letter Generation — GPT-OSS 20B

Model:


openai/gpt-oss-20b


Role:

Used for personalized cover-letter generation.

The model receives the relevant candidate CV information and target Job Description and produces a concise, professional application narrative.

The cover-letter workflow does not require the same structured analytical response format as the CV analysis pipeline, allowing the model to focus on producing natural, contextually relevant prose.

3. Grounding & Validation

The application also uses the lighter GPT-OSS model where appropriate for supporting validation and grounding-related processing.

This provides an additional layer for checking generated content against the supplied candidate information and job requirements.

Production Model Routing

                         ┌─────────────────────────┐
                         │     FastAPI Backend     │
                         └────────────┬────────────┘
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                         ▼                         ▼
                ┌──────────────────┐     ┌──────────────────┐
                │ CV / JD Analysis │     │ Cover Letter     │
                │ Matching         │     │ Generation       │
                │ Scoring          │     │                  │
                │ Recommendations  │     │                  │
                └────────┬─────────┘     └────────┬─────────┘
                         │                        │
                         ▼                        ▼
                ┌──────────────────┐     ┌──────────────────┐
                │ GPT-OSS 120B     │     │ GPT-OSS 20B      │
                │                  │     │                  │
                │ openai/gpt-oss-  │     │ openai/gpt-oss-  │
                │ 120b             │     │ 20b              │
                └────────┬─────────┘     └────────┬─────────┘
                         │                        │
                         └────────────┬───────────┘
                                      ▼
                           ┌─────────────────────┐
                           │    Groq Cloud       │
                           │  Inference Platform │
                           └─────────────────────┘


Model Migration

The initial implementation of the application used Llama models through the Groq API.

During the production lifecycle, the previously configured Llama models were retired. The application therefore required an inference-layer migration to maintain the availability of the AI-powered analysis and cover-letter functionality.

The application was migrated to **GPT-OSS models** while retaining the Groq API integration.

The current production configuration is:

| Application Function              | Current Model         |
| --------------------------------- | --------------------- |
| CV / Job Description Analysis     | openai/gpt-oss-120b |
| Matching & Scoring                | openai/gpt-oss-120b |
| Improvement Recommendations       | openai/gpt-oss-120b |
| Cover Letter Generation           | openai/gpt-oss-20b  |
| Grounding / Supporting Validation | openai/gpt-oss-20b  |

This migration preserved the application's model-routing architecture while replacing the retired model dependencies.



📊 DATABASE TELEMETRY & USAGE LOGGING — NEON

To transition the application from a local prototype to a production-oriented SaaS platform, Quantic Career Assistant AI incorporates a secure usage-tracking pipeline powered by **Neon Serverless PostgreSQL**.

The telemetry layer provides an internal operational record for monitoring application traffic, AI processing and usage characteristics.

1. Automated Database Initialization

Upon backend startup, the FastAPI application reads the DATABASE_URL environment variable and establishes a secure PostgreSQL connection.

The application initializes the required database structures without overwriting existing records.

2. Usage Logging

When users interact with the analysis functionality, the backend records relevant operational telemetry before processing the AI request.

The telemetry layer is designed to provide visibility into:

* Request volume
* Request timestamps
* Request origin
* CV processing activity
* AI model routing
* Token usage
* API latency
* Processing characteristics

Database Schemas

usage_logs

Tracks application request activity.

| Column       | Data Type                | Purpose                                                |
| ------------ | ------------------------ | ------------------------------------------------------ |
| id         | SERIAL PRIMARY KEY       | Unique transaction identifier                          |
| created_at | TIMESTAMP WITH TIME ZONE | Records request time                                   |
| ip_address | TEXT                     | Records request origin                                 |
| cv_preview | TEXT                     | Stores a truncated CV preview for operational auditing |

ai_telemetry_logs

Tracks AI processing information including model routing, token throughput and API latency.

Production Optimization Insight

The telemetry layer provides administrators with operational visibility into application usage and AI processing while keeping stored document content limited and lightweight.


📁 SYSTEM DIRECTORY STRUCTURE


CAPSTONE-PROJECT/
├── backend/                  # Python environment & backend configuration
│   └── venv/
├── frontend/                 # Next.js 16 / React 19 web client
│   ├── src/
│   │   └── app/
│   │       └── page.tsx      # Main application workspace
│   ├── package.json          # Node dependencies & configuration
│   └── tailwind.config.js
├── .env                      # Environment credentials (Git ignored)
├── main.py                   # FastAPI routing and AI orchestration
└── requirements.txt          # Python dependencies




⚙️ LOCAL ENVIRONMENT INSTALLATION

Prerequisites

* Python 3.10+
* Node.js 18+
* Neon Serverless PostgreSQL account or local PostgreSQL instance
* Groq API key

1. Environment Configuration

Create a .env configuration file in the project root:


GROQ_API_KEY="your_groq_api_key_here"
DATABASE_URL="postgresql://[user]:[password]@[neon_host]/neondb?sslmode=require"


The application continues to use `GROQ_API_KEY` because the GPT-OSS models are accessed through the Groq API.



2. Backend Infrastructure Setup

From the project root, activate the Python environment:

Windows

powershell
.\backend\venv\Scripts\activate


macOS / Linux

bash
source backend/venv/bin/activate


Install dependencies:


pip install -r requirements.txt


Launch the FastAPI server:


python main.py


The backend starts on:


http://127.0.0.1:8000



3. Frontend Client Setup

Open a secondary terminal:


cd frontend


Install dependencies:


npm install


Start the development server:


npm run dev


The Next.js development client is available at:


http://localhost:3000




4. Local Database Management

To view or query production data locally using pgAdmin 4:

1. Create a new Server connection in pgAdmin.
2. Use the Neon host endpoint.
3. Set the maintenance database to neondb.
4. Configure SSL mode as Require.

Neon requires encrypted database connections.



🔗 CORE API BLUEPRINT

1. System Diagnostics

Endpoint:


GET /


Functionality:

Returns application health information and database accessibility status.



2. Resume Optimization Pipeline

Endpoint:


POST /analyze


Payload Schema:


AnalysisRequest


Contains:

* cv_text
* job_description

Engine Routing:

The backend routes the analysis request to:


openai/gpt-oss-120b


The model processes the CV and Job Description under the application's structured response contract.

Output:

* ATS-oriented match score
* Skill matching
* Skill gaps
* Recommendations
* Structured resume information
* target_id identifiers
* Telemetry information



3. Content Assembly Engine

Endpoint:


POST /generate-cover-letter


Payload Schema:


CoverLetterRequest


Contains:

* cv_text
* job_description

Engine Routing:

The backend routes cover-letter generation to:


openai/gpt-oss-20b


The endpoint returns a tailored application narrative designed to remain below the application's 350-word target.



4. Document Conversion Engine

Endpoint:


POST /convert-pdf-to-docx


Payload Schema:


Multipart/Form-Data


Functionality:

Processes PDF input using temporary file storage, converts the document to DOCX format, and returns the resulting document as a downloadable response.



🔒 SECURITY & DATA INTEGRITY

Strict Data Isolation

Resume files are processed through temporary storage and are removed after processing.

Telemetry Data Minimization

Operational logging limits stored CV content to a truncated preview rather than retaining the complete document.

Intelligent Document Validation

The AI processing layer validates whether submitted content represents an appropriate CV/resume before continuing with the full analysis workflow.

Invalid or inappropriate document submissions can be rejected through the application's structured validation response.

Cross-Origin Isolation

FastAPI CORSMiddleware is configured to control cross-origin access to the backend API.

Environment Secret Protection

API credentials and database connection strings are stored through environment variables and are excluded from source control through `.gitignore`.



🧪 AUTOMATED TESTING & CI/CD PIPELINE

The project includes automated testing and continuous integration mechanisms designed to reduce regressions during development and deployment.

Backend Integration Testing

Test file:


test_main.py


Provides testing around:

* API endpoint validation
* Request handling
* Multipart form-data processing
* Error handling
* Backend response validation

Performance Benchmarking

Test file:


test_benchmark.py


Provides automated benchmarking capabilities for evaluating AI processing behaviour, response latency and token-related boundaries.

Benchmark results should be interpreted according to the model configuration under which the tests were executed.

## GitHub Actions

The project includes a GitHub Actions workflow:


.github/workflows/main.yml


The CI pipeline is designed to execute automated checks when changes are pushed to the main branch.



🚀 PRODUCTION DEPLOYMENT

The production architecture consists of:


GitHub
   │
   │ Push to main
   ▼
Vercel
   │
   ├── Next.js / React Frontend
   │
   └── Production Application
          │
          ├──────────────► Neon PostgreSQL
          │
          └──────────────► Groq API
                              │
                              ├── GPT-OSS 120B
                              └── GPT-OSS 20B


The application source code is maintained in GitHub, with the production deployment connected to the repository through Vercel.



📌 CURRENT AI CONFIGURATION

| Component                        | Production Configuration   |
| -------------------------------- | -------------------------- |
| AI Provider / Inference Platform | Groq                       |
| Analysis Model                   | openai/gpt-oss-120b      |
| Cover Letter Model               | openai/gpt-oss-20b       |
| Backend                          | FastAPI / Python           |
| Frontend                         | Next.js 16 / React 19      |
| Database                         | Neon Serverless PostgreSQL |
| Deployment                       | Vercel                     |
| Source Control                   | GitHub                     |

The GPT-OSS migration replaced the previously configured Llama model dependencies while preserving the existing Groq-based inference architecture.


