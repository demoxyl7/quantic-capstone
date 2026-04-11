from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import io
import re
from dotenv import load_dotenv
from pypdf import PdfReader
from google import genai

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

class AnalysisRequest(BaseModel):
    cv_text: str
    job_description: str

@app.get("/")
async def root():
    return {
        "status": "online", 
        "api_key_configured": bool(GEMINI_API_KEY)
    }

@app.post("/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    try:
        pdf_content = await file.read()
        reader = PdfReader(io.BytesIO(pdf_content))
        text = "".join([page.extract_text() for page in reader.pages])
        return {"filename": file.filename, "text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_cv(request: AnalysisRequest):
    if not client:
        raise HTTPException(status_code=500, detail="AI Key Missing on Server")
    
    prompt = f"""
    Analyze CV: {request.cv_text}
    Against JD: {request.job_description}
    Return ONLY a JSON object:
    {{
        "score": number,
        "match_status": "string",
        "matched_skills": [],
        "missing_skills": [],
        "suggestions": []
    }}
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash", 
            contents=prompt
        )
        
        # SUPER ROBUST CLEANING: Finds the first { and last }
        raw_text = response.text.strip()
        match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        
        if match:
            json_str = match.group(0)
            return json.loads(json_str)
        else:
            print(f"Failed to find JSON in: {raw_text}")
            raise ValueError("AI did not return valid JSON")
            
    except Exception as e:
        print(f"ANALYSIS ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")