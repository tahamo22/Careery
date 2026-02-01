# استخدم نسخة بايثون مناسبة
FROM python:3.10-slim

# تثبيت مكتبات النظام الضرورية (مهمة للـ AI والـ OpenCV لو فيه فيديو)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# نسخ ملف المتطلبات وتثبيتها
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# نسخ ملفات المشروع
COPY . .

# تشغيل السيرفر (في الإنتاج بنستخدم gunicorn بس خلنا دلوقتي في المبدئي)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]