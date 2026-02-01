from django.urls import path, include
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from .views import get_user_interview_videos
from .views_external import ExternalJobSearchAPIView

from .views import (
    # ===== Routers / ViewSets =====
    CVViewSet,
    JobViewSet,
    UploadedCVViewSet,
    CompanyProfileViewSet,
    CompanyPublicProfileViewSet,
    SocialLinkViewSet,
    JobApplicationViewSet,
    SavedApplicationViewSet,
InterviewVideoViewSet,


    # ===== Auth / Settings =====
    RegisterUserAPIView,
    LoginAPIView,
    LogoutAPIView,
    ProfileAPIView,
    CloseAccountAPIView,
    SettingsAPIView,
    AccountSettingsAPIView,
    HeartbeatAPIView,
    ActiveUsersAPIView,
    PasswordChangeAPIView,
    PersonalSettingsAPIView,

    # ===== Email verify =====
    VerifyEmailAPIView,
    ResendEmailVerificationAPIView,
    VerifyCompanyEmailAPIView,

    # ===== Employer =====
    EmployerDashboardAPIView,
    CompanyVerificationAPIView,
    AdminCompanyApprovalAPIView,

    # ===== Jobs helpers =====
    job_applications_for_job,
    toggle_saved_job,
    user_saved_jobs,
    user_applied_jobs,
    apply_to_job,

    # ===== AI =====
    analyze_cv_view,
    user_ai_analyses,
    UserRecommendedJobsAPIView,
    process_interview,
    process_cv_analysis,

    # ===== Interview =====
    get_interview_questions,
    start_interview_session,
    upload_interview_video,
    upload_interview_video_base64,
    end_interview_session,
    get_latest_user_interview_video,

    # ===== Password reset =====
    request_password_reset,
    verify_reset_code,
    reset_password,

    # ===== External jobs =====
    linkedin_jobs,
    company_jobs_match,
    freelance_jobs,

    # ===== CV Profile + PDF =====
    CVProfileAPIView,
    CVPdfUploadAPIView,
    CVPdfLatestAPIView,
)


def home(request):
    return JsonResponse(
        {
            "message": "🚀 Smart Hiring Project API is running successfully!",
            "version": "v1.0",
        }
    )


# ================== DRF Router ==================
router = DefaultRouter()
router.register("cvs", CVViewSet, basename="cv")
router.register("jobs", JobViewSet, basename="job")
router.register("uploaded-cvs", UploadedCVViewSet, basename="uploadedcv")
router.register("company-profiles", CompanyProfileViewSet, basename="companyprofile")
router.register(
    "company-public-profile",
    CompanyPublicProfileViewSet,
    basename="company-public-profile",
)
router.register("social-links", SocialLinkViewSet, basename="sociallink")
router.register("applications", JobApplicationViewSet, basename="application")
router.register("saved-applications", SavedApplicationViewSet, basename="saved-application")

router.register('interview_videos', InterviewVideoViewSet, basename='interviewvideo')


# 👇 Interview Videos Router
# router.register(
#     "interview-videos",
#     InterviewVideoViewSet,
#     basename="interview-videos"
# )


urlpatterns = [
    path("", home, name="home"),

    # ================== Auth ==================
    path("register/", RegisterUserAPIView.as_view()),
    path("login/", LoginAPIView.as_view()),
    path("logout/", LogoutAPIView.as_view()),
    path("change-password/", PasswordChangeAPIView.as_view()),
    path("heartbeat/", HeartbeatAPIView.as_view()),
    path("active-users/", ActiveUsersAPIView.as_view()),
    path("profile/", ProfileAPIView.as_view()),
    path("close-account/", CloseAccountAPIView.as_view()),
    path("settings/", SettingsAPIView.as_view()),
    path("account-settings/", AccountSettingsAPIView.as_view()),
    path("personal-settings/", PersonalSettingsAPIView.as_view(), name="personal-settings"),

    # ================== Employer ==================
    path("employer/dashboard/", EmployerDashboardAPIView.as_view()),
    path("company-verification/", CompanyVerificationAPIView.as_view(), name="company-verification"),

    # ================== AI ==================
    path("analyze-resume/", process_cv_analysis, name="analyze_resume"),
    path("analyze-interview/", process_interview, name="analyze_interview"),
    path("analyze-cv/", analyze_cv_view),
    path("ai-analyses/", user_ai_analyses),

    # ================== Email verify ==================
    path("verify-email/<uuid:token>/", VerifyEmailAPIView.as_view(), name="verify-email"),
    path("resend-verification/", ResendEmailVerificationAPIView.as_view(), name="resend-email-verification"),
    path("auth/company/verify-email/<uuid:token>/", VerifyCompanyEmailAPIView.as_view()),

    # ================== OTP Reset ==================
    path("request-password-reset/", request_password_reset),
    path("verify-reset-code/", verify_reset_code),
    path("reset-password/", reset_password),

    # ================== Interview ==================
    path("interview/questions/", get_interview_questions),
    path("interview/start/", start_interview_session),
    path("interview/upload/", upload_interview_video),
    path("interview/upload-base64/", upload_interview_video_base64),
    path("interview/end/", end_interview_session),
    path("interview/latest/", get_latest_user_interview_video),
    path("interview/all/", get_user_interview_videos),
    # ================== Jobs ==================
    path("jobs/recommended/", UserRecommendedJobsAPIView.as_view()),
    path("jobs/<int:job_id>/apply/", apply_to_job),
    path("jobs/<int:job_id>/applications/", job_applications_for_job),
    path("jobs/<int:job_id>/save/", toggle_saved_job),
    path("saved-jobs/", user_saved_jobs),
    path("applied-jobs/", user_applied_jobs),

    # ================== External ==================
    path("external-jobs/", ExternalJobSearchAPIView.as_view()),
    path("linkedin-jobs/", linkedin_jobs),
    path("company-jobs-match/", company_jobs_match),
    path("freelance-jobs/", freelance_jobs),

    # ================== Router ==================
    path("", include(router.urls)),

    # ================== CV PDF ==================
    path("cv/profile/", CVProfileAPIView.as_view()),
    path("cv/pdf/upload/", CVPdfUploadAPIView.as_view()),
    path("cv/pdf/latest/", CVPdfLatestAPIView.as_view()),
]


# ================== Admin ==================
urlpatterns += [
    path("admin/companies/pending/", AdminCompanyApprovalAPIView.as_view()),
    path("admin/companies/<int:company_id>/review/", AdminCompanyApprovalAPIView.as_view()),
]


# ================== MEDIA ==================
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
