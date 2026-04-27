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
from docx import Document # Added for DOCX manipulation
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
    except Exception as e: print(f"DB Error: {e}")

def log_usage(ip: str, text: str):
    if not DATABASE_URL: return
    try:
        conn = psycopg2.connect(DATABASE_URL, sslmode='require')
        cur = conn.cursor()
        cur.execute("INSERT INTO usage_logs (ip_address, cv_preview) VALUES (%s, %s)", (ip, text[:500]))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e: print(f"Log Error: {e}")

# --- DOCX MANIPULATION LOGIC ---
def apply_cv_suggestions(docx_path, suggestions):
    doc = Document(docx_path)
    applied_count = 0

    for suggestion in suggestions:
        target = suggestion.get("xml_target")
        replacement = suggestion.get("replacement")
        
        if not target or not replacement: continue

        for para in doc.paragraphs:
            # JOIN RUNS: This merges fragmented XML nodes so the target can be found
            full_text = "".join(run.text for run in para.runs)
            
            if target in full_text:
                new_text = full_text.replace(target, replacement)
                # Clear existing fragmented runs
                for run in para.runs:
                    run.text = ""
                # Put the corrected text into the first run
                if para.runs:
                    para.runs[0].text = new_text
                else:
                    para.add_run(new_text)
                applied_count += 1
    
    doc.save(docx_path)
    return applied_count

# --- APP SETUP ---
app = FastAPI()

@app.on_event("startup")
async def startup_event():
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    cv_text: str
    job_description: str

# --- ROUTES ---

@app.get("/")
async def root():
    return {"status": "online", "db": bool(DATABASE_URL)}

@app.post("/analyze")
async def analyze_cv(request: AnalysisRequest, client_request: Request):
    if not client: raise HTTPException(status_code=500, detail="AI Offline")
    
    client_ip = client_request.headers.get("x-forwarded-for") or client_request.client.host
    log_usage(client_ip, request.cv_text)
    
    prompt = f"""
    Analyze the CV and JD. Return ONLY JSON.
    CV: {request.cv_text[:5000]}
    JD: {request.job_description[:5000]}
    
    CRITICAL: For suggestions, the 'xml_target' MUST be an EXACT, 100% case-sensitive 
    phrase from the CV text. 

    {{
      "score": 0,
      "match_status": "",
      "matched_skills": [],
      "missing_skills": [],
      "extraction": {{
        "cv_data": {{ "name": "Candidate", "skills": [], "experience": [], "education": [] }},
        "jd_data": {{ "role": "Job Title", "skills": [], "responsibilities": [], "qualifications": [] }}
      }},
      "suggestions": [
        {{ "id": "1", "xml_target": "exact phrase from cv", "replacement": "new phrase", "reason": "why" }}
      ],
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

@app.post("/apply-suggestions")
async def apply_edits(file: UploadFile = File(...), suggestions_json: str = File(...)):
    # This endpoint allows the user to upload their DOCX and apply the AI's suggestions
    suggestions = json.loads(suggestions_json)
    
    try:
        content = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        count = apply_cv_suggestions(tmp_path, suggestions)
        
        with open(tmp_path, "rb") as f:
            updated_data = f.read()
            
        os.remove(tmp_path)
        
        return Response(
            content=updated_data,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=Improved_CV.docx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Edit failed: {str(e)}")

# Restore the original PDF to DOCX route
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
        return Response(content=docx_data, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))