from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone

from .models import CompanyVerification
import os  # <--- ضيف السطر ده هنا
from rest_framework import serializers
# باقي الـ imports...
from .models import (
    CV,
    Job,
    UploadedCV,
    User,
    CompanyProfile,
    CompanyPublicProfile,
    SocialLink,
    InterviewQuestion,
    InterviewSession,
    InterviewVideo,
    JobApplication,
    SavedApplication,
    SavedJob,
)

# ============================================================
# ✅ Helpers
# ============================================================
def normalize_skills(value):
    """
    Normalize CV.skills which may come in multiple broken formats:
    - list of dicts: [{"category":"...", "items":"..."}]
    - string: "Category: items\nCategory2: items2"
    - dict of characters: {"0":"P","1":"r",...} (spread on string bug)

    Returns:
      - skills_list: list[{"category": str, "items": str}]
      - skills_text: str
    """
    if value is None:
        return [], ""

    # -----------------------
    # Case 1: string
    # -----------------------
    if isinstance(value, str):
        text = value.strip()
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        skills_list = []
        for line in lines:
            if ":" in line:
                cat, items = line.split(":", 1)
                skills_list.append({"category": cat.strip(), "items": items.strip()})
        return skills_list, "\n".join(lines) if lines else text

    # -----------------------
    # Case 2: dict (maybe char-object)
    # -----------------------
    if isinstance(value, dict):
        # char-object bug: keys are digits
        if value and all(str(k).isdigit() for k in value.keys()):
            try:
                # try sequential build 0..n
                s = "".join(value[str(i)] for i in range(len(value)))
            except Exception:
                # fallback: sort by numeric keys
                s = "".join(v for k, v in sorted(value.items(), key=lambda x: int(x[0])))

            # cleanup common html entities
            s = (
                s.replace("&nbsp;", " ")
                 .replace("&amp;", "&")
                 .replace("\xa0", " ")
                 .strip()
            )

            lines = [l.strip() for l in s.splitlines() if l.strip()]
            skills_list = []
            for line in lines:
                if ":" in line:
                    cat, items = line.split(":", 1)
                    skills_list.append({"category": cat.strip(), "items": items.strip()})
            return skills_list, "\n".join(lines) if lines else s

        # normal dict -> stringify values
        s = " ".join(str(v) for v in value.values() if v)
        return [], s.strip()

    # -----------------------
    # Case 3: list
    # -----------------------
    if isinstance(value, list):
        # list of dicts
        if all(isinstance(x, dict) for x in value):
            skills_list = []
            for x in value:
                cat = (x.get("category") or "").strip()
                items = (x.get("items") or "").strip()
                if cat or items:
                    skills_list.append({"category": cat, "items": items})

            skills_text = "\n".join(
                [f"{x['category']}: {x['items']}".strip(": ").strip() for x in skills_list]
            )
            return skills_list, skills_text

        # list of strings
        if all(isinstance(x, str) for x in value):
            skills_text = "\n".join([x.strip() for x in value if x.strip()])
            return [], skills_text

    # fallback
    return [], str(value).strip()


# ================== CV ==================
class CVSerializer(serializers.ModelSerializer):
    # ✅ NEW: normalized skills for UI
    skills_list = serializers.SerializerMethodField()
    skills_text = serializers.SerializerMethodField()

    class Meta:
        model = CV
        fields = "__all__"
        read_only_fields = ["user"]

    def get_skills_list(self, obj):
        skills_list, _ = normalize_skills(getattr(obj, "skills", None))
        return skills_list

    def get_skills_text(self, obj):
        _, skills_text = normalize_skills(getattr(obj, "skills", None))
        return skills_text


# ================== Company Profile (mini for Job cards) ==================
class CompanyProfileMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyProfile
        fields = ["company_name", "company_logo"]


# ================== Job (list / recommended) ==================
class JobSerializer(serializers.ModelSerializer):
    company_profile = serializers.SerializerMethodField()
    applications_count = serializers.SerializerMethodField()
    is_expired = serializers.ReadOnlyField()

    class Meta:
        model = Job
        fields = [
            "id",
            "title",
            "job_type",
            "job_level",
            "role",
            "city",
            "country",

            # 🕒 التواريخ
            "posted_at",
            "application_deadline",

            # 👥 الأعداد
            "vacancies_count",
            "applications_count",

            # 📌 الحالة
            "is_open",
            "is_promoted",
            "is_expired",

            # 🏢 الشركة
            "company_profile",
        ]

    def get_applications_count(self, obj):
        return obj.applications.count()

    def get_company_profile(self, obj):
        profile = CompanyProfile.objects.filter(user=obj.company).first()
        if not profile:
            return None

        return {
            "company_name": profile.company_name,
            "company_logo": profile.company_logo.url if profile.company_logo else None,
        }


# ================== Job Create / Update ==================
class JobCreateUpdateSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Job
        exclude = ["company"]

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # 🔥 مهم جدًا: save بدون update_fields
        instance.save()
        return instance


# ================== Uploaded CV ==================
class UploadedCVSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedCV
        fields = "__all__"


# ================== Company Profile (full) ==================
class CompanyProfileSerializer(serializers.ModelSerializer):
    reviewed_by_email = serializers.SerializerMethodField()

    class Meta:
        model = CompanyProfile
        fields = [
            "id",
            "company_name",
            "company_description",
            "company_logo",
            "tax_document",
            "status",
            "reviewed_by_email",
            "reviewed_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "reviewed_by_email",
            "reviewed_at",
            "created_at",
        ]

    def get_reviewed_by_email(self, obj):
        return obj.reviewed_by.email if obj.reviewed_by else None


# ================== Company Verification ==================
class CompanyVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyVerification
        fields = [
            "id",
            "business_email",
            "business_email_verified",
            "commercial_register_number",
            "tax_id",
            "verification_document",
            "is_completed",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "business_email_verified",
            "is_completed",
            "created_at",
        ]

    def validate(self, attrs):
        request = self.context.get("request")

        if request and request.method in ["POST", "PUT"]:
            errors = {}

            if not attrs.get("business_email"):
                errors["business_email"] = "Business email is required."

            if not attrs.get("commercial_register_number"):
                errors["commercial_register_number"] = "Commercial register number is required."

            if not attrs.get("tax_id"):
                errors["tax_id"] = "Tax ID is required."

            if errors:
                raise serializers.ValidationError(errors)

        return attrs


# ================== Company Public Profile ==================
class CompanyPublicProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyPublicProfile
        fields = "__all__"
        read_only_fields = ["id", "company"]


# ================== Social Links ==================
class SocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialLink
        fields = ["id", "platform", "url", "user"]
        read_only_fields = ["user"]
        extra_kwargs = {
            "url": {"required": False, "allow_blank": True, "allow_null": True},
        }


# ================== User ==================
class UserSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    social_links = SocialLinkSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = "__all__"
        extra_kwargs = {"password": {"write_only": True, "required": False}}

    def get_status(self, obj):
        if obj.is_active_session and obj.last_seen:
            if (timezone.now() - obj.last_seen).seconds < 120:
                return "Active"
        return "Inactive"

    def get_profile_picture_url(self, obj):
        request = self.context.get("request")
        if obj.profile_picture and request:
            return request.build_absolute_uri(obj.profile_picture.url)
        return None

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


# ================== Auth ==================
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["full_name", "email", "password", "user_type"]

    def create(self, validated_data):
        user = User(
            email=validated_data["email"],
            full_name=validated_data["full_name"],
            user_type=validated_data["user_type"],
        )
        user.set_password(validated_data["password"])
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    user_type = serializers.CharField(write_only=True)

    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        user_type = attrs.get("user_type")

        user = User.objects.filter(email=email).first()

        if not user:
            raise serializers.ValidationError({"detail": "Invalid email or password"})

        if user.user_type == "job_seeker":
            verification = getattr(user, "email_verification", None)
            if verification and not verification.is_verified:
                raise serializers.ValidationError({"detail": "Please verify your email first"})

        if not user.check_password(password):
            raise serializers.ValidationError({"detail": "Invalid email or password"})

        if user.user_type != user_type:
            raise serializers.ValidationError({"detail": "Invalid email or password"})

        refresh = RefreshToken.for_user(user)
        user.mark_online()

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "email": user.email,
            "full_name": user.full_name,
            "user_type": user.user_type,
        }


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["old_password"]):
            raise serializers.ValidationError("Incorrect password")
        return attrs

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


# ================== Job Detail ==================
class JobDetailSerializer(serializers.ModelSerializer):
    company_profile = serializers.SerializerMethodField()
    applications_count = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            "id",
            "title",
            "role",
            "job_type",
            "job_level",
            "description",
            "requirements",
            "tags",
            "education",
            "experience",
            "vacancies_count",
            "country",
            "city",
            "salary_info",
            "benefits",
            "application_deadline",
            "is_open",
            "is_promoted",
            "created_at",
            "applications_count",
            "company_profile",
        ]

    def get_applications_count(self, obj):
        return obj.applications.count()

    def get_company_profile(self, obj):
        profile = CompanyProfile.objects.filter(user=obj.company).first()
        if not profile:
            return None
        return {
            "company_name": profile.company_name,
            "company_logo": (profile.company_logo.url if profile.company_logo else None),
        }


# ================== Job Application ==================
# ================== Job Application ==================
class JobApplicationSerializer(serializers.ModelSerializer):
    # ✅ OLD (keep)
    applicant_id = serializers.IntegerField(source="user.id", read_only=True)
    applicant_name = serializers.CharField(source="user.full_name", read_only=True)
    applicant_email = serializers.EmailField(source="user.email", read_only=True)

    # ✅ NEW (frontend expects these)
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    candidate_id = serializers.IntegerField(source="user.id", read_only=True)

    # ✅ optional: return nested user object with id (helpful)
    user = serializers.SerializerMethodField()

    cv = CVSerializer(source="user.cv", read_only=True)

    class Meta:
        model = JobApplication
        fields = [
            "id",
            "stage",
            "created_at",

            # ✅ keep old fields
            "applicant_id",
            "applicant_name",
            "applicant_email",

            # ✅ new fields for frontend mapping
            "user_id",
            "candidate_id",
            "user",

            "cv",
        ]

    def get_user(self, obj):
        u = getattr(obj, "user", None)
        if not u:
            return None
        return {
            "id": u.id,
            "full_name": getattr(u, "full_name", "") or "",
            "email": getattr(u, "email", "") or "",
        }


# ================== Saved Application ==================
class SavedApplicationSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source="application.user.full_name", read_only=True)
    candidate_email = serializers.EmailField(source="application.user.email", read_only=True)

    application_id = serializers.IntegerField(source="application.id", read_only=True)
    job_id = serializers.IntegerField(source="application.job.id", read_only=True)

    job_title = serializers.CharField(source="application.job.title", read_only=True)

    applied_at = serializers.DateTimeField(source="application.created_at", read_only=True)

    location = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    uploaded_cv_url = serializers.SerializerMethodField()

    class Meta:
        model = SavedApplication
        fields = [
            "id",
            "application_id",
            "job_id",
            "candidate_name",
            "candidate_email",
            "job_title",
            "applied_at",
            "location",
            "profile_picture_url",
            "uploaded_cv_url",
            "created_at",
        ]

    def get_location(self, obj):
        user = obj.application.user
        cv = getattr(user, "cv", None)
        return cv.location if cv and cv.location else ""

    def get_profile_picture_url(self, obj):
        request = self.context.get("request")
        user = obj.application.user
        if user.profile_picture and request:
            return request.build_absolute_uri(user.profile_picture.url)
        return None

    def get_uploaded_cv_url(self, obj):
        uploaded = getattr(obj.application.user, "uploaded_cv", None)
        if uploaded and uploaded.original_cv:
            return uploaded.original_cv.url
        return None


# ================== Interview ==================
class InterviewQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewQuestion
        fields = "__all__"

class InterviewVideoSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()

    class Meta:
        model = InterviewVideo
        fields = ['id', 'video_url', 'uploaded_at', 'feedback', 'session', 'question']

    def get_video_url(self, obj):
        if obj.video:
            # ده اللي بيخلي الـ AI يشوف لينك Ngrok عشان يحل مشكلة video_fps
            public_base = os.getenv("MY_PUBLIC_URL", "http://127.0.0.1:8000")
            return f"{public_base.rstrip('/')}{obj.video.url}"
        return None

class InterviewSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewSession
        fields = '__all__'

# ================== Saved Job ==================
class SavedJobSerializer(serializers.ModelSerializer):
    job = serializers.SerializerMethodField()
    job_title = serializers.CharField(source="job.title", read_only=True)
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = SavedJob
        fields = [
            "id",
            "job",
            "job_title",
            "company_name",
            "created_at",
        ]

    def get_company_name(self, obj):
        if not obj.job or not obj.job.company:
            return ""
        profile = CompanyProfile.objects.filter(user=obj.job.company).first()
        return profile.company_name if profile else ""

    def get_job(self, obj):
        if not obj.job:
            return None

        return {
            "id": obj.job.id,
            "title": obj.job.title,
            "company_profile": {
                "company_name": self.get_company_name(obj)
            }
        }


from .models import CVProfile, CVPdf

class CVProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CVProfile
        fields = "__all__"
        read_only_fields = ["user", "updated_at"]


class CVPdfSerializer(serializers.ModelSerializer):
    class Meta:
        model = CVPdf
        fields = "__all__"
        read_only_fields = ["user", "version", "is_latest", "sha256", "created_at"]
