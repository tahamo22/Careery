from rest_framework.permissions import BasePermission


class IsApprovedCompany(BasePermission):
    """
    Allow access only to approved & email-verified companies
    """

    message = "Your company account is not active."

    def has_permission(self, request, view):
        user = request.user

        # لازم يكون Logged in
        if not user or not user.is_authenticated:
            return False

        # لازم يكون Company
        if getattr(user, "user_type", "").lower() != "company":
            return False

        # لازم يكون عنده CompanyProfile
        company_profile = getattr(user, "company_profile", None)
        if not company_profile:
            return False

        # ❌ لسه Pending
        if company_profile.status == "pending":
            self.message = "Your company account is under review."
            return False

        # ❌ مرفوض
        if company_profile.status == "rejected":
            self.message = "Your company account was rejected."
            return False

        # ❌ Approved بس الإيميل مش متفعل
        verification = getattr(company_profile, "email_verification", None)
        if not verification or not verification.is_verified:
            self.message = "Please verify your company email first."
            return False

        # ✅ Approved + Email Verified
        return True
