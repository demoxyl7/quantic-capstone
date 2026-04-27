import os
import io
import re
import json
import time
import tempfile
import psycopg2  # Added missing import
from fastapi import FastAPI, UploadFile, File, HTTPException, Request  # Added Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from pypdf import PdfReader
from pdf2docx import Converter
import docx
from groq import Groq 
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv() 

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

# Fix for Render's "postgres://" vs "postgresql://" requirement
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 2. Initialize Groq Client
if not GROQ_API_KEY:
    print("❌ ERROR: GROQ_API_KEY not found in environment!")
    client = None
else:
    print("✅ SUCCESS: Groq API Key loaded.")
    client = Groq(api_key=GROQ_API_KEY)

# 3. Database Functions
def init_db():
    """Creates the table if it doesn't exist."""
    if not DATABASE_URL:
        print("⚠️ WARNING: DATABASE_URL not found. Telemetry disabled.")
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
    """Logs the client IP and a snippet of the CV."""
    if not DATABASE_URL:
        return
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

# 4. FastAPI Setup
app = FastAPI()

@app.on_event("startup")
async def startup_event():
    print("🚀 App starting up... checking database connection.")
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Data Models
class Experience(BaseModel):
    title: str
    company: str
    period: str
    description: str

class Suggestion(BaseModel):
    id: str
    section: str
    type: str
    issue: str
    xml_target: str
    replacement: str
    reason: str

class AnalysisRequest(BaseModel):
    cv_text: str
    job_description: str

class CoverLetterRequest(BaseModel):
    cv_text: str
    job_description: str    

# 6. Routes
@app.get("/")
async def root():
    return {
        "status": "online", 
        "api_key_configured": bool(GROQ_API_KEY),
        "db_configured": bool(DATABASE_URL)
    }

@app.post("/convert-pdf-to-docx")
async def convert_pdf_to_docx(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
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
        if os.path.exists(docx_path):
            os.remove(docx_path)
            
        response = Response(content=docx_data, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        response.headers["Content-Disposition"] = f"attachment; filename={file.filename.replace('.pdf', '.docx')}"
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@app.post("/analyze")
async def analyze_cv(request: AnalysisRequest, client_request: Request): # Added client_request here
    if not client:
        raise HTTPException(status_code=500, detail="AI Client not initialized.")
    
    # --- Silent Telemetry ---
    client_ip = client_request.headers.get("x-forwarded-for") or client_request.client.host
    log_usage(client_ip, request.cv_text)
    
    cv_text = request.cv_text[:6000]
    jd_text = request.job_description[:6000]

    prompt = f"""
    Analyze the CV and Job Description.
    CV: {cv_text}
    JD: {jd_text}
    Return ONLY a JSON object with match score, match_status, matched_skills, missing_skills, extraction, suggestions, and skill_gap_courses.
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a recruitment expert that only outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content.strip())
    except Exception as e:
        print(f"ANALYSIS ERROR: {e}")
        raise HTTPException(status_code=500, detail="AI Analysis failed.")

@app.post("/generate-cover-letter")
async def generate_cover_letter(request: CoverLetterRequest):
    if not client:
        raise HTTPException(status_code=500, detail="AI Client not initialized.")
    
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are an expert cover letter writer."},
                {"role": "user", "content": f"CV: {request.cv_text[:5000]}\nJD: {request.job_description[:5000]}"}
            ]
        )
        return {"cover_letter": response.choices[0].message.content.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate cover letter.")