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

# --- DATABASE LOGIC ---
def init_db():
    if not DATABASE_URL:
        print("⚠️ No DATABASE_URL found")
        return
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
        print("✅ SUCCESS: Database initialized.")
    except Exception as e:
        print(f"❌ DB Init Error: {e}")

def log_usage(ip: str, text: str):
    if not DATABASE_URL: return
    try:
        conn = psycopg2.connect(DATABASE_URL, sslmode='require')
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO usage_logs (ip_address, cv_preview) VALUES (%s, %s)",
            (ip, text[:500]) 
        )
        conn.commit()
        cur.close()
        conn.close()
        print(f"✅ Telemetry Logged: {ip}")
    except Exception as e:
        print(f"❌ Logging Error: {e}")

# --- APP SETUP ---
app = FastAPI()

@app.on_event("startup")
async def startup_event():
    print("🚀 App starting up...")
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class AnalysisRequest(BaseModel):
    cv_text: str
    job_description: str

class CoverLetterRequest(BaseModel):
    cv_text: str
    job_description: str    

# --- ROUTES ---

@app.get("/")
async def root():
    return {"status": "online", "db": bool(DATABASE_URL)}

@app.post("/convert-pdf-to-docx")
async def convert_pdf_to_docx(file: UploadFile = File(...)):
    try:
        content = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as pdf_file:
            pdf_file.write(content)
            pdf_path = pdf_file.name
        docx_path = pdf_path.replace(".pdf", ".docx")
        cv = Converter(pdf_path)
        cv.convert(docx_path)
        cv.close()
        with open(docx_path, "rb") as docx_file:
            docx_data = docx_file.read()
        os.remove(pdf_path)
        if os.path.exists(docx_path): os.remove(docx_path)
        response = Response(content=docx_data, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        response.headers["Content-Disposition"] = f"attachment; filename=converted.docx"
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_cv(request: AnalysisRequest, client_request: Request):
    if not client: raise HTTPException(status_code=500, detail="AI Offline")
    
    # Telemetry
    client_ip = client_request.headers.get("x-forwarded-for") or client_request.client.host
    log_usage(client_ip, request.cv_text)
    
    prompt = f"""
    Analyze the CV and JD. Return ONLY JSON.
    CV: {request.cv_text[:5000]}
    JD: {request.job_description[:5000]}

    STRUCTURE:
    {{
      "score": 0,
      "match_status": "",
      "matched_skills": [],
      "missing_skills": [],
      "extraction": {{
        "cv_data": {{ "name": "Candidate", "skills": [], "experience": [], "education": [] }},
        "jd_data": {{ "role": "Job Title", "skills": [], "responsibilities": [], "qualifications": [] }}
      }},
      "suggestions": [],
      "skill_gap_courses": []
    }}
    """
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-cover-letter")
async def generate_cover_letter(request: CoverLetterRequest):
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": f"Write a cover letter for: {request.cv_text[:2000]}"}]
        )
        return {"cover_letter": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))