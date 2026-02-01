# 1. استخدم نسخة مجهزة بـ CUDA 12 عشان تتوافق مع Torch 2.6
FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04

# 2. تحديث النظام وتسطيب بايثون و ffmpeg (مهم جداً لمعالجة الفيديوهات)
RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-dev \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# 3. تحديد مجلد العمل داخل الـ Container
WORKDIR /app

# 4. نسخ ملف الـ requirements الأول عشان نستفيد من الـ Cache
COPY requirements.txt .

# 5. تسطيب المكتبات (تأكد أن torch والـ API موجودين في الملف)
# ملحوظة: بنستخدم --no-cache-dir عشان نوفر مساحة في الـ Image
RUN pip3 install --upgrade pip
RUN pip3 install --no-cache-dir -r requirements.txt

# 6. نسخ كل ملفات المشروع (main.py, ml_models.py, etc.)
COPY . .


# ... (نفس الخطوات اللي فاتت)

EXPOSE 777

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7777"]