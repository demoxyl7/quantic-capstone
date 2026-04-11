import os
import json
import io
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv
from pypdf import PdfReader

# 1. Load Environment & Initialize Client
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Force 'v1' to avoid beta version conflicts
client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options={'api_version': 'v1'}
)

app = FastAPI()

# 2. CORS Middleware
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

# --- ENDPOINTS ---

@app.post("/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    try:
        content = await file.read()
        pdf_file = io.BytesIO(content)
        
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
            
        return {
            "text": text.strip(),
            "filename": file.filename
        }
    except Exception as e:
        print(f"PDF Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")    

@app.post("/analyze")
async def analyze_match(request: AnalysisRequest):
    try:
        # Based on your previous 'AVAILABLE MODELS' list, we use 2.0-flash
        # If this fails with 404, change to "gemini-2.0-flash-lite"
        model_id = "gemini-2.0-flash" 
        
        prompt = f"""
        Analyze the following CV against the Job Description.
        
        CV Content: {request.cv_text}
        Job Description: {request.job_description}
        
        Return ONLY a JSON object with this exact structure:
        {{
            "score": 85,
            "match_status": "Brief overview of how well they fit",
            "matched_skills": ["Skill1", "Skill2"],
            "missing_skills": ["Skill3", "Skill4"],
            "suggestions": ["Improvement 1", "Improvement 2"]
        }}
        """

        response = client.models.generate_content(model=model_id, contents=prompt)
        
        # Robust JSON cleaning
        raw_text = response.text.strip()
        
        # Remove Markdown code blocks if present
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0].strip()
            
        return json.loads(raw_text)

    except Exception as e:
        error_msg = str(e)
        print(f"Detailed Error: {error_msg}")
        
        # Handle Quota (429) or Model (404) failures with a clean Mock Response
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            print("Fallback: Returning Mock Data due to Quota limits.")
            return {
                "score": 75,
                "match_status": "MATCH ANALYSIS (PREVIEW MODE): You are currently hitting Google's rate limits, so this is sample data.",
                "matched_skills": ["Python", "FastAPI", "React"],
                "missing_skills": ["AWS", "Docker", "Unit Testing"],
                "suggestions": [
                    "Highlight your FastAPI experience more clearly.",
                    "Consider adding a cloud certification to bridge the AWS gap.",
                    "Include links to GitHub repositories for React projects."
                ]
            }
        
        # If it's a real coding error, raise the 500
        raise HTTPException(status_code=500, detail=error_msg)