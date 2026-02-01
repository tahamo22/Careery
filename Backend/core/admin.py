from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django import forms
from django.utils import timezone 
from .models import CompanyVerification
from django.core.mail import send_mail
from django.conf import settings
from .models import CompanyProfile, CompanyEmailVerification

from .models import (
    User, CV, UploadedCV, Job, CompanyProfile,
    JobRecommendation, SocialLink,
    InterviewQuestion, InterviewSession, InterviewVideo
)

@admin.register(CompanyVerification)
class CompanyVerificationAdmin(admin.ModelAdmin):
    list_display = (
        "company_profile",
        "business_email",
        "commercial_register_number",
        "tax_id",
        "is_completed",
        "created_at",
    )

    list_filter = ("is_completed", "created_at")
    search_fields = (
        "company_profile__company_name",
        "business_email",
        "tax_id",
    )

    readonly_fields = ("created_at",)


# ================================
# User Forms
# ================================
class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ('email', 'full_name', 'user_type')


class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = (
            'email', 'full_name', 'user_type',
            'profile_picture', 'headline', 'experience', 'education',
            'nationality', 'date_of_birth', 'gender', 'marital_status', 'biography',
            'is_active', 'is_staff', 'is_superuser',
            'groups', 'user_permissions'
        )


# ================================
# Inline: Social Links
# ================================
class SocialLinkInline(admin.TabularInline):
    model = SocialLink
    extra = 1
    fields = ("platform", "url")


# ================================
# User Admin
# ================================
class UserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User

    inlines = [SocialLinkInline]

    list_display = (
        'email', 'full_name', 'user_type',
        'is_staff', 'is_active',
        'is_active_session', 'last_seen'
    )

    list_filter = (
        'user_type', 'is_staff', 'is_active',
        'is_active_session', 'gender', 'marital_status'
    )

    fieldsets = (
        (None, {
            'fields': ('email', 'password', 'full_name', 'user_type')
        }),
        ('Personal Info', {
            'fields': (
                'profile_picture',
                'headline',
                'experience',
                'education',
                'nationality',
                'date_of_birth',
                'gender',
                'marital_status',
                'biography',
            )
        }),
        ('Session Info', {
            'fields': ('is_active_session', 'last_seen')
        }),
        ('Permissions', {
            'fields': (
                'is_staff', 'is_superuser', 'is_active',
                'groups', 'user_permissions'
            )
        }),
        ('Important dates', {
            'fields': ('last_login',)
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'full_name', 'user_type',
                'password1', 'password2',
                'is_active', 'is_staff'
            ),
        }),
    )

    search_fields = ('email', 'full_name')
    ordering = ('email',)


admin.site.register(User, UserAdmin)


# ================================
# CV Admin
# ================================
@admin.register(CV)
class CVAdmin(admin.ModelAdmin):
    list_display = ("user", "first_name", "last_name", "email", "phone")
    search_fields = ("user__email", "first_name", "last_name")


# ================================
# Uploaded CV Admin
# ================================
@admin.register(UploadedCV)
class UploadedCVAdmin(admin.ModelAdmin):
    list_display = ("user", "original_cv")
    search_fields = ("user__email",)


# ================================
# Job Admin ✅ (مظبوط)
# ================================
@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("title", "company_email", "created_at")
    search_fields = ("title", "company__email")
    list_filter = ("created_at",)

    def company_email(self, obj):
        return obj.company.email

    company_email.short_description = "Company Email"


# ================================
# Company Profile Admin
# ================================
@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = (
        "company_name",
        "user",
        "status",
        "created_at",
        "reviewed_by",
        "reviewed_at",
    )

    list_filter = ("status", "created_at")
    search_fields = ("company_name", "user__email")

    readonly_fields = ("reviewed_by", "reviewed_at", "created_at")

    actions = ["approve_and_send_verification", "reject_company"]

    # ✅ Approve + Send Email
    def approve_and_send_verification(self, request, queryset):
        for company in queryset:
            # لو Approved قبل كده
            if company.status == "approved":
                verification, _ = CompanyEmailVerification.objects.get_or_create(
                    company_profile=company
                )

                # لو Verified خلاص → تجاهل
                if verification.is_verified:
                    continue
            else:
                company.status = "approved"
                company.reviewed_by = request.user
                company.reviewed_at = timezone.now()
                company.save()

                verification, _ = CompanyEmailVerification.objects.get_or_create(
                    company_profile=company
                )

            # إرسال الإيميل لو لسه مش verified
            if not verification.is_verified:
                verify_link = (
                    f"{settings.FRONTEND_URL}"
                    f"/auth/company/verify-email/{verification.token}"
                )

                send_mail(
                    subject="Verify your company email",
                    message=(
                        "Your company has been approved.\n\n"
                        "Please verify your company email to activate your account:\n"
                        f"{verify_link}"
                    ),
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[company.user.email],
                    fail_silently=False,
                )

    approve_and_send_verification.short_description = (
        "Approve company & send verification email"
    )

    # ❌ Reject company
    def reject_company(self, request, queryset):
        queryset.update(
            status="rejected",
            reviewed_by=request.user,
            reviewed_at=timezone.now(),
        )

    reject_company.short_description = "Reject selected companies"


# ================================
# Job Recommendation Admin
# ================================
@admin.register(JobRecommendation)
class JobRecommendationAdmin(admin.ModelAdmin):
    list_display = ("job", "cv", "score")
    search_fields = ("job__title", "cv__user__email")
    list_filter = ("score",)


# ================================
# SocialLink Admin
# ================================
@admin.register(SocialLink)
class SocialLinkAdmin(admin.ModelAdmin):
    list_display = ("user", "platform", "url")
    search_fields = ("user__email", "platform")
    list_filter = ("platform",)


# ================================
# Interview Question Admin
# ================================
@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "text", "category")
    search_fields = ("text", "category")


# ================================
# Interview Session Admin
# ================================
@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "started_at", "ended_at")
    search_fields = ("user__email",)
    list_filter = ("started_at",)


# ================================
# Interview Video Admin
# ================================
@admin.register(InterviewVideo)
class InterviewVideoAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "question", "uploaded_at", "video")
    search_fields = ("session__user__email",)
    list_filter = ("uploaded_at",)


from .models import CVProfile, CVPdf

@admin.register(CVProfile)
class CVProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "updated_at")
    search_fields = ("user__email",)

@admin.register(CVPdf)
class CVPdfAdmin(admin.ModelAdmin):
    list_display = ("user", "kind", "version", "is_latest", "created_at")
    list_filter = ("kind", "is_latest", "created_at")
    search_fields = ("user__email",)
