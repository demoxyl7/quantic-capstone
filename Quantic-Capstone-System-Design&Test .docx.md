# **Quantic Capstone**  

## **System Design & Testing Documentation**

Version: 1.2.0-b6af971  
Last Updated: 27 April 2026  
Build Status: SUCCESS | Telemetry: ACTIVE

## **Table of Contents**

1\. System Architecture Design

2\. Technical Specifications

3\. AI Prompt Engineering & Performance

4\. Testing Strategy

5\. Error Handling & Edge Cases

6\. Maintenance & Future Roadmap

## **1\. System Architecture Design**

Architecture Pattern: Client-Server-Database

Deployment Target: Cloud-native, optimized for AI-driven data processing

## **1.1 High-Level Components**

| Component | Technology Stack | Responsibility |
| :---- | :---- | :---- |
| **Frontend** | React, FastAPI Static Files | Web UI for CV upload, Job Description input, results display |
| **Backend (API)** | FastAPI, Python 3.11+ | Request routing, file conversion, AI orchestration, telemetry |
| **AI Engine** | Groq, Llama 3.3 70B | High-speed inference, structured JSON CV/JD analysis |
| **Database** | Managed PostgreSQL on Render | Persistent storage for usage telemetry and application logs |
| **Storage** | Ephemeral Local Filesystem | Temporary buffers for DOCX/PDF processing during request lifecycle |

## **2\. Technical Specifications**

## **2.1 Database Schema**

Table: usage\_logs

Purpose: Track application health, feature usage, and user engagement

| Field | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| **id** | Serial | Primary Key | Unique identifier for each telemetry record |
| **created\_at** | Timestamp | NOT NULL, Default: NOW() | Date/time of analysis request |
| **ip\_address** | Text | NULL | Client IP, parsed from X-Forwarded-For headers |
| **cv\_preview** | Text | NULL | First 500 characters of submitted CV for audit/debug |

## **2.2 API Endpoints**

| Endpoint | Method | Description |
| :---- | :---- | :---- |
| **/analyze** | POST | Accepts CV/JD, executes AI analysis, logs telemetry, returns structured scores |
| **/convert-pdf-to-docx** | POST | Converts binary PDF to DOCX using pdf2docx |
| **/apply-suggestions** | POST | Modifies DOCX XML nodes to apply AI-generated improvements |
| **/generate-cover-letter** | POST | Generates tailored cover letter based on CV content |

## **3\. AI Prompt Engineering & Performance**

Core Engine: Llama 3.3 70B via Groq Inference Engine

Performance is optimized through 3 primary techniques: Structured Output Enforcement, Context Window Management, and Instructional Weighting.

## **3.1 Structural Integrity – JSON Enforcement**

To prevent frontend crashes like the previous role error, we use a “Strict Schema” approach.

* • Response Format: json\_object mode forces the LLM to validate output against JSON syntax before finishing the stream.  
* • The “Folder” Strategy: Prompt explicitly defines the nested path extraction \-\> jd\_data \-\> role. Giving the model an empty “skeleton” to fill reduces chances of omitting key-value pairs required by the JavaScript frontend.

## **3.2 Token Efficiency & Context Truncation**

* • Input Management: Python slicing request.cv\_text\[:5000\] keeps us within the model’s most effective context window. Prevents “Lost in the Middle” syndrome.  
* • Latency Optimization: Llama 3.3 70B on Groq minimizes Time to First Token (TTFT). Full analysis typically delivers in under 1.5s, critical for UX on Render Free Tier.

## **3.3 Instructional Weighting – The “XML Target” Fix**

* • Exact Quote Requirement: Uses “Negative Constraint” instructions: “Do not summarize or paraphrase.” Ensures xml\_target is a verbatim string.  
* • Run-Joining Synergy: Prompt strategy works with backend full\_text flattening. AI provides a clean string; backend finds it regardless of Word XML fragmentation.

## **3.4 Performance Metrics**

| Metric | Target | Actual (Observed) |
| :---- | :---- | :---- |
| **Analysis Latency** | \< 3.0s | 1.2s – 1.8s |
| **JSON Parse Success** | 100% | 100% (After Schema fix) |
| **Suggestion Accuracy** | \> 90% | 95% (Matching exact XML runs) |
| **Memory Usage** | \< 512MB | \~240MB (Stable on Render) |

## **3.5 Why Llama 3.3 70B?**

Selected over smaller variants like 8B due to Reasoning Density. Smaller models struggle to keep the extraction object intact while performing high-level skill gap analysis. The 70B model handles multi-tasking — extraction, scoring, and editing — without “forgetting” the JSON structure.

## **3.6 Prompt Validation – Testing**

Input: CV with specialized “Cloud Admin” terms

Expected: JSON object with numerical score and exact xml\_target

Result: Successful telemetry log \+ successful frontend render

## **4\. Testing Strategy**

## **4.1 Unit Testing – Functional**

| Test Case | Objective | Status |
| :---- | :---- | :---- |
| **PDF Conversion** | Verify multi-page PDFs ≤3 pages convert to valid DOCX without text loss | Pass |
| **JSON Integrity** | Validate Groq API returns well-formed JSON with keys: extraction, score, match\_status | Pass |
| **XML Node Replacement** | Test “run-joining” logic to apply suggestions to fragmented Word documents | Pass |

## **4.2 Integration Testing**

| Test Case | Objective | Status |
| :---- | :---- | :---- |
| **Database Connectivity** | startup\_event creates usage\_logs table if not exists | Pass |
| **Telemetry Loop** | /analyze request triggers DB INSERT before returning AI response | Pass |

## **4.3 Deployment Testing (UAT)**

| Test Case | Metric | Result |
| :---- | :---- | :---- |
| **Cold Start Performance** | Render Free Tier boot time | 50–90s avg |
| **Concurrency** | Memory stability with WEB\_CONCURRENCY=1 on limited CPU | Verified stable |

## **5\. Error Handling & Edge Cases**

| Scenario | Handling Strategy |
| :---- | :---- |
| **Database Offline** | Log warning to stdout, skip telemetry, continue serving requests |
| **Malformed JSON from LLM** | Enforce response\_format: json\_object at API level to prevent frontend crashes |
| **Split XML Runs** | Flatten paragraph runs into single string before matching xml\_target |
| **Invalid/Missing IP Header** | Fallback to request.client.host if X-Forwarded-For not present |

## **6\. Maintenance & Future Roadmap**

| Item | Description |
| :---- | :---- |
| **Admin Dashboard** | Build private route to visualize usage\_logs metrics in-app |
| **User Authentication** | Migrate from IP-based telemetry to authenticated user tracking |
| **Advanced Parsing** | Add OCR support for scanned/image-based PDFs |
