import os
import io
import re
import json
import time
from typing import Optional, List
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

class CVPersonalInfo(BaseModel):
    name: str
    email: str
    phone: str
    linkedin: str
    location: str

class CVExperienceBullet(BaseModel):
    id: str
    text: str

class CVExperience(BaseModel):
    id: str
    title: str
    company: str
    location: str
    dates: str
    bullets: list[CVExperienceBullet]

class CVEducationDetail(BaseModel):
    id: str
    text: str

class CVEducation(BaseModel):
    id: str
    degree: str
    institution: str
    dates: str
    details: list[CVEducationDetail]

class CVProject(BaseModel):
    id: str
    name: str
    description: str
    technologies: list[str]

class CVStructured(BaseModel):
    personal_info: CVPersonalInfo
    summary: str
    experience: list[CVExperience]
    projects: list[CVProject] # Added projects
    education: list[CVEducation]
    skills: list[str]

class JDData(BaseModel):
    role: str
    skills: list[str]
    responsibilities: list[str]
    qualifications: list[str]

class CVExtraction(BaseModel):
    cv_data: CVStructured
    jd_data: JDData

class Suggestion(BaseModel):
    id: str
    target_id: str
    type: str # summary, experience_bullet, project_description, education_detail
    issue: str
    original_text: str
    replacement_text: str
    reason: str

class SkillGapCourse(BaseModel):
    topic: str
    description: str

class AnalysisResponse(BaseModel):
    is_cv: bool
    error_message: Optional[str] = None
    score: int
    match_status: str
    matched_skills: list[str]
    missing_skills: list[str]
    extraction: CVExtraction
    suggestions: list[Suggestion]
    skill_gap_courses: list[SkillGapCourse]

class AnalysisRequest(BaseModel):
    cv_text: str
    job_description: str

class CoverLetterRequest(BaseModel):
    cv_text: str
    job_description: str

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
    You are an expert career consultant. Analyze the following CV and Job Description.
    
    STEP 1: Extract the CV data VERBATIM. 
    - Include Personal Info (Name, Email, Phone, LinkedIn, Location).
    - Include a Professional Summary.
    - Include ALL Experience records. Assign each record an ID like "exp_1" and each bullet point an ID like "b_1".
    - Include ALL Projects. Assign each record an ID like "proj_1".
    - Include ALL Education records. Assign each record an ID like "edu_1" and each detail bullet an ID like "ed_1".
    - Include ALL Skills.
    
    STEP 2: Extract structured data from the JD (Role, Skills, Responsibilities, Qualifications).
    
    STEP 3: Generate a match score (0-100) and match status.
    
    STEP 4: Provide EXACTLY 5 targeted improvement suggestions. 
    - Each suggestion must reference a `target_id` from the extracted CV data.
    - `type` MUST be one of: "summary", "experience_bullet", "project_description", "education_detail".
    - Provide the `original_text` and a `replacement_text` that better aligns with the JD.
    
    STEP 5: Suggest 3-4 course topics to bridge skill gaps.
    
    CV: {cv_text}
    JD: {jd_text}
    
    Return ONLY a JSON object with this exact structure:
    {{
      "is_cv": boolean,
      "error_message": "string",
      "score": number,
      "match_status": "string",
      "matched_skills": ["string"],
      "missing_skills": ["string"],
      "extraction": {{
        "cv_data": {{ 
          "personal_info": {{ "name": "", "email": "", "phone": "", "linkedin": "", "location": "" }},
          "summary": "",
          "experience": [
            {{ "id": "exp_1", "title": "", "company": "", "location": "", "dates": "", "bullets": [ {{ "id": "b_1", "text": "" }} ] }}
          ],
          "projects": [
            {{ "id": "proj_1", "name": "", "description": "", "technologies": [] }}
          ],
          "education": [
            {{ "id": "edu_1", "degree": "", "institution": "", "dates": "", "details": [ {{ "id": "ed_1", "text": "" }} ] }}
          ],
          "skills": []
        }},
        "jd_data": {{ "role": "", "skills": [], "responsibilities": [], "qualifications": [] }}
      }},
      "suggestions": [
        {{ "id": "s1", "target_id": "b_1", "type": "experience_bullet", "issue": "", "original_text": "", "replacement_text": "", "reason": "" }}
      ],
      "skill_gap_courses": [{{ "topic": "string", "description": "string" }}]
    }}
    
    IMPORTANT RULES:
    1. EXTRACT DATA VERBATIM: Do not summarize or paraphrase original CV text during extraction.
    2. NO HALLUCINATIONS: If a piece of information is missing, leave the field empty.
    3. TARGETED SUGGESTIONS: Only suggest improvements for sections that exist.
    4. NON-CV CONTENT: If the document isn't a CV, set `is_cv` to false.
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a career consultant specialized in high-end recruitment analysis. Your output is always strictly structured JSON. You must be extremely literal during extraction and never hallucinate data that isn't in the provided text."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content.strip())
        
        # Guard against non-CV documents
        if result.get("is_cv") == False:
            # We still return the object but the frontend should handle the error_message
            pass
            
        return result

    except Exception as e:
        print(f"ANALYSIS ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"AI Analysis failed: {str(e)}")

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