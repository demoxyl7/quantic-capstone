import os
import io
import re
import json
import time
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
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

class AnalysisRequest(BaseModel):
    cv_text: str
    job_description: str

@app.get("/")
async def root():
    return {"status": "online", "api_key_configured": bool(GROQ_API_KEY)}

@app.post("/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    try:
        pdf_content = await file.read()
        reader = PdfReader(io.BytesIO(pdf_content))
        text = "".join([page.extract_text() or "" for page in reader.pages])
        return {"filename": file.filename, "text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_cv(request: AnalysisRequest):
    if not client:
        raise HTTPException(status_code=500, detail="AI Client not initialized.")
    
    safe_cv = request.cv_text[:4000] # Groq handles more context easily
    safe_jd = request.job_description[:4000]

    prompt = f"""
    Analyze the following CV text against the Job Description.
    CV: {safe_cv}
    JD: {safe_jd}
    
    Return ONLY a JSON object with: 
    {{ "score": 0-100, "match_status": "string", "matched_skills": [], "missing_skills": [], "suggestions": [] }}
    """
    
    try:
        # Groq's Chat Completion Syntax
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a recruitment expert that only outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"} # Forces valid JSON!
        )
        
        # Extract content
        raw_text = response.choices[0].message.content.strip()
        return json.loads(raw_text)

    except Exception as e:
        error_str = str(e)
        print(f"ANALYSIS ERROR: {error_str}")
        # Groq error handling
        if "429" in error_str:
            raise HTTPException(status_code=429, detail="Groq limit reached. Wait a moment.")
        raise HTTPException(status_code=500, detail="AI analysis failed.")