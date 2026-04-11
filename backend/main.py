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
    # ... rest of your code
    prompt = f"""
    Analyze CV: {request.cv_text}
    Against JD: {request.job_description}
    Return JSON with: score (0-100), match_status, matched_skills[], missing_skills[], suggestions[].
    """
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash", 
            contents=prompt
        )
        # Handle potential markdown formatting in AI response
        clean_json = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))