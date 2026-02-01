from rest_framework.response import Response
from .models import InterviewVideo  # تأكد من اسم الموديل
from .serializers import InterviewVideoSerializer
from dotenv import load_dotenv
from backend.providers.upwork_api import fetch_upwork_jobs
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework import viewsets, status, generics, mixins
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
from .models import CompanyProfile
from .serializers import CompanyProfileSerializer
from django.http import JsonResponse
from django.core.mail import send_mail
from bs4 import BeautifulSoup
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied
import requests
import json
import os
import random
from rest_framework.permissions import IsAuthenticated
from .models import CompanyPublicProfile
from .serializers import CompanyPublicProfileSerializer
from rest_framework import viewsets, permissions
from .models import SavedApplication
from .serializers import SavedApplicationSerializer
from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import CompanyVerification
from .serializers import CompanyVerificationSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Job, JobApplication
from .permissions import IsApprovedCompany
from .models import SavedJob
from .serializers import SavedJobSerializer
from rest_framework.permissions import AllowAny
from django.conf import settings
from .models import UserEmailVerification
from .models import CompanyProfile, CompanyEmailVerification
from .serializers import CompanyProfileSerializer
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .serializers import (
    JobSerializer,
    JobDetailSerializer,
    JobCreateUpdateSerializer,
    JobApplicationSerializer,
)
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import InterviewVideo
from .serializers import InterviewVideoSerializer

from .models import (
    CV,
    Job,
    UploadedCV,
    CompanyProfile,
    SocialLink,
    AIAnalysis,
    PasswordResetOTP,
    InterviewVideo,
    InterviewSession,
    InterviewQuestion,
    JobApplication,
    SavedApplication,   
)

from .serializers import (
    CVSerializer,
    JobSerializer,
    UploadedCVSerializer,
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    CompanyProfileSerializer,
    PasswordChangeSerializer,
    SocialLinkSerializer,
    InterviewVideoSerializer,
    InterviewSessionSerializer,
    InterviewQuestionSerializer,
    JobDetailSerializer,
    JobApplicationSerializer,
    JobCreateUpdateSerializer,
    SavedApplicationSerializer,  
)

from .ai_utils import match_score

load_dotenv()
User = get_user_model()

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
import requests
import os
from rest_framework.response import Response
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import JSONParser
# ================================
# CV CRUD
# ================================
class CVViewSet(viewsets.ModelViewSet):
    serializer_class = CVSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
      
        return CV.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        POST /api/cvs/
        - لو CV موجود → update
        - لو مش موجود → create
        """

        cv = CV.objects.filter(user=request.user).first()

        if cv:
            serializer = self.get_serializer(
                cv,
                data=request.data,
                partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """
        يمنع PUT /api/cvs/{id}/
        ويحوّل أي update على CV بتاع اليوزر نفسه
        """

        cv = CV.objects.filter(user=request.user).first()
        if not cv:
            return Response(
                {"detail": "CV not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(
            cv,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

# ================================
# Job CRUD
# ================================

from .models import Job
from .serializers import (
    JobSerializer,
    JobDetailSerializer,
    JobCreateUpdateSerializer,
)

from .serializers import (
    JobSerializer,
    JobDetailSerializer,
    JobCreateUpdateSerializer,
)



class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()

    # ================= SERIALIZER =================
    def get_serializer_class(self):
        if self.action == "retrieve":
            return JobDetailSerializer
        if self.action in ["create", "update", "partial_update"]:
            return JobCreateUpdateSerializer
        return JobSerializer

    # ================= PERMISSIONS =================
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]

        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
            "expire",
            "reactivate",
        ]:
            return [IsAuthenticated(), IsApprovedCompany()]

        return [IsAuthenticated()]

    # ================= QUERYSET =================
    def get_queryset(self):
        user = self.request.user

        # الشركة تشوف وظائفها فقط
        if (
            user.is_authenticated
            and getattr(user, "user_type", "").lower() == "company"
        ):
            return Job.objects.filter(company=user).order_by("-created_at")

        # باقي المستخدمين يشوفوا Active فقط
        return Job.objects.filter(is_open=True).order_by("-created_at")


    # ================= CREATE =================
    def perform_create(self, serializer):
        serializer.save(company=self.request.user)

    # ================= UPDATE (FIXED) =================
    def partial_update(self, request, *args, **kwargs):
        job = self.get_object()

        if job.company != request.user:
            raise PermissionDenied("You do not own this job.")

        data = request.data.copy()

        # ✅ الحقول المسموح بتعديلها فقط
        allowed_fields = {
           "title",
           "role",
           "job_type",
           "job_level",
           "description",
           "requirements",
           "tags",
           "education",
           "experience",
           "vacancies",
           "country",
           "city",
           "salary_info",
           "benefits",
           "application_deadline",
           "is_open",
           "is_promoted",
        }


        clean_data = {
            key: value
            for key, value in data.items()
            if key in allowed_fields
        }

        Job.objects.filter(id=job.id).update(**clean_data)

        job.refresh_from_db()
        serializer = JobDetailSerializer(job)
        return Response(serializer.data, status=200)

    # ================= EXPIRE =================
    @action(detail=True, methods=["post"])
    def expire(self, request, pk=None):
        job = self.get_object()

        if job.company != request.user:
            return Response({"detail": "Not allowed"}, status=403)

        Job.objects.filter(id=job.id).update(is_open=False)
        return Response({"detail": "Job expired"}, status=200)

    # ================= REACTIVATE =================
    @action(detail=True, methods=["post"])
    def reactivate(self, request, pk=None):
        job = self.get_object()

        if job.company != request.user:
            return Response({"detail": "Not allowed"}, status=403)

        Job.objects.filter(id=job.id).update(
          is_open=True,
          application_deadline=timezone.now().date()
          + timezone.timedelta(days=30),
        )

        return Response({"detail": "Job reactivated"}, status=200)

    # ================= DELETE =================
    def perform_destroy(self, instance):
        if instance.company != self.request.user:
            raise PermissionDenied("You do not own this job.")
        instance.delete()

# ================================
# Employer Dashboard Stats
# ================================
class EmployerDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated, IsApprovedCompany]

    def get(self, request):
        user = request.user

        # تأكيد إن Company بس
        if getattr(user, "user_type", "").lower() != "company":
            return Response(
                {"detail": "Not allowed"},
                status=403
            )

        # عدد الوظائف النشطة
        open_jobs = Job.objects.filter(
            company=user,
             is_open=True
        ).count()

        # ✅ عدد المرشحين المحفوظين (الحل هنا)
        saved_candidates = SavedApplication.objects.filter(
            employer=user
        ).count()

        return Response({
            "open_jobs": open_jobs,
            "saved_candidates": saved_candidates,
        })



class AdminCompanyApprovalAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        """
        🔹 List all pending companies (Admin only)
        """
        companies = (
            CompanyProfile.objects
            .filter(status="pending")
            .order_by("-created_at")
        )

        serializer = CompanyProfileSerializer(companies, many=True)
        return Response(serializer.data, status=200)

    def post(self, request, company_id):
        """
        🔹 Approve / Reject company

        Body:
        {
            "action": "approve" | "reject"
        }
        """

        company = get_object_or_404(CompanyProfile, id=company_id)
        action = request.data.get("action")

        if action not in ["approve", "reject"]:
            return Response(
                {"detail": "Action must be 'approve' or 'reject'"},
                status=400,
            )

        # ===== Update status =====
        company.status = "approved" if action == "approve" else "rejected"
        company.reviewed_by = request.user
        company.reviewed_at = timezone.now()
        company.save()

        # ===== Send email verification (ONLY ONCE) =====
        if action == "approve":
            verification, _ = CompanyEmailVerification.objects.get_or_create(
                company_profile=company
            )

            # ⛔ لو Verified خلاص → مفيش Email
            if not verification.is_verified:
                verify_link = (
                    f"{settings.BACKEND_URL}"
                    f"/api/auth/company/verify-email/{verification.token}/"
                )
      

                send_mail(
                    subject="Verify your company email",
                    message=(
                        "Your company has been approved.\n\n"
                        "Please verify your email to activate your company account:\n"
                        f"{verify_link}"
                    ),
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[company.user.email],
                    fail_silently=False,
                )

        return Response(
            {
                "message": f"Company has been {company.status}",
                "company_id": company.id,
                "company_name": company.company_name,
                "status": company.status,
                "reviewed_by": request.user.email,
            },
            status=200,
        )

# ================================
# Job Applications (Kanban)
# ================================
class JobApplicationViewSet(
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet
):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated, IsApprovedCompany]

    # ===============================
    # Queryset حسب نوع اليوزر
    # ===============================
    def get_queryset(self):
        user = self.request.user
        qs = JobApplication.objects.select_related("user", "job")

        user_type = getattr(user, "user_type", "").lower()

        if user_type == "company":
            return qs.filter(job__company=user).order_by("-created_at")

        if user_type == "job_seeker":
            return qs.filter(user=user).order_by("-created_at")

        return JobApplication.objects.none()

    # ===============================
    # ✅ جلب Applications لوظيفة معينة
    # URL:
    # /api/applications/by-job/<job_id>/
    # ===============================
    @action(detail=False, methods=["get"], url_path="by-job/(?P<job_id>[^/.]+)")
    def by_job(self, request, job_id=None):
        user = request.user

        if getattr(user, "user_type", "").lower() != "company":
            return Response({"detail": "Not allowed"}, status=403)

        job = get_object_or_404(Job, id=job_id, company=user)

        applications = (
            JobApplication.objects
            .filter(job=job)
            .select_related("user", "job")
            .order_by("-created_at")
        )

        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data, status=200)

    # ===============================
    # ✅ نقل المرشح بين المراحل
    # URL:
    # /api/applications/<id>/move_stage/
    # ===============================
    @action(detail=True, methods=["post"])
    def move_stage(self, request, pk=None):
        application = self.get_object()
        user = request.user

        if getattr(user, "user_type", "").lower() != "company":
            return Response({"detail": "Not allowed"}, status=403)

        if application.job.company != user:
            return Response({"detail": "Not your job"}, status=403)

        stage = request.data.get("stage")

        allowed = ["applied", "shortlisted", "interview", "rejected"]
        if stage not in allowed:
            return Response({"detail": "Invalid stage"}, status=400)

        application.stage = stage
        application.save(update_fields=["stage"])

        return Response(
            {"id": application.id, "stage": application.stage},
            status=200
        )

    # ===============================
    # ✅ Save / Unsave Candidate
    # URL:
    # /api/applications/<id>/toggle-save/
    # ===============================
    @action(detail=True, methods=["post"], url_path="toggle-save")
    def toggle_save(self, request, pk=None):
        user = request.user
        application = self.get_object()

        if getattr(user, "user_type", "").lower() != "company":
            return Response(
                {"detail": "Only companies can save candidates."},
                status=403,
            )

        if application.job.company != user:
            return Response(
                {"detail": "Not your job application."},
                status=403,
            )

        saved, created = SavedApplication.objects.get_or_create(
            employer=user,
            application=application,
        )

        if not created:
            saved.delete()
            return Response({"saved": False}, status=200)

        return Response({"saved": True}, status=200)

# ================================
# Uploaded CV
# ================================
class UploadedCVViewSet(viewsets.ModelViewSet):
    queryset = UploadedCV.objects.all()
    serializer_class = UploadedCVSerializer


# ================================
# Company Profile CRUD
# ================================
# ================================
# Company Profile CRUD
# ================================
class CompanyProfileViewSet(viewsets.ModelViewSet):
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return CompanyProfile.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        """
        GET /api/company-profiles/
        - لو الشركة معندهاش profile → نعمله تلقائي (pending)
        """
        profile = CompanyProfile.objects.filter(user=request.user).first()

        if not profile:
            profile = CompanyProfile.objects.create(
                user=request.user,
                status="pending",
            )

        serializer = self.get_serializer(profile)
        return Response([serializer.data], status=200)

    def create(self, request, *args, **kwargs):
        """
        POST /api/company-profiles/
        - تحديث أو إنشاء (Step 1)
        """
        profile = CompanyProfile.objects.filter(user=request.user).first()

        if profile:
            serializer = self.get_serializer(profile, data=request.data, partial=True)
        else:
            serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=200)

    def partial_update(self, request, *args, **kwargs):
        instance, _ = CompanyProfile.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=200)


# ✅ لازم تبقى برا الـ ViewSet (Top-level)
class MyCompanyProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        profile, _ = CompanyProfile.objects.get_or_create(
            user=request.user,
            defaults={"status": "pending"}
        )
        serializer = CompanyProfileSerializer(profile)
        return Response(serializer.data, status=200)

    def patch(self, request):
        profile, _ = CompanyProfile.objects.get_or_create(
            user=request.user,
            defaults={"status": "pending"}
        )
        serializer = CompanyProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=200)

class CompanyPublicProfileViewSet(viewsets.ModelViewSet):
    serializer_class = CompanyPublicProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CompanyPublicProfile.objects.filter(
            company__user=self.request.user
        )

    def list(self, request, *args, **kwargs):
        company_profile = request.user.company_profile

        profile, _ = CompanyPublicProfile.objects.get_or_create(
            company=company_profile
        )

        serializer = self.get_serializer(profile)
        return Response([serializer.data], status=200)

    def create(self, request, *args, **kwargs):
        company_profile = request.user.company_profile

        profile, _ = CompanyPublicProfile.objects.get_or_create(
            company=company_profile
        )

        serializer = self.get_serializer(
            profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=200)

# ================================
# Social Links
# ================================
class SocialLinkViewSet(viewsets.ModelViewSet):
    serializer_class = SocialLinkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SocialLink.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ================================
# AI MODEL CALLER
# ================================
def call_ai_model(prompt: str):
    HF_URL = "https://router.huggingface.co/hf-inference"
    HF_TOKEN = os.getenv("HF_TOKEN")

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",

        "Content-Type": "application/json",
    }

    payload = {
        "model": "tahamo/qwen-job-description-ft4",
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 400,
            "temperature": 0.2,
            "do_sample": False,
        },
    }

    response = requests.post(HF_URL, headers=headers, json=payload)

    print("\n\n========= HF RAW RESPONSE =========")
    print("Status:", response.status_code)
    print(response.text)
    print("===================================\n\n")

    if response.status_code != 200:
        raise Exception("HF Error: " + response.text)

    try:
        data = response.json()

        if isinstance(data, list) and "generated_text" in data[0]:
            return data[0]["generated_text"]

        return response.text
    except Exception:
        return response.text


# ================================
# PROMPT TEMPLATE
# ================================
AI_PROMPT_TEMPLATE = """
Your task:
- matching_analysis: Recommend 3 job titles.
- description: Provide 2 brief summary sentences.
- recommendation: Provide 3 improvement actions for each job title.

Return ONLY valid JSON.

{
  "matching_analysis": [
    {"job_title": "Job 1"},
    {"job_title": "Job 2"},
    {"job_title": "Job 3"}
  ],
  "description": [
    "Sentence 1",
    "Sentence 2"
  ],
  "recommendation": [
    {"job_title": "Job 1", "action": "Action 1"},
    {"job_title": "Job 2", "action": "Action 2"},
    {"job_title": "Job 3", "action": "Action 3"}
  ]
}

CV DATA:
Skills: {skills}
Education: {education}
Experience: {experience}
Projects: {projects}
"""


def sanitize_json(raw_text):
    cleaned = raw_text.strip()

    if "{" in cleaned:
        cleaned = cleaned[cleaned.find("{") :]

    if "}" in cleaned:
        cleaned = cleaned[: cleaned.rfind("}") + 1]

    cleaned = cleaned.lstrip("\n").lstrip(" ").lstrip("\t")
    return cleaned


# ================================
# Analyze CV
# ================================
from .models import CVProfile

@api_view(["POST"])
def analyze_cv_view(request):
    try:
        user = request.user
        if not user or user.is_anonymous:
            return Response({"error": "Unauthorized"}, status=401)

        # ✅ اقرأ من CVProfile (المصدر الموحد)
        profile = CVProfile.objects.filter(user=user).first()
        if not profile:
            return Response({"error": "No CV profile found"}, status=404)

        cv_data = profile.cv_json or {}

        prompt = AI_PROMPT_TEMPLATE.format(
            skills=cv_data.get("skills") or "N/A",
            education=cv_data.get("educations") or "N/A",
            experience=cv_data.get("experiences") or "N/A",
            projects=cv_data.get("projects") or "N/A",
        )

        ai_text = call_ai_model(prompt)

        cleaned = sanitize_json(ai_text)
        result = json.loads(cleaned)

        AIAnalysis.objects.create(
            user=user,
            cv=None,  # 👈 أو احذفه لو الحقل nullable
            job_suggestion=str(result.get("matching_analysis")),
            missing_skills=str(result.get("description")),
            recommendations=str(result.get("recommendation")),
            full_analysis_text=cleaned,
        )

        return Response(result, status=200)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)


# ================================
# AI History
# ================================
@api_view(["GET"])
def user_ai_analyses(request):
    data = [
        {
            "id": a.id,
            "created_at": a.created_at,
            "matching": a.job_suggestion,
            "description": a.missing_skills,
            "recommendations": a.recommendations,
        }
        for a in AIAnalysis.objects.filter(user=request.user).order_by(
            "-created_at"
        )
    ]
    return Response(data)


# ================================
# Authentication
# ================================
from .models import UserEmailVerification
from django.conf import settings

class RegisterUserAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        user = serializer.save()

        # ✅ Email Verification للـ Job Seeker فقط
        if user.user_type == "job_seeker":
            verification = UserEmailVerification.objects.create(user=user)

            verify_link = f"{settings.FRONTEND_URL}/auth/user/verify-email/{verification.token}"


            send_mail(
                subject="Verify your email",
                message=f"Click the link to verify your email:\n{verify_link}",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=False,
            )

        return Response(
            {"message": "User registered successfully. Please verify your email."},
            status=201,
        )

cUser = get_user_model()

class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response(
                {"detail": ["Email and password are required"]},
                status=400
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": ["Invalid credentials"]},
                status=400
            )

        # التأكد من حالة الحساب (مفعل أم لا)
        if not user.is_active:
            return Response(
                {"detail": ["Please verify your email first"]},
                status=400
            )

        if not user.check_password(password):
            return Response(
                {"detail": ["Invalid credentials"]},
                status=400
            )

        # ✅ توليد التوكنات (هذا هو الجزء الذي كان ناقصاً)
        refresh = RefreshToken.for_user(user)
        
        # ✅ تحديث حالة المستخدم كـ Online إذا كانت الدالة موجودة
        if hasattr(user, 'mark_online'):
            user.mark_online()

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "id": user.id,
            "email": user.email,
            "full_name": getattr(user, "full_name", ""), # إضافة الاسم لو موجود
            "user_type": getattr(user, "user_type", None),
            "message": "Login successful"
        }, status=200)

class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.mark_offline()
        return Response({"message": "Logged out"})


class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, 400)


class CloseAccountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        CV.objects.filter(user=user).delete()
        AIAnalysis.objects.filter(user=user).delete()
        user.delete()
        return Response({"message": "Account deleted"})


class HeartbeatAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.mark_online()
        return Response({"status": "ok"})

class InterviewVideoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/interview-videos/
    يرجّع كل فيديوهات الانترفيو الخاصة باليوزر الحالي فقط
    """

    serializer_class = InterviewVideoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            InterviewVideo.objects
            .filter(session__user=self.request.user)
            .order_by("-uploaded_at")
        )

class ActiveUsersAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.order_by("-is_active_session", "-last_seen")


# ================================
# Settings (GET + PUT)
# ================================
class SettingsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cv = CV.objects.filter(user=request.user).first()
        profile = CompanyProfile.objects.filter(user=request.user).first()
        return Response(
            {
                "user": UserSerializer(request.user).data,
                "cv": CVSerializer(cv).data if cv else {},
                "company_profile": CompanyProfileSerializer(profile).data
                if profile
                else {},
            }
        )

    def put(self, request):
        user_data = request.data.get("user", {})
        cv_data = request.data.get("cv", {})
        company_data = request.data.get("company_profile", {})

        responses = {}

        if user_data:
            user_serializer = UserSerializer(
                request.user, data=user_data, partial=True
            )
            if user_serializer.is_valid():
                user_serializer.save()
                responses["user"] = user_serializer.data
            else:
                return Response(
                    {"user_errors": user_serializer.errors}, status=400
                )

        if cv_data:
            cv_obj, _ = CV.objects.get_or_create(user=request.user)
            cv_serializer = CVSerializer(cv_obj, data=cv_data, partial=True)
            if cv_serializer.is_valid():
                cv_serializer.save(user=request.user)
                responses["cv"] = cv_serializer.data
            else:
                return Response(
                    {"cv_errors": cv_serializer.errors}, status=400
                )

        if company_data:
            company_obj, _ = CompanyProfile.objects.get_or_create(
                user=request.user
            )
            company_serializer = CompanyProfileSerializer(
                company_obj, data=company_data, partial=True
            )
            if company_serializer.is_valid():
                company_serializer.save(user=request.user)
                responses["company_profile"] = company_serializer.data
            else:
                return Response(
                    {"company_errors": company_serializer.errors},
                    status=400,
                )

        if not responses:
            cv = CV.objects.filter(user=request.user).first()
            profile = CompanyProfile.objects.filter(
                user=request.user
            ).first()
            return Response(
                {
                    "user": UserSerializer(request.user).data,
                    "cv": CVSerializer(cv).data if cv else {},
                    "company_profile": CompanyProfileSerializer(
                        profile
                    ).data
                    if profile
                    else {},
                }
            )

        return Response(responses, status=200)



class PersonalSettingsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        user = request.user
        cv = CV.objects.filter(user=user).first()

        return Response({
            "full_name": user.full_name or "",
            "headline": getattr(user, "headline", "") or "",
            "experience": getattr(user, "experience", "") or "",
            "education": getattr(user, "education", "") or "",
           "profile_picture_url": (
    request.build_absolute_uri(user.profile_picture.url)
    if user.profile_picture
    else None
),

            # CV
            "first_name": cv.first_name if cv else "",
            "last_name": cv.last_name if cv else "",
            "email": cv.email if cv else user.email,
            "phone": cv.phone if cv else "",
            "location": cv.location if cv else "",
            "linkedin": cv.linkedin if cv else "",
            "objective": cv.objective if cv else "",
        })

    def put(self, request):
        user = request.user

        # ===== User fields =====
        user.full_name = request.data.get("full_name", user.full_name)
        user.headline = request.data.get("headline", getattr(user, "headline", ""))
        user.experience = request.data.get("experience", getattr(user, "experience", ""))
        user.education = request.data.get("education", getattr(user, "education", ""))

        if "profile_picture" in request.FILES:
            user.profile_picture = request.FILES["profile_picture"]

        user.save()

        # ===== CV fields =====
        cv, _ = CV.objects.get_or_create(user=user)

        cv.first_name = request.data.get("first_name", cv.first_name)
        cv.last_name = request.data.get("last_name", cv.last_name)
        cv.email = request.data.get("email", cv.email)
        cv.phone = request.data.get("phone", cv.phone)
        cv.location = request.data.get("location", cv.location)
        cv.linkedin = request.data.get("linkedin", cv.linkedin)
        cv.objective = request.data.get("objective", cv.objective)

        cv.save()

        return Response({"message": "Personal settings updated successfully"}, status=200)

class AccountSettingsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = UserSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Updated"})
        return Response(serializer.errors, 400)


class PasswordChangeAPIView(generics.CreateAPIView):
    """
    Change password for authenticated user
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PasswordChangeSerializer


# ================= JD-based CV Recommendations =================
class CVRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, 404)

        scored = []
        for cv in CV.objects.all():
            text = f"{cv.skills} {cv.experiences}"
            score = match_score(text, job.description)
            if score > 0:
                scored.append((score, cv))

        scored.sort(reverse=True)
        return Response(
            CVSerializer([cv for _, cv in scored], many=True).data
        )


class JobRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, cv_id):
        try:
            cv = CV.objects.get(id=cv_id)
        except CV.DoesNotExist:
            return Response({"error": "CV not found"}, status=404)

       

        today = timezone.now().date()

        scored = []

        # ✅ اليوزر يشوف Active jobs فقط
        jobs_qs = Job.objects.filter(is_open=True)



        for job in jobs_qs:
            text = f"{job.title or ''} {job.description or ''} {job.requirements or ''}"
            score = match_score(
                f"{cv.skills or ''} {cv.experiences or ''}",
                text
            )

            if score and score > 0:
                scored.append((score, job))

        # ترتيب تنازلي حسب السكور
        scored.sort(key=lambda x: x[0], reverse=True)

        return Response(
            JobSerializer([job for _, job in scored], many=True).data,
            status=200
        )




# ============================
# USER RECOMMENDED JOBS (FIXED)
# ============================

class UserRecommendedJobsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        profile = CVProfile.objects.filter(user=user).first()
        if not profile:
            return Response({"error": "No CV profile found"}, status=404)

        cv_data = profile.cv_json or {}

        country = request.GET.get("country")

        try:
            limit = int(request.GET.get("limit", 20))
        except (TypeError, ValueError):
            limit = 20

        try:
            threshold = float(request.GET.get("threshold", 0.3))
        except (TypeError, ValueError):
            threshold = 0.3

        # ✅ اليوزر يشوف Active jobs فقط
        qs = Job.objects.filter(is_open=True).order_by("-created_at")

        # ✅ فلترة الدولة (لو موجودة)
        if country:
            qs = qs.filter(
                Q(country__icontains=country)
                | Q(country__iexact="Remote")
                | Q(country__isnull=True)
                | Q(country__exact="")
            )

        def normalize_field(value):
            if isinstance(value, (list, tuple, set)):
                return " ".join(str(v) for v in value if v)
            if isinstance(value, dict):
                return " ".join(str(v) for v in value.values() if v)
            if value is None:
                return ""
            return str(value)

        # ✅ ابنِ cv_text من cv_data (مش من CV model)
        cv_text = " ".join([
            normalize_field(cv_data.get("objective", "")),
            normalize_field(cv_data.get("summary", "")),
            normalize_field(cv_data.get("skills", "")),
            normalize_field(cv_data.get("experiences", "")),
            normalize_field(cv_data.get("educations", "")),
            normalize_field(cv_data.get("projects", "")),
        ]).strip()

        cv_objective_str = normalize_field(cv_data.get("objective", ""))  # ✅ بدل cv

        scored = []

        for job in qs:
            job_text = " ".join([
                normalize_field(getattr(job, "title", "")),
                normalize_field(getattr(job, "description", "")),
                normalize_field(getattr(job, "requirements", "")),
                normalize_field(getattr(job, "tags", "")),
                normalize_field(getattr(job, "role", "")),
            ]).strip()

            job_title_str = normalize_field(getattr(job, "title", ""))

            title_match = False
            if cv_objective_str and job_title_str:
                title_match = any(
                    word in job_title_str.lower()
                    for word in cv_objective_str.lower().split()
                )

            score = match_score(cv_text, job_text) or 0.0

            if title_match or score >= threshold:
                final_score = 1.0 if title_match else score
                scored.append((final_score, job))

        scored.sort(key=lambda x: x[0], reverse=True)
        jobs_only = [job for (_, job) in scored[:limit]]

        serializer = JobSerializer(jobs_only, many=True)
        return Response(serializer.data, status=200)

# ================== APPLY TO JOB ==================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def apply_to_job(request, job_id):
    user = request.user

    # السماح للـ Job Seeker فقط
    if getattr(user, "user_type", "") != "job_seeker":
        return Response(
            {"detail": "Only job seekers can apply for jobs."},
            status=403,
        )

    # التأكد إن الوظيفة موجودة ونشطة
    try:
        job = Job.objects.get(id=job_id, is_open=True)
    except Job.DoesNotExist:
        return Response({"detail": "Job not found."}, status=404)

    # منع التقديم مرتين
    if JobApplication.objects.filter(job=job, user=user).exists():
        return Response(
            {"detail": "You have already applied to this job."},
            status=400,
        )

    # إنشاء Application بدون حقول مش موجودة
    JobApplication.objects.create(
        job=job,
        user=user,
    )

    return Response(
        {"message": "Application submitted successfully."},
        status=201
    )


# ================= LINKEDIN JOBS API =================
@csrf_exempt
@api_view(["GET"])
@permission_classes([AllowAny])
def linkedin_jobs(request):
    keywords = request.GET.get("keywords", "")
    location = request.GET.get("location", "Egypt")

    try:
        search_url = (
            f"https://www.linkedin.com/jobs/search/?keywords={keywords}&location={location}"
        )
        headers = {"User-Agent": "Mozilla/5.0"}
        html = requests.get(search_url, headers=headers).text
        soup = BeautifulSoup(html, "html.parser")

        jobs = []
        cards = soup.select(".base-card__info")
        for card in cards[:10]:
            title_el = card.select_one("h3")
            company_el = card.select_one(".base-search-card__subtitle")
            link_el = card.find_parent("a")

            if title_el and company_el and link_el:
                jobs.append(
                    {
                        "title": title_el.get_text(strip=True),
                        "company": company_el.get_text(strip=True),
                        "link": link_el["href"],
                        "location": location,
                    }
                )

        return JsonResponse(jobs, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ================= Search Jobs (match) =================
@api_view(["GET"])
@permission_classes([AllowAny])
def company_jobs_match(request):
    q = request.GET.get("q", "").strip()
    if not q:
        return Response({"jobs": []})

    today = timezone.now().date()

    qs = Job.objects.filter(
    Q(title__icontains=q)
    | Q(description__icontains=q)
    | Q(requirements__icontains=q),
    is_open=True
).order_by("-created_at")[:12]


    serializer = JobSerializer(qs, many=True)
    return Response({"jobs": serializer.data}, status=200)


# ================= FREELANCE JOBS =================
@api_view(["GET"])
@permission_classes([AllowAny])
def freelance_jobs(request):
    query = request.GET.get("query", "developer")
    limit = int(request.GET.get("limit", 100))
    location = request.GET.get("location", "").strip().lower()

    upwork_jobs = fetch_upwork_jobs(query, total_limit=limit)

    if location:
        filtered = []
        for job in upwork_jobs:
            country_field = (job.get("country") or "").lower()
            desc = (job.get("description") or "").lower()
            title = (job.get("title") or "").lower()

            if (
                location in country_field
                or location in desc
                or location in title
            ):
                filtered.append(job)

        if len(filtered) >= 5:
            upwork_jobs = filtered

    return Response(
        {
            "query": query,
            "location": location,
            "count": len(upwork_jobs),
            "results": upwork_jobs,
        }
    )


# ================== INTERVIEW TRAINER APIs ==================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_interview_questions(request):
    questions = InterviewQuestion.objects.all()
    return Response(InterviewQuestionSerializer(questions, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_interview_session(request):
    session = InterviewSession.objects.create(user=request.user)
    return Response({"session_id": session.id}, status=201)


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def upload_interview_video(request):
    user = request.user
    session_id = request.POST.get("session_id")
    question_id = request.POST.get("question_id")

    if not session_id:
        return Response({"error": "session_id is required"}, status=400)

    try:
        session = InterviewSession.objects.get(id=session_id, user=user)
    except InterviewSession.DoesNotExist:
        return Response({"error": "Session not found"}, status=404)

    video_file = request.FILES.get("video")
    if not video_file:
        return Response({"error": "No video uploaded"}, status=400)

    question = None
    if question_id:
        try:
            question = InterviewQuestion.objects.get(id=question_id)
        except InterviewQuestion.DoesNotExist:
            question = None

    video_obj = InterviewVideo.objects.create(
        session=session,
        question=question,
        video=video_file,
    )

    feedback_text = (
        "Thank you for your answer! "
        "Try to speak a bit slower, keep eye contact with the camera, "
        "and mention 2–3 concrete skills or achievements that match this job."
    )

    video_obj.feedback = feedback_text
    video_obj.save()

    return Response(
        {
            "message": "Video uploaded successfully",
            "video_url": video_obj.video.url,
            "feedback": feedback_text,
        },
        status=201,
    )



import os
from django.http import JsonResponse
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser



# ==========================================
# 1. Resume/CV Analysis Endpoint
# ==========================================
AI_CV_SERVICE_URL = "https://your-pod-id-8080.proxy.runpod.net/analyze-cv"

@api_view(['POST'])
@parser_classes([JSONParser])
def process_cv_analysis(request):
    """
    بياخد نص الـ CV من الفرونت إند ويبعته للموديل
    Input JSON: { "cv_text": "اسمى احمد وعندي خبرة في..." }
    """
    try:
        cv_text = request.data.get('cv_text')

        if not cv_text:
            return Response({"error": "No CV text provided"}, status=400)

        # 1. إرسال النص لخدمة الـ AI
        print("📡 Sending CV text to AI Service...")
        
        payload = {"cv_text": cv_text}
        
        # الـ CV عادة أسرع من الفيديو فممكن timeout يكون دقيقتين (120 ثانية)
        response = requests.post(AI_CV_SERVICE_URL, json=payload, timeout=120)

        if response.status_code == 200:
            ai_results = response.json()
            
            # 2. (اختياري) تخزين النتيجة في قاعدة بيانات Neon
            # هنا ممكن تعمل Update للـ Profile بتاع المستخدم بالبيانات اللي رجعت
            # user_profile = request.user.profile
            # user_profile.suggested_jobs = ai_results.get('matching_analysis')
            # user_profile.save()

            return Response(ai_results, status=200)
        else:
            return Response({
                "error": "AI CV Service Error",
                "details": response.text
            }, status=response.status_code)

    except requests.exceptions.Timeout:
        return Response({"error": "AI Service is taking too long to respond."}, status=504)
    except Exception as e:
        print(f"❌ CV Error: {str(e)}")
        return Response({"error": str(e)}, status=500)


# ==========================================
# 2. Interview Video Analysis Endpoint
# ==========================================
# حط هنا رابط الـ RunPod بتاعك (المنتهي بـ 8080)
AI_SERVICE_URL = "https://47uxbmdpup3zor-7878.proxy.runpod.net/analyze-interview"

import os
from django.conf import settings # عشان نوصل للـ MY_PUBLIC_URL

@api_view(['POST'])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def process_interview(request):
    video_url = None

    try:
        # 1. لو المستخدم بعت لينك جاهز (مثلاً من يوتيوب أو كلاود)
        if 'video_url' in request.data:
            video_url = request.data['video_url']
        
        # 2. لو المستخدم رفع فيديو كملف (وهنا السحر بتاع نجروك)
        elif 'video' in request.FILES:
            video_file = request.FILES['video_url']
            
            # حفظ الملف في الداتا بيز (أو مانيوال في الميديا)
            # لنفترض إنك بتستخدم موديل اسمه InterviewVideo
            from .models import InterviewVideo
            new_vid = InterviewVideo.objects.create(user=request.user, video=video_file)
            
            # بناء الرابط باستخدام الـ Ngrok
            # الرابط بيبقى: لينك نجروك + مسار الميديا + اسم الفيديو
            public_base = os.getenv("MY_PUBLIC_URL").strip('/') # https://59e3b862d391.ngrok-free.app
            video_path = new_vid.video.url # مثلاً /media/interview_videos/vid.mp4
            
            video_url = f"{public_base}{video_path}"
            print(f"🔗 Public URL generated via Ngrok: {video_url}")

        if not video_url:
            return Response({"error": "No video source provided"}, status=400)

        # 3. إرسال الرابط للـ AI Service (الـ RunPod)
        payload = {"video_url": video_url}
        response = requests.post(AI_SERVICE_URL, json=payload, timeout=600)

        if response.status_code == 200:
            ai_results = response.json()
            # 3. هنا تقدر تخزن النتيجة في الـ Database بتاعتك (Neon) قبل ما ترجعها
            # user_profile.interview_analysis = ai_results['analysis']
            # user_profile.save()
            
            return Response(ai_results, status=200)
        else:
            return Response({
                "error": "AI Service Error",
                "details": response.text
            }, status=response.status_code)

    except requests.exceptions.Timeout:
        return Response({"error": "AI Service timed out. Video might be too long."}, status=504)
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return Response({"error": str(e)}, status=500)




@api_view(["POST"])
@permission_classes([IsAuthenticated])
def end_interview_session(request):
    session_id = request.data.get("session_id")

    try:
        session = InterviewSession.objects.get(
            id=session_id, user=request.user
        )
        session.ended_at = timezone.now()
        session.save()
        return Response({"message": "Session ended"})
    except InterviewSession.DoesNotExist:
        return Response({"error": "Session not found"}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated]) # لازم يكون مسجل دخول
def get_user_interview_videos(request):
    """
    جلب جميع فيديوهات المقابلات الخاصة بالمستخدم الحالي فقط
    """
    user = request.user
    # بنجيب الفيديوهات اللي الـ user بتاعها هو الشخص اللي باعت الريكويست
    videos = InterviewVideo.objects.filter(user=user).order_by('-created_at')
    
    serializer = InterviewVideoSerializer(videos, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_latest_user_interview_video(request):
    last_video = (
        InterviewVideo.objects.filter(session__user=request.user)
        .order_by("-uploaded_at")
        .first()
    )

    if not last_video:
        return Response({"has_video": False}, status=200)

    return Response(
        {
            "has_video": True,
            "video_url": last_video.video.url,
            "feedback": last_video.feedback,
        },
        status=200,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_interview_video_base64(request):
    user = request.user

    question_id = request.data.get("question_id")
    session_id = request.data.get("session_id")
    file = request.FILES.get("video")

    if not file:
        return Response({"error": "No video uploaded"}, status=400)

    if session_id:
        try:
            session = InterviewSession.objects.get(
                id=session_id, user=user
            )
        except InterviewSession.DoesNotExist:
            session = InterviewSession.objects.create(user=user)
    else:
        session = InterviewSession.objects.create(user=user)

    question = None
    if question_id:
        try:
            question = InterviewQuestion.objects.get(id=question_id)
        except InterviewQuestion.DoesNotExist:
            question = None

    video_obj = InterviewVideo.objects.create(
        session=session,
        question=question,
        video=file,
    )

    return Response(
        {
            "message": "Video uploaded successfully",
            "session_id": session.id,
            "video_id": video_obj.id,
        }
    )


# ================== PASSWORD RESET (OTP) ==================
@api_view(["POST"])
@permission_classes([AllowAny])
def request_password_reset(request):
    try:
        email = request.data.get("email")

        if not email:
            return Response({"error": "Email is required"}, status=400)

        if not User.objects.filter(email=email).exists():
            return Response({"error": "Email not found"}, status=404)

        code = str(random.randint(100000, 999999))

        PasswordResetOTP.objects.filter(email=email).delete()
        PasswordResetOTP.objects.create(email=email, code=code)

        send_mail(
            subject="Your Password Reset Code",
            message=f"Your password reset code is: {code}",
            from_email=os.getenv("EMAIL_HOST_USER"),
            recipient_list=[email],
            fail_silently=False,
        )

        return Response({"message": "OTP sent to your email"}, status=200)

    except Exception as e:
        print("🔥 ERROR request_password_reset:", e)
        return Response(
            {"error": "Internal server error", "details": str(e)},
            status=500,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_reset_code(request):
    email = request.data.get("email")
    code = request.data.get("code")

    if not email or not code:
        return Response({"error": "Email and code are required"}, 400)

    try:
        otp = PasswordResetOTP.objects.get(email=email, code=code)
    except PasswordResetOTP.DoesNotExist:
        return Response({"error": "Invalid code"}, 400)

    if otp.is_expired():
        otp.delete()
        return Response({"error": "Code expired"}, 400)

    return Response({"message": "Code verified"}, status=200)


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request):
    email = request.data.get("email")
    new_password = request.data.get("password")

    if not email or not new_password:
        return Response(
            {"error": "Email and password are required"}, 400
        )

    try:
        otp = PasswordResetOTP.objects.get(email=email)
    except PasswordResetOTP.DoesNotExist:
        return Response(
            {"error": "No valid reset request for this email"}, 400
        )

    if otp.is_expired():
        otp.delete()
        return Response({"error": "Code expired"}, 400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, 404)

    user.set_password(new_password)
    user.save()

    PasswordResetOTP.objects.filter(email=email).delete()

    return Response(
        {"message": "Password reset successful"}, status=200
    )

# ================================
# Saved Applications (Saved Candidates)
# ================================
class SavedApplicationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SavedApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedCompany]

    def get_queryset(self):
        user = self.request.user
        user_type = getattr(user, "user_type", "").lower()

        if user_type != "company":
            return SavedApplication.objects.none()

        return (
            SavedApplication.objects
            .filter(employer=user)
            .select_related("application__user", "application__job")  # ✅ فقط دول
            .order_by("-id")
        )





@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_saved_job(request, job_id):
    user = request.user

    if getattr(user, "user_type", "") != "job_seeker":
        return Response(
            {"detail": "Only job seekers can save jobs."},
            status=403
        )

    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        return Response({"detail": "Job not found"}, status=404)

    saved, created = SavedJob.objects.get_or_create(
        user=user,
        job=job
    )

    if not created:
        saved.delete()
        return Response({"saved": False})

    return Response({"saved": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_saved_jobs(request):
    qs = (
        SavedJob.objects
        .filter(
            user=request.user,
            job__isnull=False  # ✅ مهم جدًا
        )
        .select_related("job", "job__company")
        .order_by("-created_at")
    )

    serializer = SavedJobSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_applied_jobs(request):
    """
    Return all jobs that the current job seeker has applied to
    """
    user = request.user

    if getattr(user, "user_type", "") != "job_seeker":
        return Response(
            {"detail": "Only job seekers can view applied jobs."},
            status=403
        )

    applications = (
        JobApplication.objects
        .filter(user=user)
        .select_related("job", "job__company")
        .order_by("-created_at")
    )

    jobs = [app.job for app in applications]

    serializer = JobSerializer(jobs, many=True)
    return Response(serializer.data, status=200)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def job_applications_for_job(request, job_id):
    user = request.user

    # الشركة بس
    if getattr(user, "user_type", "").lower() != "company":
        return Response({"detail": "Not allowed"}, status=403)

    job = get_object_or_404(Job, id=job_id, company=user)

    applications = (
        JobApplication.objects
        .filter(job=job)
        .select_related("user", "job")
        .order_by("-created_at")
    )

    serializer = JobApplicationSerializer(applications, many=True)
    return Response(serializer.data, status=200)
# ================================
# Company Verification API (FINAL FIX)
# ================================
class CompanyVerificationAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        user = request.user

        if user.user_type != "company":
            return Response({"detail": "Not allowed"}, status=403)

        company_profile = CompanyProfile.objects.filter(user=user).first()
        if not company_profile:
            return Response({"detail": "Company profile not found"}, status=404)

        verification = CompanyVerification.objects.filter(
            company_profile=company_profile
        ).first()

        # ✅ رجّع نفس الحقول اللي الفرونت مستنيها
        if not verification:
            return Response(
                {
                    "business_email": "",
                    "commercial_register_number": "",
                    "tax_id": "",
                    "verification_document": None,
                },
                status=200,
            )

        return Response(
            {
                "business_email": verification.business_email,
                "commercial_register_number": verification.commercial_register_number,
                "tax_id": verification.tax_id,
                "verification_document": (
                    verification.verification_document.url
                    if verification.verification_document
                    else None
                ),
            },
            status=200,
        )

    def post(self, request):
        user = request.user

        if user.user_type != "company":
            return Response({"detail": "Not allowed"}, status=403)

        company_profile = CompanyProfile.objects.filter(user=user).first()
        if not company_profile:
            return Response({"detail": "Company profile not found"}, status=404)

        verification, _ = CompanyVerification.objects.get_or_create(
            company_profile=company_profile
        )

        # ✅ حفظ يدوي (عشان نضمن القيم)
        verification.business_email = request.data.get("business_email", "")
        verification.commercial_register_number = request.data.get(
            "commercial_register_number", ""
        )
        verification.tax_id = request.data.get("tax_id", "")

        if "verification_document" in request.FILES:
            verification.verification_document = request.FILES["verification_document"]

        verification.is_completed = True
        verification.save()

        return Response(
            {
                "message": "Verification saved successfully",
                "business_email": verification.business_email,
                "commercial_register_number": verification.commercial_register_number,
                "tax_id": verification.tax_id,
            },
            status=200,
        )
    

    # ================================
# Verify Email (Job Seeker only)
# ================================


class VerifyEmailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        verification = get_object_or_404(
            UserEmailVerification,
            token=token
        )

        if verification.is_verified:
            return Response(
                {"message": "Email already verified"},
                status=200
            )

        verification.is_verified = True
        verification.save()

        return Response(
            {"message": "Email verified successfully"},
            status=200
        )
class VerifyCompanyEmailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        verification = get_object_or_404(
            CompanyEmailVerification,
            token=token
        )

        if verification.is_verified:
            return Response(
                {
                    "status": "already_verified",
                    "message": "Company email already verified"
                },
                status=200
            )

        verification.is_verified = True
        verification.save()

        return Response(
            {
                "status": "verified",
                "message": "Company email verified successfully"
            },
            status=200
        )

# ================================
# Resend Email Verification
# ================================


class ResendEmailVerificationAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response(
                {"detail": "Email is required"},
                status=400
            )

        user = User.objects.filter(email=email).first()
        if not user:
            return Response(
                {"detail": "User not found"},
                status=404
            )

        # ❌ الشركة/Admin ملهمش Verification
        if user.user_type != "job_seeker":
            return Response(
                {"detail": "Email verification is not required for this account"},
                status=403
            )

        verification = getattr(user, "email_verification", None)

        if not verification:
            verification = UserEmailVerification.objects.create(user=user)

        if verification.is_verified:
            return Response(
                {"detail": "Email already verified"},
                status=400
            )

        # ✅ نفس مسار Register بالظبط
        verify_link = (
            f"{settings.FRONTEND_URL}"
            f"/auth/user/verify-email/{verification.token}"
        )

        send_mail(
            subject="Verify your email",
            message=f"Click the link to verify your email:\n{verify_link}",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(
            {"message": "Verification email sent again"},
            status=200
        )


# ================================
# CV PROFILE + PDF (LATEST / UPLOAD)
# ================================

from django.shortcuts import get_object_or_404
from django.http import FileResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.contrib.auth import get_user_model

from .models import CVProfile, CVPdf, JobApplication, SavedApplication

User = get_user_model()


# core/views.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import CVProfile
from .utils import build_full_cv_text_from_json


class CVProfileAPIView(APIView):
    """
    GET  /api/cv/profile/  -> يرجع cv_json + cv_text + updated_at (تيبل واحدة)
    POST /api/cv/profile/  -> يحفظ cv_json + يبني cv_text تلقائي
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        obj = CVProfile.objects.filter(user=request.user).first()
        if not obj:
            return Response({"cv_json": {}, "cv_text": "", "updated_at": None}, status=200)

        return Response(
            {
                "cv_json": obj.cv_json or {},
                "cv_text": obj.cv_text or "",
                "updated_at": obj.updated_at,
            },
            status=200,
        )

    def post(self, request):
        obj, _ = CVProfile.objects.get_or_create(user=request.user)

        cv_json = request.data.get("cv_json")
        if cv_json is None:
            cv_json = obj.cv_json or {}

        obj.cv_json = cv_json

        # ✅ rebuild cv_text من json
        obj.cv_text = build_full_cv_text_from_json(obj.cv_json or {})
        obj.save(update_fields=["cv_json", "cv_text", "updated_at"])

        return Response(
            {
                "cv_json": obj.cv_json or {},
                "cv_text": obj.cv_text or "",
                "updated_at": obj.updated_at,
            },
            status=200,
        )


from django.db import transaction
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .models import CVPdf

class CVPdfUploadAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def post(self, request):
        file = request.FILES.get("file")
        kind = (request.data.get("kind", "final") or "final").lower()

        if not file:
            return Response({"detail": "file is required"}, status=400)

        obj = CVPdf.objects.filter(user=request.user, kind=kind).first()

        if obj:
            # ✅ احفظ مسار الملف القديم عشان نحذفه
            old_file_name = obj.file.name if obj.file else None

            # ✅ حدّث السجل نفسه
            obj.file = file
            obj.filename = getattr(file, "name", "CV.pdf")
            obj.version = (obj.version or 0) + 1
            obj.is_latest = True

            try:
                obj.sha256 = obj.compute_sha256()
            except Exception:
                pass

            obj.save()

            # ✅ احذف الملف القديم من storage (بعد الحفظ)
            if old_file_name and old_file_name != obj.file.name:
                try:
                    obj.file.storage.delete(old_file_name)
                except Exception:
                    pass

            return Response(
                {
                    "id": obj.id,
                    "kind": obj.kind,
                    "version": obj.version,
                    "file_url": obj.file.url if obj.file else None,
                    "filename": obj.filename,
                    "is_latest": obj.is_latest,
                },
                status=status.HTTP_200_OK,
            )

        # ✅ أول مرة
        obj = CVPdf.objects.create(
            user=request.user,
            file=file,
            filename=getattr(file, "name", "CV.pdf"),
            kind=kind,
            version=1,
            is_latest=True,
        )

        try:
            obj.sha256 = obj.compute_sha256()
            obj.save(update_fields=["sha256"])
        except Exception:
            pass

        return Response(
            {
                "id": obj.id,
                "kind": obj.kind,
                "version": obj.version,
                "file_url": obj.file.url if obj.file else None,
                "filename": obj.filename,
                "is_latest": obj.is_latest,
            },
            status=status.HTTP_201_CREATED,
        )


from django.shortcuts import get_object_or_404
from django.http import FileResponse
from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.contrib.auth import get_user_model
from .models import CVPdf, JobApplication, SavedApplication

User = get_user_model()

from django.db.models import Q
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.core.exceptions import FieldError

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import User, CVPdf, JobApplication, SavedApplication


class CVPdfLatestAPIView(APIView):
    """
    GET /api/cv/pdf/latest/?candidate_id=123&kind=final&view=1
    - view=1 => inline (عرض في تاب)
    - view=0 => attachment (تحميل)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        kind = request.GET.get("kind", "final")
        candidate_id = request.GET.get("candidate_id")
        view_mode = request.GET.get("view", "1")  # inline default

        # 1) لو مفيش candidate_id -> يرجع PDF لليوزر نفسه
        if not candidate_id:
            target_user = request.user

        else:
            user_type = (getattr(request.user, "user_type", "") or "").lower()

            # 2) Admin / Superuser: يشوف أي حد
            if user_type == "admin" or request.user.is_superuser:
                target_user = get_object_or_404(User, id=candidate_id)

            # 3) Company: لازم يكون candidate مقدم على Job تابع للشركة أو Saved
            elif user_type == "company":
                target_user = get_object_or_404(
                    User, id=candidate_id, user_type="job_seeker"
                )

                # ✅ Allowed logic بدون FieldError
                allowed = False

                # Case A) job.company = request.user (User FK)
                try:
                    allowed = JobApplication.objects.filter(
                        job__company=request.user,
                        user=target_user
                    ).exists()
                except FieldError:
                    allowed = False

                # Case B) job.company = CompanyProfile و CompanyProfile.user = request.user
                # (Fallback فقط لو الموديل فعلاً كده)
                if not allowed:
                    try:
                        allowed = JobApplication.objects.filter(
                            job__company__user=request.user,
                            user=target_user
                        ).exists()
                    except FieldError:
                        allowed = False

                # لو مش مقدم على وظيفة تبع الشركة → اسمح لو محفوظ Saved
                if not allowed:
                    saved_allowed = SavedApplication.objects.filter(
                        employer=request.user,
                        application__user=target_user
                    ).exists()

                    if not saved_allowed:
                        return Response({"detail": "Not allowed"}, status=403)

            # 4) Job seeker: ممنوع يجيب PDF لحد تاني
            else:
                return Response({"detail": "Not allowed"}, status=403)

        # 5) هات latest PDF
        pdf = (
            CVPdf.objects
            .filter(user=target_user, kind=kind, is_latest=True)
            .order_by("-version")
            .first()
        )

        if not pdf or not getattr(pdf, "file", None):
            return Response({"detail": "PDF not found"}, status=404)

        filename = pdf.filename or "CV.pdf"
        disposition = "inline" if str(view_mode) == "1" else "attachment"

        resp = FileResponse(pdf.file.open("rb"), content_type="application/pdf")
        resp["Content-Disposition"] = f'{disposition}; filename="{filename}"'
        return resp
