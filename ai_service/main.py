from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from contextlib import asynccontextmanager
import ml_models  
from fastapi.middleware.cors import CORSMiddleware

# 1. تعريف شكل البيانات
class CVRequest(BaseModel):
    cv_text: str

class VideoRequest(BaseModel):
    video_url: str

# 2. إدارة دورة حياة التطبيق (تحميل الموديلات)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up AI Service...")
    ml_models.load_models()  
    yield
    print("🛑 Shutting down AI Service...")

# 3. إنشاء تطبيق FastAPI (مرة واحدة فقط!)
app = FastAPI(lifespan=lifespan)

# 4. إضافة الـ Middleware (لازم تكون بعد تعريف app وقبل الـ routes)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. الـ Routes
@app.get("/")
def read_root():
    return {"status": "AI Service is Running", "models_loaded": True}

@app.post("/analyze-cv")
async def analyze_cv_endpoint(request: CVRequest):
    try:
        analysis = ml_models.generate_resume_text(request.cv_text)
        parsed_result = ml_models.parse_model_response(analysis)
        
        if parsed_result:
            return parsed_result
        return {"raw_text": analysis, "error": "Could not parse JSON properly"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-interview")
async def analyze_video_endpoint(request: VideoRequest):
    try:
        result = ml_models.analyze_interview(request.video_url)
        return {"analysis": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))