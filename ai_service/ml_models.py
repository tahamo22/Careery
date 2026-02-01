# myapp/ml_models.py
import re
import json
import torch
import os
import tempfile      # ← ADD THIS
import requests      # ← ADD THIS
from urllib.parse import urlparse  # ← ADD THIS (fixes 'urlparse' error)
from transformers import AutoTokenizer, AutoModelForCausalLM
from transformers import Qwen2VLForConditionalGeneration, AutoProcessor
from qwen_vl_utils import process_vision_info
import os
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
# Global variables to hold the models
tokenizer = None
model = None
vmodel = None
vprocessor = None

def load_models():
    """
    Loads the models into memory. 
    Called once by apps.py when the server starts.
    """
    global tokenizer, model, vmodel, vprocessor

    print("⏳ Loading AI Models... This may take a while.")

    # 1. Load Vision Model (Qwen2-VL)
    vision_model_name = "Qwen/Qwen2-VL-2B-Instruct"
    try:
        vmodel = Qwen2VLForConditionalGeneration.from_pretrained(
            vision_model_name,
            torch_dtype=torch.float16,
            device_map="auto",
        )
        vprocessor = AutoProcessor.from_pretrained(vision_model_name)
        print(f"✅ Vision Model ({vision_model_name}) Loaded.")
    except Exception as e:
        print(f"❌ Failed to load Vision Model: {e}")

    # 2. Load Text Model (Llama 3)
    text_model_id = "kallilikhitha123/training_job_quantized_llama_3_8b_matching_2154_05-05-2025"
    try:
        tokenizer = AutoTokenizer.from_pretrained(text_model_id)
        model = AutoModelForCausalLM.from_pretrained(
            text_model_id,
            torch_dtype=torch.float16,
            device_map="auto",
        )
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        print(f"✅ Text Model ({text_model_id}) Loaded.")
    except Exception as e:
        print(f"❌ Failed to load Text Model: {e}")


# --- Helper Functions (Your Logic) ---

def generate_resume_text(resume, max_new_tokens=1024, temperature=0.5):
    global model, tokenizer
    if model is None: raise RuntimeError("Text model is not loaded!")

    model_input = f"""
### ROLE
    You are a professional Career Consultant and Recruitment Specialist. Your goal is to analyze the provided CV and map it to the most relevant job roles with actionable feedback.

    ### TASK
    1.  **Identify Roles:** Identify the top 3 job titles that best match the candidate's skills and experience.
    2.  **Analyze Alignment:** Provide a 2-sentence summary explaining why these specific roles were chosen based on the CV's strengths.
    3.  **Actionable Feedback:** For each identified role, provide one specific, high-impact action the candidate should take to become a stronger candidate (e.g., specific certifications, technical skills to highlight, or project types).

    ### CONSTRAINTS
    - Output MUST be valid JSON.
    - Output ONLY the JSON object. Do not include any preamble, markdown formatting, or postscript.
    - If the CV is insufficient to recommend 3 jobs, provide the best possible matches based on transferable skills.

    ### OUTPUT SCHEMA
    {{
    "matching_analysis": [
        {{"job_title": "string"}},
        {{"job_title": "string"}},
        {{"job_title": "string"}}
    ],
    "description": [
        "string (reasoning part 1)",
        "string (reasoning part 2)"
    ],
    "recommendation": [
        {{"job_title": "string", "action": "string"}},
        {{"job_title": "string", "action": "string"}},
        {{"job_title": "string", "action": "string"}}
    ]
    }}
    
    ### CV TEXT
    {resume}

    ### JSON OUTPUT
    """
    
    inputs = tokenizer(model_input, return_tensors="pt").to(model.device)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id,
            repetition_penalty=1.2
        )
    return tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)

def parse_model_response(response_text):
    """(Your parsing logic here - shortened for brevity but keep your full code)"""
    try:
        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        matches = re.finditer(json_pattern, response_text, re.DOTALL)
        for match in matches:
            try:
                return json.loads(match.group(0))
            except: continue
        
        # Fallback: find first {
        start_idx = response_text.find('{')
        if start_idx != -1:
             # Simple attempt to load remaining text
             try:
                 return json.loads(response_text[start_idx:])
             except: pass
        return None
    except Exception as e:
        print(f"Parsing Error: {e}")
        return None

# --- Main Exported Functions ---
def is_url(path):
    try:
        result = urlparse(path)
        return all([result.scheme, result.netloc])
    except ValueError:
        return False

# --- Helper: Download Video from URL ---
def download_video_from_url(url):
    print(f"⬇️ Downloading video from: {url}")
    try:
        temp_file = tempfile.NamedTemporaryFile(delete=False)
        
        # السطر ده هو السر: بيعرف نجروك إن اللي داخل ده "كود" مش "متصفح" فيلغي التحذير
        headers = {
            'ngrok-skip-browser-warning': 'true',
            'User-Agent': 'Python/Requests'
        }
        
        with requests.get(url, stream=True, headers=headers, timeout=30) as r:
            r.raise_for_status()
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    temp_file.write(chunk)
        
        temp_file.flush() # تأكد إن البيانات اتكتبت فعلياً من الرام للهارد
        temp_file.close() # اقفل الملف قبل ما تبعت المسار للموديل
        
        
        # تأكد إن الملف نزل وحجمه مش صغير جداً (عشان نتأكد إنه فيديو مش صفحة HTML)
        if os.path.getsize(temp_file.name) < 1000:
            print("❌ Error: Downloaded file is too small, likely not a video.")
            return None
            
        print(f"✅ Video downloaded successfully: {os.path.getsize(temp_file.name)} bytes")
        return temp_file.name
    except Exception as e:
        print(f"❌ Failed to download video: {e}")
        return None

# --- Main Interview Analysis Function ---
def analyze_interview(video_input):
    """
    video_input: Can be a local file path (e.g. "uploads/vid.mp4") 
                 OR a URL (e.g. "https://example.com/vid.mp4")
    """
    global vmodel, vprocessor
    if vmodel is None: 
        raise RuntimeError("Vision model is not loaded! Check server logs.")

    local_video_path = video_input 
    is_temp_file = False

    # 1. Handle URL input
    if is_url(video_input):
        downloaded_path = download_video_from_url(video_input)
        if not downloaded_path:
            return "Error: Could not download video from the provided link."
        local_video_path = downloaded_path
        print(local_video_path)
        is_temp_file = True # Mark for deletion later

    # 2. Process with Qwen2-VL
    try:
        messages = [
            {
                "role": "user",
                "content": [
                    
                       # التعديل المطلوب داخل قائمة messages
                        {
                            "type": "video", 
                            "video": local_video_path,
                            # "fps": 1.0,  # ← جرب تعمل كومنت لده
                            "nframes": 4,  # ← واستخدم ده بدله (بيخلي الموديل يسحب 8 صور من الفيديو بالتساوي)
                            "max_pixels": 360 * 420, # Limit resolution per frame
                        },
                    
                    {
                        "type": "text", 
                        "text": (
                            
                                # Use this prompt to get the exact bulleted/paragraph structure without numbers
                                    """
                                        You are a Senior Executive Interview Coach specializing in non-verbal communication and behavioral analysis.

                                        ### Task
                                        Analyze the provided video introduction. Do not give generic advice; ground every observation in visual evidence found in the video frames. 

                                        ### Strict Requirement: No Numerical Ratings
                                        Do not use numbers, scales, or scores (e.g., no 1-10 ratings). Provide only descriptive, qualitative feedback based on what is visible in the video.

                                        ### Analysis Criteria
                                        1. **Visual Environment:** Analyze the background, lighting, and camera angle.
                                        2. **Non-Verbal Cues:** Track eye contact (lens vs. screen), hand gestures, and posture.
                                        3. **Attire & Grooming:** Assess professionalism relative to a corporate setting.

                                        ### Output Instructions (STRICT)
                                        You must return your entire response in valid Markdown format using the following structure:

                                        # Interview Performance Report

                                        ### Communication Clarity
                                        - **Strengths:** [Analyze clarity, pacing, and tone in 1-2 sentences.]

                                        ### Confidence
                                        - **Strengths:** [Analyze vocal steadiness and perceived self-assurance in 1-2 sentences.]

                                        ### Body Language
                                        - **Strengths:** [Analyze posture and movement in 1-2 sentences.]

                                        ### Eye Contact
                                        - **Strengths:** [Analyze focus on the camera lens in 1-2 sentences.]

                                        ### Overall Professionalism
                                        - **Strengths:** [Analyze attire, background, and general demeanor in 1-2 sentences.]

                                        ### Weaknesses
                                        - **Weakness:** [Identify the most significant visual or vocal areas for improvement in a concise paragraph.]

                                        ### Tips to Improve
                                        1. **[Category]:** [Actionable advice for the first tip.]
                                        2. **[Category]:** [Actionable advice for the second tip.]
                                        3. **[Category]:** [Actionable advice for the third tip.]

                                        **Overall Summary:**
                                        [Provide a final 3-4 sentence paragraph summarizing the candidate's performance. Mention the candidate by name if they introduce themselves. Focus on their credibility and the overall impression they leave.]

                                        ---
                                        *Note: This feedback is generated via AI vision analysis.*
                                        """
    
                        ),
                    },
                ],
            }
        ]

        text = vprocessor.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        
        # Process video info (extracts frames)
        image_inputs, video_inputs = process_vision_info(messages)

        inputs = vprocessor(
            text=[text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        )

        inputs = inputs.to(vmodel.device)

        with torch.no_grad():
            generated_ids = vmodel.generate(
                **inputs, 
                max_new_tokens=512,
            )

        generated_ids_trimmed = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
        ]

        output_text = vprocessor.batch_decode(
            generated_ids_trimmed,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=False,
        )
        
        result = output_text[0]

    except Exception as e:
        result = f"Error processing video: {str(e)}"
    
    finally:
        # 3. Cleanup: If we downloaded a temp file, delete it now
        if is_temp_file and os.path.exists(local_video_path):
            os.remove(local_video_path)
            print(f"🗑️ Cleaned up temp file: {local_video_path}")

    return result