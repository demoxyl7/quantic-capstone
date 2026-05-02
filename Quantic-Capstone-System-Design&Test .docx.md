# **Quantic — AI Career Assistant**

## **System Design & Testing Documentation**

Version: 2.0.0-f2d5814
Last Updated: 30 April 2026
Build Status: SUCCESS | CI: GitHub Actions

---

## **Table of Contents**

1. Technology Choices & Rationale
2. System Architecture & Design Patterns
3. Frontend Architecture
4. AI Prompt Engineering & Performance
5. Deployment Strategy & Cost Analysis
6. Testing Strategy
7. Error Handling & Edge Cases
8. Maintenance & Future Roadmap

---

## **1. Technology Choices & Rationale**

Every technology in this stack was selected to balance **developer velocity**, **cost efficiency**, and **production readiness** for a single-developer capstone project with real-world deployment constraints.

### **1.1 Backend — FastAPI (Python 3.11+)**

| Decision | Rationale |
| :--- | :--- |
| **FastAPI** over Flask/Django | Native async support, automatic OpenAPI docs, built-in request validation via Pydantic, and first-class JSON response handling. Ideal for an AI-centric API where every endpoint returns structured JSON. |
| **Pydantic v2** for data models | Compile-time schema validation enforces the contract between AI output and frontend consumption. 12 nested models (e.g. `CVStructured`, `AnalysisResponse`) guarantee type safety without manual parsing. |
| **Python 3.11+** | Required by FastAPI's modern type-hint features (`list[T]` syntax) and provides meaningful performance improvements over 3.9/3.10. |
| **Uvicorn** ASGI server | Lightweight, production-grade ASGI server with low memory overhead — critical for Render Free Tier's 512 MB constraint. |

### **1.2 Frontend — Next.js 16 / React 19 / TypeScript**

| Decision | Rationale |
| :--- | :--- |
| **Next.js 16** | Server-side rendering (SSR) for SEO metadata, file-based routing, and built-in font optimisation via `next/font/google`. Reduces boilerplate compared to a raw Vite + React setup. |
| **React 19** | Latest stable release with improved concurrent rendering and Server Components support. |
| **TypeScript (strict mode)** | Enforces type contracts across all 8 components and 10+ interfaces. Eliminates an entire class of runtime bugs — the `strict: true` compiler option is enabled in `tsconfig.json`. |
| **Tailwind CSS v4** | Utility-first CSS with a custom design-token theme (`@theme` block in `globals.css`). Enables rapid UI iteration while maintaining visual consistency across light/dark modes. |
| **Lucide React** | Tree-shakable icon library — only the 14 icons actually imported are bundled, keeping the client bundle small. |
| **Mammoth.js** | Client-side DOCX-to-text extraction avoids sending raw document binaries to the backend for text parsing, reducing server load and latency. |
| **idb-keyval** (IndexedDB) | Persists the original DOCX binary in the browser for potential future download/re-upload without re-uploading from disk. Lightweight wrapper (~1 KB) over the IndexedDB API. |

### **1.3 AI Engine — Groq + Llama 3.3 70B**

| Decision | Rationale |
| :--- | :--- |
| **Groq Inference Engine** | Hardware-accelerated LLM inference with sub-2s response times. Free tier provides sufficient quota for a capstone demo. |
| **Llama 3.3 70B Versatile** | Selected over smaller 8B variants due to *Reasoning Density* — smaller models struggle to maintain a valid nested JSON structure while simultaneously performing multi-step analysis (extraction + scoring + suggestions). The 70B model handles these parallel tasks without "forgetting" the schema. |
| **Llama 3.1 8B Instant** (cover letters) | Cover letter generation is a simpler single-output task with no structural constraints, so the faster/cheaper 8B model is used with `temperature=0.7` for creative variation. |
| **`json_object` response format** | Groq's structured output mode forces the LLM to validate JSON syntax before completing the stream, eliminating malformed-JSON crashes on the frontend. |

### **1.4 Database — PostgreSQL (Managed, Render)**

| Decision | Rationale |
| :--- | :--- |
| **PostgreSQL** over SQLite | Required for cloud deployment — SQLite's file-based storage doesn't persist across Render's ephemeral filesystem. |
| **psycopg2-binary** | Pre-compiled PostgreSQL adapter avoids the need for `libpq-dev` system dependencies in CI/CD and containerised environments. |
| **Single `usage_logs` table** | Minimalist telemetry schema — the application intentionally avoids user accounts, so a single audit table with IP, timestamp, and CV preview is sufficient. |

### **1.5 File Processing**

| Decision | Rationale |
| :--- | :--- |
| **pdf2docx** | Converts uploaded PDFs to DOCX server-side, normalising all input to a single format before client-side text extraction via Mammoth. |
| **Ephemeral `tempfile`** | Converted files are written to `/tmp`, processed, and immediately deleted — no persistent file storage required on the server. |

---

## **2. System Architecture & Design Patterns**

### **2.1 Architectural Pattern: Client–Server with AI Orchestration**

The system follows a **three-tier client–server architecture** with an AI inference layer acting as an external service:

``` txt
┌────────────────────┐     HTTPS/JSON       ┌────────────────────┐     gRPC      ┌──────────────┐
│   Next.js Client   │ ──────────────────►  │   FastAPI Server   │ ────────────► │  Groq Cloud  │
│  (Browser / SSR)   │ ◄──────────────────  │   (Python 3.11+)   │ ◄──────────── │  (Llama 3.3) │
└────────────────────┘                      └────────┬───────────┘               └──────────────┘
                                                     │
                                                     │  SQL (psycopg2)
                                                     ▼
                                            ┌──────────────────┐
                                            │  PostgreSQL DB   │
                                            │  (Render Managed)│
                                            └──────────────────┘
```

### **2.2 High-Level Component Map**

| Component | Technology | Responsibility |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4 | SPA with three-phase wizard UI (Analyze → Refine → Cover Letter) |
| **Backend (API)** | FastAPI, Python 3.11+, Pydantic v2 | Request routing, file conversion, AI orchestration, telemetry logging |
| **AI Engine** | Groq Cloud, Llama 3.3 70B / 3.1 8B | Structured CV/JD analysis and cover letter generation |
| **Database** | Managed PostgreSQL on Render | Persistent telemetry and usage audit logs |
| **Storage** | Ephemeral local filesystem + browser IndexedDB | Temporary PDF→DOCX conversion buffers; client-side DOCX caching |

### **2.3 Software & Architectural Patterns Used**

| Pattern | Where Applied | Reason |
| :--- | :--- | :--- |
| **Model–View–Controller (MVC)** | Backend: Pydantic models (M), FastAPI route handlers (C), JSON responses consumed by React (V) | Separates data validation, business logic, and presentation. Pydantic models act as the "Model" layer, enforcing the contract between AI output and frontend consumption. |
| **Component-Based Architecture** | Frontend: 8 React components (`UploadZone`, `JobDescriptionInput`, `ResultsDashboard`, `ExtractionCard`, `OptimizedCVEditor`, `AppSidebar`, `CircularProgress`, `CVRenderer`) | Each UI concern is encapsulated in a single-responsibility component with typed props. Promotes reuse and testability. |
| **Wizard / Multi-Step Pattern** | `page.tsx`: `Phase` state machine (`ANALYZE → REFINE → COVER_LETTER`) | Guides users through a sequential workflow, reducing cognitive overload. Phase transitions are controlled by a single `useState<Phase>` with guard conditions. |
| **Design Token System** | `globals.css`: `@theme` block defining 20+ CSS custom properties | Centralises colours, typography, spacing, and border-radius into tokens. Light/dark mode is a single `.dark` class override — no component-level branching. |
| **Graceful Degradation** | Database: `if not DATABASE_URL: return` guard in `init_db()` and `log_usage()` | The application continues to serve AI analysis even when the database is offline. Telemetry is "best-effort", not mission-critical. |
| **Repository Pattern (Simplified)** | `init_db()` and `log_usage()` functions encapsulate all SQL | All database access is isolated in two functions at the top of `main.py`. No raw SQL is scattered across route handlers. |
| **API Gateway / Facade** | `/analyze` endpoint orchestrates: input validation → telemetry logging → AI prompt construction → response parsing | A single endpoint abstracts the multi-step orchestration from the client. The frontend only sends CV text + JD and receives a fully structured response. |
| **Strategy Pattern (AI Models)** | `/analyze` uses `llama-3.3-70b-versatile`; `/generate-cover-letter` uses `llama-3.1-8b-instant` | Different AI models are selected based on task complexity, optimising for cost and latency per endpoint. |
| **CORS Middleware** | `app.add_middleware(CORSMiddleware, allow_origins=["*"])` | Enables cross-origin requests from the Next.js frontend (which runs on a different port/domain in both development and production). |

### **2.4 API Endpoints**

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| **/** | GET | Health check — returns `{ status, db }` for uptime monitoring |
| **/analyze** | POST | Accepts CV text + JD, orchestrates AI analysis, logs telemetry, returns structured scores, extraction, suggestions, and skill-gap courses |
| **/convert-pdf-to-docx** | POST | Accepts a PDF binary upload, converts to DOCX via pdf2docx, returns the DOCX binary |
| **/generate-cover-letter** | POST | Accepts CV text + JD, generates a tailored cover letter using Llama 3.1 8B |

### **2.5 Database Schema**

**Table: `usage_logs`** — Tracks application health, feature usage, and user engagement.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **id** | Serial | Primary Key | Unique identifier for each telemetry record |
| **created_at** | Timestamp | NOT NULL, Default: NOW() | Date/time of analysis request |
| **ip_address** | Text | NULL | Client IP, parsed from `X-Forwarded-For` headers |
| **cv_preview** | Text | NULL | First 500 characters of submitted CV for audit/debug |

### **2.6 Frontend Component Architecture**

``` txt
page.tsx (Phase State Machine)
├── AppSidebar          — Navigation + dark mode toggle
├── UploadZone          — Drag-and-drop file upload with PDF→DOCX conversion
├── JobDescriptionInput — Textarea for JD entry
├── ResultsDashboard    — Score visualisation, skill matching, learning path
│   └── CircularProgress — Animated SVG radial progress indicator
├── ExtractionCard (×2) — Side-by-side CV summary vs. JD requirements
├── OptimizedCVEditor   — AI suggestion cards with copy-to-clipboard workflow
└── CVRenderer          — Full structured CV preview
```

---

## **3. AI Prompt Engineering & Performance**

### **3.1 Structural Integrity — JSON Schema Enforcement**

To prevent frontend crashes from malformed AI output, a strict schema approach is used:

- **Response Format**: `json_object` mode forces the LLM to validate output against JSON syntax before completing the stream.
- **Skeleton Strategy**: The prompt explicitly defines the full nested JSON structure as an example, giving the model an empty "skeleton" to fill. This reduces the chance of omitting key-value pairs required by the 12 Pydantic models on the backend.

### **3.2 Token Efficiency & Context Management**

- **Input Truncation**: `cv_text[:6000]` and `job_description[:6000]` keeps the combined input within the model's most effective context window. Prevents "Lost in the Middle" degradation.
- **Latency Optimisation**: Llama 3.3 70B on Groq's LPU hardware minimises Time to First Token (TTFT). Full analysis typically completes in 1.2–1.8 seconds — critical for acceptable UX on Render Free Tier.

### **3.3 Multi-Step Prompt Design**

The `/analyze` prompt is structured as a 5-step chain-of-thought instruction:

1. **Extract** CV data verbatim (with ID assignment for cross-referencing)
2. **Parse** JD into structured fields
3. **Score** the match (0–100)
4. **Suggest** exactly 5 targeted improvements (referencing extracted IDs)
5. **Recommend** 3–4 skill-gap courses

This sequential instruction format leverages the 70B model's ability to follow multi-step procedures while maintaining output coherence.

### **3.4 Performance Metrics**

| Metric | Target | Actual (Observed) |
| :--- | :--- | :--- |
| **Analysis Latency** | < 3.0s | 1.2s – 1.8s |
| **JSON Parse Success** | 100% | 100% (with `json_object` mode) |
| **Suggestion Relevance** | > 90% | ~95% (suggestions reference valid target IDs) |
| **Memory Usage** | < 512 MB | ~240 MB (stable on Render Free Tier) |

### **3.5 Model Selection Rationale**

| Endpoint | Model | Reason |
| :--- | :--- | :--- |
| `/analyze` | Llama 3.3 70B Versatile | Multi-task reasoning: simultaneous extraction, scoring, and suggestion generation requires high reasoning density to maintain structural coherence across a ~2000-token JSON response. |
| `/generate-cover-letter` | Llama 3.1 8B Instant | Single-output creative text generation. No structural constraints — `temperature=0.7` for natural variation. Faster and cheaper for a simpler task. |

---

## **4. Deployment Strategy & Cost Analysis**

### **4.1 Current Deployment: Render (Cloud PaaS)**

| Service | Tier | Monthly Cost |
| :--- | :--- | :--- |
| **Backend (Web Service)** | Render Free Tier | $0 |
| **PostgreSQL Database** | Render Free Tier | $0 |
| **Frontend (Next.js)** | Vercel Free Tier / Render Static | $0 |
| **AI Inference** | Groq Free Tier | $0 |
| **Total** | | **$0/month** |

**Why Render Free Tier?**

- Zero-cost deployment for a capstone demo with low traffic
- Managed PostgreSQL included (no self-hosting overhead)
- Automatic deploys from GitHub `main` branch
- SSL/HTTPS included by default

**Trade-offs of Free Tier:**

- Cold start latency: 50–90 seconds after 15 minutes of inactivity
- Limited to 512 MB RAM, single CPU core
- Database expires after 90 days (requires recreation)

### **4.2 Recommended Production Deployment Options**

| Option | Provider | Est. Monthly Cost | Best For |
| :--- | :--- | :--- | :--- |
| **Cloud PaaS (Recommended)** | Render Pro / Railway | $7–$25/month | Small-to-medium traffic. Managed infrastructure, zero DevOps overhead. Auto-scaling on Render Pro ($7/service). |
| **Serverless** | AWS Lambda + API Gateway + RDS | $5–$30/month | Bursty/unpredictable traffic. Pay-per-invocation pricing. Cold starts mitigated by provisioned concurrency (~$15/month extra). |
| **Containerised (VPS)** | AWS EC2 / DigitalOcean Droplet | $6–$24/month | Full control, predictable pricing. Requires manual Docker setup, SSL (Let's Encrypt), and monitoring. |
| **On-Premises** | Self-hosted (university/corporate) | Hardware cost only | Strict data sovereignty requirements. Requires PostgreSQL installation, reverse proxy (nginx), and manual SSL management. Not recommended unless regulatory compliance mandates it. |

### **4.3 Cost Comparison Summary**

| Scenario | Cloud PaaS | Serverless | VPS | On-Premises |
| :--- | :--- | :--- | :--- | :--- |
| **Setup Complexity** | Low | Medium | High | Very High |
| **Monthly Cost (Low Traffic)** | $7 | $5 | $6 | $0 (hardware amortised) |
| **Monthly Cost (Medium Traffic)** | $25 | $15–30 | $24 | $0 |
| **Auto-Scaling** | Yes | Yes | Manual | Manual |
| **SSL/HTTPS** | Included | Included | Manual (Let's Encrypt) | Manual |
| **Cold Start** | ~2s (Pro) | ~3–5s (Lambda) | None | None |
| **Recommendation** | ✅ Best balance | Good for variable load | Good for predictable load | Only if required by policy |

**Recommendation**: For this application, **Cloud PaaS (Render Pro at $7/month)** offers the best balance of cost, simplicity, and performance. The application's architecture (single FastAPI process, stateless request handling) maps naturally to a PaaS model without requiring containerisation expertise.

---

## **5. Testing Strategy**

### **5.1 Testing Philosophy**

This project employs a **multi-layered testing approach** spanning automated CI checks, type-safety enforcement, and structured manual testing. Given the AI-centric nature of the application (where core business logic is delegated to an external LLM), the testing strategy prioritises **integration correctness** and **contract validation** over traditional unit testing of deterministic functions.

### **5.2 Automated Testing — CI/CD Pipeline (GitHub Actions)**

A continuous integration pipeline runs on every push and pull request to `main`:

**Workflow: `.github/workflows/main.yml`**

| Job | Steps | Purpose |
| :--- | :--- | :--- |
| **`backend-tests`** | Checkout → Python 3.10 setup → `pip install -r requirements.txt` → `pytest` | Validates that the backend dependencies install cleanly and all test assertions pass. Catches dependency conflicts and import errors on every commit. |
| **`frontend-build`** | Checkout → Node.js 20 setup → `npm install` → `npm run build` | Performs a **full production build** of the Next.js frontend. This implicitly runs TypeScript type-checking across all 8 components and 10+ interfaces, catching type errors, missing imports, and JSX issues. A successful build is a strong signal that the frontend is structurally sound. |

**Why `npm run build` is a meaningful test:**
Next.js production builds run the TypeScript compiler in strict mode (`"strict": true` in `tsconfig.json`). This means every build verifies:

- All component props conform to their declared interfaces
- No `any` types leak into the codebase (enforced by strict mode)
- All imports resolve correctly
- JSX elements reference valid HTML attributes and component props

### **5.3 Type-Safety as a Testing Layer**

TypeScript with `strict: true` acts as a continuous static analysis layer:

| Aspect | Coverage |
| :--- | :--- |
| **Backend Pydantic Models** | 12 nested models (`CVPersonalInfo`, `CVExperience`, `CVStructured`, `AnalysisResponse`, etc.) validate every field of the AI response at runtime. A malformed AI response raises a `ValidationError` before reaching the client. |
| **Frontend TypeScript Interfaces** | 10+ interfaces (`AnalysisResult`, `CVData`, `Suggestion`, `ExtractionData`, etc.) mirror the backend models, enforcing a compile-time contract between API responses and React component props. |
| **End-to-End Contract** | The Pydantic models (backend) and TypeScript interfaces (frontend) together form a **bilateral type contract**. Any schema drift (e.g., renaming `score` to `match_score`) would be caught at either the Python validation layer or the TypeScript compilation layer. |

### **5.4 Backend Unit Tests**

**File: `backend/test_main.py`** — executed by `pytest` in CI.

| Test Case | Objective | Status |
| :--- | :--- | :--- |
| **`test_health_check_logic`** | Validates baseline test infrastructure is functional | ✅ Pass |
| **`test_placeholder`** | Ensures pytest runner has at least one assertion to execute | ✅ Pass |

These tests serve as **smoke tests** — their primary purpose is to validate that the CI pipeline itself works, that all Python dependencies install correctly, and that the test runner executes without error. More granular tests for individual functions (e.g., `log_usage`, `init_db`) would require a test database, which is out of scope for the free-tier CI environment.

### **5.5 Integration & End-to-End Testing (Manual)**

Given the non-deterministic nature of LLM output, integration testing was performed manually and verified against expected structural contracts:

| Test Case | Objective | Method | Status |
| :--- | :--- | :--- | :--- |
| **PDF → DOCX Conversion** | Verify multi-page PDFs (≤3 pages) convert to valid DOCX without text loss | Manual upload of 5 test PDFs via the UI; verified extracted text matches source | ✅ Pass |
| **JSON Schema Integrity** | Validate Groq API returns well-formed JSON matching the Pydantic `AnalysisResponse` model | Submitted 10+ CV/JD pairs; verified no `json.JSONDecodeError` or Pydantic `ValidationError` in server logs | ✅ Pass |
| **Suggestion–ID Cross-Reference** | Verify each suggestion's `target_id` references a valid extracted CV element | Inspected 50+ suggestions across test runs; all `target_id` values resolved to extracted `exp_*`, `b_*`, `proj_*`, or `edu_*` IDs | ✅ Pass |
| **Database Telemetry Loop** | Confirm `/analyze` triggers a `usage_logs` INSERT before returning | Queried `usage_logs` after test requests; verified `ip_address` and `cv_preview` populated | ✅ Pass |
| **Database Offline Resilience** | Application serves requests when `DATABASE_URL` is unset | Started backend without `.env`; confirmed `/analyze` returns valid results and `DB Error` logged to stdout | ✅ Pass |
| **Non-CV Document Handling** | System detects and rejects non-CV content | Uploaded a recipe document; verified `is_cv: false` response and user-facing error banner | ✅ Pass |
| **Dark Mode Toggle** | UI theme switches between light and dark modes | Clicked sidebar toggle; verified all components render correctly in both themes | ✅ Pass |
| **Cover Letter Generation** | `/generate-cover-letter` returns coherent, role-specific text | Generated 5 cover letters; verified relevance to JD and professional tone | ✅ Pass |
| **Copy-to-Clipboard Workflow** | Refined suggestion text copies to system clipboard | Clicked "Copy Improved Text" on all 5 suggestions; verified clipboard content | ✅ Pass |

### **5.6 Deployment / UAT Testing**

| Test Case | Metric | Result |
| :--- | :--- | :--- |
| **Cold Start Performance** | Render Free Tier boot time after sleep | 50–90s average |
| **Warm Request Latency** | End-to-end analysis response time (warm server) | 1.2–1.8s |
| **Memory Stability** | RAM usage under sustained requests (`WEB_CONCURRENCY=1`) | ~240 MB, stable (no memory leaks observed) |
| **Cross-Browser Compatibility** | Chrome, Safari, Firefox on macOS | All features functional; no rendering issues |
| **Mobile Responsiveness** | Viewport < 1024px (sidebar collapses, grid stacks) | Responsive layout verified on iPhone 15 Pro and iPad simulators |

### **5.7 Why Not More Automated Tests?**

| Consideration | Reasoning |
| :--- | :--- |
| **LLM non-determinism** | Core business logic (CV analysis, scoring, suggestions) is delegated to an external LLM. Traditional unit test assertions (`assertEqual(score, 75)`) are impossible because the same input produces different scores across runs. |
| **External API dependency** | The Groq API is a paid external service. Running automated integration tests in CI would require API key secrets and incur token costs per build. |
| **Type-safety coverage** | TypeScript strict mode + Pydantic models provide equivalent coverage to many unit tests — they catch type mismatches, missing fields, and schema drift at compile/validation time rather than at test-assertion time. |
| **Cost-benefit for capstone scope** | The CI pipeline (pytest + Next.js build) catches the highest-impact bugs (dependency breakage, type errors, import failures) at zero cost. Additional test infrastructure (test databases, API mocking) would add complexity disproportionate to the project's scope. |

---

## **6. Error Handling & Edge Cases**

| Scenario | Handling Strategy |
| :--- | :--- |
| **Database Offline** | Guard clause (`if not DATABASE_URL: return`) in `init_db()` and `log_usage()`. Logs warning to stdout, skips telemetry, continues serving requests. |
| **Malformed JSON from LLM** | `response_format: {"type": "json_object"}` enforced at the Groq API level. Additional `json.loads()` try/catch returns HTTP 500 with descriptive error. |
| **Non-CV Document Upload** | LLM instructed to set `is_cv: false` with an `error_message`. Frontend displays an error banner and prevents progression to the Refine phase. |
| **Invalid/Missing IP Header** | Fallback chain: `X-Forwarded-For` header → `request.client.host`. Handles both proxied (Render) and direct connections. |
| **Oversized Input** | CV and JD text truncated to 6,000 characters each before prompt construction. Prevents context window overflow and controls inference cost. |
| **PDF Conversion Failure** | Try/catch around `pdf2docx.Converter`. Temporary files cleaned up via `os.remove()` in both success and error paths. HTTP 500 returned with the error detail. |
| **AI Client Not Initialised** | Guard clause (`if not client`) at the top of both `/analyze` and `/generate-cover-letter`. Returns HTTP 500 with "AI Client not initialized" if the `GROQ_API_KEY` environment variable is missing. |
| **Frontend Network Error** | Try/catch around all `fetch()` calls in `page.tsx`. User-facing error banner displayed with "Cannot reach the server" message and a dismiss button. |

---

## **7. Maintenance & Future Roadmap**

| Item | Description | Priority |
| :--- | :--- | :--- |
| **Expanded Automated Tests** | Add pytest-based integration tests using `httpx.AsyncClient` to test FastAPI routes with mocked Groq responses | High |
| **Admin Dashboard** | Build a private route to visualise `usage_logs` metrics in-app | Medium |
| **User Authentication** | Migrate from IP-based telemetry to authenticated user tracking (OAuth 2.0 / NextAuth) | Medium |
| **Advanced Parsing** | Add OCR support for scanned/image-based PDFs via Tesseract | Low |
| **Rate Limiting** | Implement `slowapi` middleware to prevent abuse of the AI analysis endpoint | High |
| **Response Caching** | Cache AI responses by content hash to avoid redundant inference calls for identical CV/JD pairs | Medium |
