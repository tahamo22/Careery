from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
import uuid
import hashlib


def job_default_expiry():
    return timezone.now() + timedelta(days=30)


# ================== USER MANAGER ==================
class UserManager(BaseUserManager):
    def create_user(self, email, full_name, user_type='job_seeker', password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        if not full_name:
            raise ValueError("Users must have a full name")

        email = self.normalize_email(email)
        user = self.model(
            email=email,
            full_name=full_name,
            user_type=user_type,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, user_type='admin', **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(
            email=email,
            full_name=full_name,
            user_type=user_type,
            password=password,
            **extra_fields
        )


# ================== USER ==================
class User(AbstractBaseUser, PermissionsMixin):
    USER_TYPE_CHOICES = (
        ('job_seeker', 'Job Seeker'),
        ('company', 'Company'),
        ('admin', 'Admin'),
    )

    email = models.EmailField(unique=True, max_length=255)
    full_name = models.CharField(max_length=255)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # Profile Info
    profile_picture = models.ImageField(upload_to="profiles/", null=True, blank=True)
    headline = models.CharField(max_length=255, blank=True, null=True)
    experience = models.CharField(max_length=255, blank=True, null=True)
    education = models.CharField(max_length=255, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    marital_status = models.CharField(max_length=50, blank=True, null=True)
    biography = models.TextField(blank=True, null=True)

    # Session Tracking
    is_active_session = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name', 'user_type']

    def __str__(self):
        return self.email

    def mark_online(self):
        self.is_active_session = True
        self.last_seen = timezone.now()
        self.save(update_fields=['is_active_session', 'last_seen'])

    def mark_offline(self):
        self.is_active_session = False
        self.last_seen = timezone.now()
        self.save(update_fields=['is_active_session', 'last_seen'])


# ================== USER EMAIL VERIFICATION ==================
class UserEmailVerification(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_verification"
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - verified={self.is_verified}"


class CompanyEmailVerification(models.Model):
    company_profile = models.OneToOneField(
        "CompanyProfile",
        on_delete=models.CASCADE,
        related_name="email_verification"
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.company_profile.company_name} - verified={self.is_verified}"


# ================== SOCIAL LINKS ==================
class SocialLink(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="social_links"
    )
    platform = models.CharField(max_length=50)
    url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.email} - {self.platform}"


# ================== CV ==================
class CV(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cv'
    )
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    objective = models.TextField(blank=True, null=True)
    skills = models.JSONField(blank=True, null=True, default=list)
    educations = models.JSONField(blank=True, null=True, default=list)
    experiences = models.JSONField(blank=True, null=True, default=list)
    projects = models.JSONField(blank=True, null=True, default=list)
    custom_sections = models.JSONField(blank=True, null=True, default=list)
    cv_generated = models.FileField(upload_to='cvs/generated/', blank=True, null=True)
    cv_analysis = models.JSONField(blank=True, null=True)

    def __str__(self):
        return f"CV of {self.user.email}"


# ================== UPLOADED CV ==================
class UploadedCV(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_cv'
    )
    original_cv = models.FileField(upload_to='cvs/uploaded/')
    parsed_data = models.JSONField(blank=True, null=True)

    def __str__(self):
        return f"Uploaded CV of {self.user.email}"


# ================== COMPANY PROFILE ==================
class CompanyProfile(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="company_profile"
    )

    company_name = models.CharField(max_length=255)
    company_description = models.TextField(blank=True)
    company_logo = models.ImageField(
        upload_to="companies/logos/",
        blank=True,
        null=True
    )

    tax_document = models.FileField(
        upload_to="companies/tax_documents/",
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_companies",
        limit_choices_to={"is_superuser": True},
    )

    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_approved(self):
        return self.status == "approved"

    def __str__(self):
        return self.company_name or self.user.email


# ================== COMPANY VERIFICATION ==================
class CompanyVerification(models.Model):
    company_profile = models.OneToOneField(
        CompanyProfile,
        on_delete=models.CASCADE,
        related_name="verification"
    )

    business_email = models.EmailField()
    business_email_verified = models.BooleanField(default=False)

    commercial_register_number = models.CharField(max_length=100)
    tax_id = models.CharField(max_length=100)

    verification_document = models.FileField(
        upload_to="companies/verification_docs/",
        null=True,
        blank=True
    )

    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Verification for {self.company_profile.company_name}"


class CompanyPublicProfile(models.Model):
    company = models.OneToOneField(
        CompanyProfile,
        on_delete=models.CASCADE,
        related_name="public_profile"
    )

    organization_type = models.CharField(max_length=100, blank=True)
    industry_type = models.CharField(max_length=100, blank=True)
    team_size = models.IntegerField(null=True, blank=True)
    year_of_establishment = models.IntegerField(null=True, blank=True)

    company_website = models.URLField(blank=True)
    vision = models.TextField(blank=True)
    map_location = models.CharField(max_length=255, blank=True)

    phone = models.CharField(max_length=50, blank=True)
    contact_email = models.EmailField(blank=True)
    country = models.CharField(max_length=100, blank=True)

    linkedin_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)

    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"Public profile for {self.company.company_name}"


# ================== JOB APPLICATION ==================
class JobApplication(models.Model):
    STAGE_CHOICES = [
        ("applied", "Applied"),
        ("shortlisted", "Shortlisted"),
        ("interview", "Interview"),
        ("rejected", "Rejected"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="applications"
    )

    job = models.ForeignKey(
        "Job",
        related_name="applications",
        on_delete=models.CASCADE
    )

    stage = models.CharField(
        max_length=30,
        choices=STAGE_CHOICES,
        default="applied"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} → {self.job.title}"


# ================== SAVED APPLICATION (Saved Candidates) ==================
class SavedApplication(models.Model):
    employer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_applications",
        limit_choices_to={'user_type': 'company'},
    )
    application = models.ForeignKey(
        JobApplication,
        on_delete=models.CASCADE,
        related_name="saved_by_employers",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("employer", "application")

    def __str__(self):
        return f"{self.employer.email} → {self.application.id}"


# ================== JOB RECOMMENDATION ==================
class JobRecommendation(models.Model):
    job = models.ForeignKey("Job", on_delete=models.CASCADE)
    cv = models.ForeignKey(CV, on_delete=models.CASCADE)
    score = models.FloatField()

    class Meta:
        unique_together = ('job', 'cv')
        ordering = ['-score']

    def __str__(self):
        return f"{self.cv.user.email} -> {self.job.title} ({self.score})"


# ================== AI ANALYSIS ==================
class AIAnalysis(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_analyses"
    )
    cv = models.ForeignKey(
        CV,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="ai_analyses"
    )
    job_suggestion = models.TextField(blank=True, null=True)
    missing_skills = models.TextField(blank=True, null=True)
    recommendations = models.TextField(blank=True, null=True)
    full_analysis_text = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"AI Analysis for {self.user.email} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"


# ================== INTERVIEW TRAINER ==================
class InterviewQuestion(models.Model):
    text = models.CharField(max_length=500)
    category = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.text


class InterviewSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Session {self.id} - {self.user.email}"


class InterviewVideo(models.Model):
    session = models.ForeignKey(InterviewSession, on_delete=models.CASCADE, related_name="videos")
    question = models.ForeignKey(InterviewQuestion, on_delete=models.SET_NULL, null=True, blank=True)
    video = models.FileField(upload_to="interview_videos/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    feedback = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Video {self.id} - {self.session.user.email}"


# ================== PASSWORD RESET OTP ==================
class PasswordResetOTP(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        # صلاحية 10 دقايق
        return timezone.now() - self.created_at > timedelta(minutes=2)

    def __str__(self):
        return f"{self.email} - {self.code}"


class SavedJob(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_jobs"
    )

    job = models.ForeignKey(
        "Job",
        on_delete=models.CASCADE,
        related_name="saved_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "job")


class Job(models.Model):
    company = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="jobs",
        limit_choices_to={"user_type": "company"},
    )

    title = models.CharField(max_length=255)
    role = models.CharField(max_length=100, blank=True, null=True)
    job_type = models.CharField(max_length=50, blank=True, null=True)
    job_level = models.CharField(max_length=50, blank=True, null=True)

    description = models.TextField(blank=True, null=True)
    requirements = models.TextField(blank=True, null=True)

    tags = models.TextField(blank=True, null=True)

    country = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)

    education = models.CharField(max_length=100, blank=True, null=True)
    experience = models.CharField(max_length=100, blank=True, null=True)

    salary_info = models.CharField(max_length=255, blank=True, null=True)
    benefits = models.JSONField(default=list, blank=True)

    vacancies_count = models.PositiveIntegerField(default=1)

    applications_limit = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum number of applications allowed"
    )

    # ✅ واحد فقط (DateTime)
    application_deadline = models.DateTimeField(null=True, blank=True)

    posted_at = models.DateTimeField(auto_now_add=True)

    is_open = models.BooleanField(default=True)
    is_promoted = models.BooleanField(default=False)

    created_at = models.DateTimeField(default=timezone.now, editable=False)

    def __str__(self):
        return f"{self.title} ({self.company.email})"

    @property
    def applications_count(self):
        return self.applications.count()

    @property
    def is_expired(self):
        if self.application_deadline and timezone.now() > self.application_deadline:
            return True

        if self.applications_limit is not None:
            if self.applications.count() >= self.applications_limit:
                return True

        return False


# ================== CV PROFILE (ONE SOURCE OF TRUTH) ==================
class CVProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cv_profile"
    )

    # ✅ مصدر واحد شامل لكل بيانات الـ CV (الـ model يقرأ مرة واحدة)
    cv_json = models.JSONField(default=dict)

    # ✅ نص مجمّع جاهز للـ AI (اختياري لكنه مهم)
    cv_text = models.TextField(blank=True, default="")

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"CVProfile of {self.user.email}"


# ================== CV PDF STORAGE ==================
def cv_pdf_upload_path(instance, filename):
    return f"cv_pdfs/{instance.user_id}/{instance.kind}/{uuid.uuid4()}.pdf"


class CVPdf(models.Model):
    KIND_CHOICES = (
        ("final", "Final"),
        ("ats", "ATS"),
        ("company", "Company"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cv_pdfs"
    )

    file = models.FileField(upload_to=cv_pdf_upload_path)
    filename = models.CharField(max_length=255, default="CV.pdf")

    kind = models.CharField(max_length=30, choices=KIND_CHOICES, default="final")

    version = models.PositiveIntegerField(default=1)
    is_latest = models.BooleanField(default=True)

    sha256 = models.CharField(max_length=64, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # ✅ يسمح بالـ versions: (user + kind + version)
        constraints = [
            models.UniqueConstraint(fields=["user", "kind", "version"], name="uniq_cvpdf_user_kind_version"),
        ]
        indexes = [
            models.Index(fields=["user", "kind"]),
            models.Index(fields=["user", "kind", "is_latest"]),
        ]

    def __str__(self):
        return f"CVPdf({self.user.email}, {self.kind}, v{self.version})"

    def compute_sha256(self):
        if not self.file:
            return ""
        self.file.seek(0)
        h = hashlib.sha256(self.file.read()).hexdigest()
        self.file.seek(0)
        return h
