# backend/settings.py
from pathlib import Path
from datetime import timedelta
import os
from corsheaders.defaults import default_headers

# =======================
# Load .env
# =======================
BASE_DIR = Path(__file__).resolve().parent.parent
try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / ".env")
except Exception:
    pass

# =======================
# Django Base Settings
# =======================
SECRET_KEY = "django-insecure-your-secret-key"
DEBUG = True
ALLOWED_HOSTS = ["*"]

# =======================
# Installed Apps
# =======================
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "core.apps.CoreConfig",
]

# =======================
# Middleware
# =======================
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # ✅ اجعله أول سطر دائماً
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

# =======================
# Templates & Databases
# =======================
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# =======================
# Auth & User Model
# =======================
AUTH_USER_MODEL = "core.User"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# =======================
# CORS & CSRF Configuration (The Fix 🚀)
# =======================
CORS_ALLOW_CREDENTIALS = True

# الروابط المسموح لها بالوصول
# احذف كل اللي فات واكتب ده بس
CORS_ALLOW_ALL_ORIGINS = True 
CORS_ALLOW_CREDENTIALS = True



# إعدادات الكوكيز لضمان عمل الـ Login عبر الدومينات المختلفة
CSRF_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = True

CORS_ALLOW_HEADERS = list(default_headers) + [
    "authorization",
    "content-type",
    "accept",
    "origin",
    "user-agent",
    "x-csrftoken",
    "range",
]

CORS_EXPOSE_HEADERS = [
    "Content-Disposition",
    "Content-Length",
    "Content-Type",
    "Accept-Ranges",
]

# =======================
# Static & Media
# =======================
STATIC_URL = "static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
# =======================
# JWT Settings
# =======================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=24),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer', 'JWT', 'Token'),
}

# =======================
# Other Config (AI, Email, Cache)
# =======================
HF_TOKEN = os.getenv("HF_TOKEN")
HF_MODEL_URL = os.getenv("HF_MODEL_URL")
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "job-cache",
    }
}
# settings.py

ALLOWED_HOSTS = ['*']

# أهم إعداد لحل مشكلة الـ 403 اللي ظهرت في الـ Logs
# السماح للفرونت إند الجديد بالاتصال
# --- إعدادات الروابط الجديدة ---
FRONTEND_URL = "http://localhost:3000/"


import os

# السماح لجميع الروابط في CORS
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
# خدعة برمجية لإضافة أي رابط RunPod للـ CSRF Trust أوتوماتيكياً
CSRF_TRUSTED_ORIGINS = []

# إذا كان هناك طلب قادم، سنقوم باستخراج الـ Host وإضافته للـ Trusted
# ملاحظة: في بيئة الإنتاج الحقيقية هذا غير آمن، لكنه مثالي للـ RunPod والـ Testing
import socket
try:
    hostname, _, ips = socket.gethostbyname_ex(socket.gethostname())
    CSRF_TRUSTED_ORIGINS += [f"https://{ip}" for ip in ips]
except:
    pass

# الحل الأكثر فاعلية لـ RunPod:
# السماح لجميع النطاقات التي تنتهي بـ proxy.runpod.net
CSRF_TRUSTED_ORIGINS = [
    "https://*.proxy.runpod.net",
    "http://*.proxy.runpod.net"
]

