from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow your React frontend to talk to this Python backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, we will restrict this
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "Cappy Stony Rojexe is Live!", "version": "1.0.0"}