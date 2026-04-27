import os
import io
import json
import tempfile
import psycopg2
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from pdf2docx import Converter
from groq import Groq 
from dotenv import load_dotenv

load_dotenv() 

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# --- DB LOGIC ---
def init_db():
    if not DATABASE_URL: return
    try:
        conn = psycopg2.connect(DATABASE_URL, sslmode='require')
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS usage_logs (
                id SERIAL PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                cv_preview TEXT
            );
        """)
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e: print(f"DB Init Error: {e}")

def log_usage(ip: str, text: str):
    if not DATABASE_URL: return
    try:
        conn = psycopg2.connect(DATABASE_URL, sslmode='require')
        cur = conn.cursor()
        cur.execute("INSERT INTO usage_logs (ip_address, cv_preview) VALUES (%s, %s)", (ip, text[:500]))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e: print(f"Logging Error: {e}")

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    cv_text: str
    job_description: str

@app.post("/analyze")
async def analyze_cv(request: AnalysisRequest, client_request: Request):
    if not client: raise HTTPException(status_code=500, detail="AI Client offline")
    
    # Telemetry
    client_ip = client_request.headers.get("x-forwarded-for") or client_request.client.host
    log_usage(client_ip, request.cv_text)
    
    # THE PROMPT - Strict structure to fix the 'role' error
    prompt = f"""
    Analyze this CV and JD. Return ONLY JSON.
    CV: {request.cv_text[:5000]}
    JD: {request.job_description[:5000]}

    JSON Structure Required:
    {{
      "score": 0,
      "match_status": "",
      "matched_skills": [],
      "missing_skills": [],
      "extraction": {{
        "cv_data": {{ "name": "", "skills": [], "experience": [], "education": [] }},
        "jd_data": {{ "role": "EXACT JOB TITLE HERE", "skills": [], "responsibilities": [], "qualifications": [] }}
      }},
      "suggestions": [],
      "skill_gap_courses": []
    }}
    """
    
    try:
        chat_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Keep your other routes (convert-pdf-to-docx, generate-cover-letter) here...