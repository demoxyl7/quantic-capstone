from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import io
from dotenv import load_dotenv
from pypdf import PdfReader
from google import genai

load_dotenv()

app = FastAPI()

# Allow your Vercel frontend and local development to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AI Client Setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# This prevents the crash if the key is missing during startup
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
else:
    client = None
    print("CRITICAL: GEMINI_API_KEY is not set!")

class AnalysisRequest(BaseModel):
    cv_text: str
    job_description: str

# --- ROUTES ---

@app.get("/")
async def root():
    # This stops the "Not Found" error when you visit the URL in a browser
    return {
        "status": "online", 
        "message": "AI CV Analyzer Brain is active",
        "api_key_configured": bool(GEMINI_API_KEY)
    }

@app.post("/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    try:
        pdf_content = await file.read()
        reader = PdfReader(io.BytesIO(pdf_content))
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return {"filename": file.filename, "text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_cv(request: AnalysisRequest):
    if not client:
        raise HTTPException(status_code=500, detail="AI Client not initialized. Check API Key.")

    # We tell the AI exactly what to do and what NOT to do
    prompt = f"""
    Analyze the following CV against the Job Description.
    CV: {request.cv_text}
    JD: {request.job_description}
    
    IMPORTANT: You must return ONLY a valid JSON object. 
    Do not include any introductory text or markdown formatting.
    
    Required JSON Structure:
    {{
        "score": 0-100,
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
        
        # This is the "Bulletproof" cleaner
        raw_text = response.text.strip()
        
        # If the AI ignored our 'no markdown' rule, this extracts the JSON inside
        if "```" in raw_text:
            # Splits by backticks and takes the content inside
            parts = raw_text.split("```")
            for part in parts:
                if "{" in part and "}" in part:
                    raw_text = part
                    if raw_text.startswith("json"):
                        raw_text = raw_text[4:]
                    break

        return json.loads(raw_text.strip())
        
    except Exception as e:
        # This will now show the actual AI error in your Render logs
        print(f"DEBUGGING ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Brain Error: {str(e)}")