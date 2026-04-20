import os
import io
import re
import json
import time
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
import docx
from groq import Groq  # Swapped from google.genai
from dotenv import load_dotenv


# 1. Load Environment Variables
load_dotenv() 

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("❌ ERROR: GROQ_API_KEY not found in environment!")
    client = None
else:
    print("✅ SUCCESS: Groq API Key loaded.")
    client = Groq(api_key=GROQ_API_KEY)

app = FastAPI()

# 2. Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Experience(BaseModel):
    title: str
    company: str
    period: str
    description: str

class CVStructured(BaseModel):
    name: str = "Candidate"
    skills: list[str]
    experience: list[Experience]
    education: list[str]

class JDStructured(BaseModel):
    role: str
    skills: list[str]
    responsibilities: list[str]
    qualifications: list[str]

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

class AnalysisResponse(BaseModel):
    score: int
    match_status: str
    matched_skills: list[str]
    missing_skills: list[str]
    extraction: dict # Will contain cv_data and jd_data
    suggestions: list[Suggestion]
    skill_gap_courses: list[dict] # {topic: str, description: str}

@app.get("/")
async def root():
    return {"status": "online", "api_key_configured": bool(GROQ_API_KEY)}

import tempfile
from fastapi.responses import Response
from pdf2docx import Converter

@app.post("/convert-pdf-to-docx")
async def convert_pdf_to_docx(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported for conversion")
        
    try:
        content = await file.read()
        
        # Step 1: Write PDF to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as pdf_file:
            pdf_file.write(content)
            pdf_path = pdf_file.name
            
        docx_path = pdf_path.replace(".pdf", ".docx")
        
        # Step 2: Convert PDF to DOCX
        cv = Converter(pdf_path)
        cv.convert(docx_path)
        cv.close()
        
        # Step 3: Read generated DOCX
        with open(docx_path, "rb") as docx_file:
            docx_data = docx_file.read()
            
        # Cleanup
        os.remove(pdf_path)
        if os.path.exists(docx_path):
            os.remove(docx_path)
            
        # Step 4: Return File Response
        response = Response(content=docx_data, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        response.headers["Content-Disposition"] = f"attachment; filename={file.filename.replace('.pdf', '.docx')}"
        return response
        
    except Exception as e:
        # Cleanup on failure
        if 'pdf_path' in locals() and os.path.exists(pdf_path):
            os.remove(pdf_path)
        if 'docx_path' in locals() and os.path.exists(docx_path):
            os.remove(docx_path)
        raise HTTPException(status_code=500, detail=f"PDF conversion failed: {str(e)}")

@app.post("/analyze")
async def analyze_cv(request: AnalysisRequest):
    if not client:
        raise HTTPException(status_code=500, detail="AI Client not initialized.")
    
    cv_text = request.cv_text[:6000]
    jd_text = request.job_description[:6000]

    prompt = f"""
    You are an expert career architect. Analyze the provided CV and Job Description.
    
    STEP 1: Extract structured data from the CV (Skills, Experience, Education).
    STEP 2: Extract structured data from the JD (Core Requirements, Responsibilities, Qualifications).
    STEP 3: Compare both and generate a match score (0-100).
    STEP 4: You are a professional CV editor. Find EXACTLY 5 exact text phrases in the CV that should be improved to match the JD.
    STEP 5: Suggest 3-4 course topics or learning paths to bridge skill gaps.
    
    CV: {cv_text}
    JD: {jd_text}
    
    Return ONLY a JSON object with this exact structure:
    {{
      "score": number,
      "match_status": "string",
      "matched_skills": ["string"],
      "missing_skills": ["string"],
      "extraction": {{
        "cv_data": {{ "skills": [], "experience": [{{ "title": "", "company": "", "description": "" }}], "education": [] }},
        "jd_data": {{ "role": "", "skills": [], "responsibilities": [], "qualifications": [] }}
      }},
      "suggestions": [
        {{ 
          "id": "s1", 
          "section": "Summary / Experience / Skills / Education", 
          "type": "quantify / strengthen / clarify / format", 
          "issue": "max 10 words", 
          "xml_target": "exact phrase from CV text, max 60 chars", 
          "replacement": "improved phrase", 
          "reason": "max 12 words" 
        }}
      ],
      "skill_gap_courses": [{{ "topic": "string", "description": "string" }}]
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a career consultant specialized in high-end recruitment analysis. Your output is always strictly structured JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content.strip())

    except Exception as e:
        print(f"ANALYSIS ERROR: {e}")
        raise HTTPException(status_code=500, detail="AI Analysis failed. Check console for details.")

@app.post("/generate-cover-letter")
async def generate_cover_letter(request: CoverLetterRequest):
    if not client:
        raise HTTPException(status_code=500, detail="AI Client not initialized.")
    
    # We allow more characters for the cover letter to get better context
    safe_cv = request.cv_text[:5000]
    safe_jd = request.job_description[:5000]

    prompt = f"""
    Write a high-impact, professional cover letter.
    CANDIDATE CV: {safe_cv}
    TARGET JOB: {safe_jd}
    
    INSTRUCTIONS:
    1. Focus on bridging the gap between technical expertise and business value.
    2. Mention specific tools or achievements found in the CV that match the JD.
    3. Keep it under 350 words.
    4. Use a modern, professional tone (no generic "To Whom It May Concern").
    
    Return ONLY the cover letter text.
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant", # Using the fast model for now
            messages=[
                {"role": "system", "content": "You are an executive career coach and expert cover letter writer."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7 
        )
        return {"cover_letter": response.choices[0].message.content.strip()}
    except Exception as e:
        print(f"COVER LETTER ERROR: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate cover letter.")        