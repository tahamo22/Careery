# core/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CV, CVProfile


def _safe_str(v):
    return "" if v is None else str(v).strip()


def _join_list(items, sep=" | "):
    if not items:
        return ""
    return sep.join([_safe_str(x) for x in items if _safe_str(x)]).strip()


def _format_skills(skills):
    """
    skills ممكن تكون:
    - list[str]
    - list[dict] مثال: {"category":"Programming Languages","items":"Python, SQL"} أو {"category":..., "items":[...]}
    """
    if not skills:
        return ""

    lines = []
    for s in skills:
        if isinstance(s, dict):
            cat = _safe_str(s.get("category"))
            items = s.get("items")
            if isinstance(items, list):
                items_str = _join_list(items, ", ")
            else:
                items_str = _safe_str(items)
            if cat and items_str:
                lines.append(f"{cat}: {items_str}")
            elif items_str:
                lines.append(items_str)
        else:
            lines.append(_safe_str(s))

    return "\n".join([l for l in lines if l]).strip()


def _format_educations(educations):
    if not educations:
        return ""
    lines = []
    for edu in educations:
        if not isinstance(edu, dict):
            lines.append(_safe_str(edu))
            continue
        school = _safe_str(edu.get("school"))
        degree = _safe_str(edu.get("degree"))
        fr = _safe_str(edu.get("from"))
        to = _safe_str(edu.get("to"))
        loc = _safe_str(edu.get("location"))
        desc = _safe_str(edu.get("desc"))

        block = []
        if school: block.append(school)
        if degree: block.append(degree)
        if fr or to: block.append(f"{fr} – {to}".strip(" –"))
        if loc: block.append(loc)
        if desc: block.append(desc)
        if block:
            lines.append("\n".join(block))
    return "\n\n".join(lines).strip()


def _format_experiences(experiences):
    if not experiences:
        return ""
    lines = []
    for exp in experiences:
        if not isinstance(exp, dict):
            lines.append(_safe_str(exp))
            continue
        company = _safe_str(exp.get("company"))
        role = _safe_str(exp.get("role"))
        fr = _safe_str(exp.get("from"))
        to = _safe_str(exp.get("to"))
        tasks = exp.get("tasks") or []

        block = []
        if company: block.append(company)
        if role: block.append(role)
        if fr or to: block.append(f"{fr} – {to}".strip(" –"))

        if isinstance(tasks, list):
            for t in tasks:
                t = _safe_str(t)
                if t:
                    block.append(f"- {t}")
        else:
            t = _safe_str(tasks)
            if t:
                block.append(f"- {t}")

        if block:
            lines.append("\n".join(block))
    return "\n\n".join(lines).strip()


def _format_projects(projects, custom_sections):
    lines = []

    # 1) projects field
    for p in (projects or []):
        if not isinstance(p, dict):
            s = _safe_str(p)
            if s:
                lines.append(s)
            continue

        title = _safe_str(p.get("title") or p.get("name"))
        date = _safe_str(p.get("date"))
        achs = p.get("key_achievements") or p.get("achievements") or []

        block = []
        if title: block.append(title)
        if date: block.append(date)

        if isinstance(achs, list):
            for a in achs:
                a = _safe_str(a)
                if a:
                    block.append(f"- {a}")
        else:
            a = _safe_str(achs)
            if a:
                block.append(f"- {a}")

        if block:
            lines.append("\n".join(block))

    # 2) custom_sections -> PROJECTS
    for sec in (custom_sections or []):
        if not isinstance(sec, dict):
            continue
        name = _safe_str(sec.get("section_name")).upper()
        if name != "PROJECTS":
            continue
        for item in (sec.get("items") or []):
            if not isinstance(item, dict):
                s = _safe_str(item)
                if s:
                    lines.append(s)
                continue

            title = _safe_str(item.get("title"))
            achs = item.get("key_achievements") or []

            block = []
            if title: block.append(title)
            if isinstance(achs, list):
                for a in achs:
                    a = _safe_str(a)
                    if a:
                        block.append(f"- {a}")
            else:
                a = _safe_str(achs)
                if a:
                    block.append(f"- {a}")

            if block:
                lines.append("\n".join(block))

    return "\n\n".join([l for l in lines if l]).strip()


def build_cv_text(cv: CV) -> str:
    """
    نص واحد طويل ومقروء للـ AI.
    """
    lines = []

    # Header
    full_name = f"{_safe_str(cv.first_name)} {_safe_str(cv.last_name)}".strip()
    if full_name:
        lines.append(full_name.upper())

    header_parts = []
    if cv.location: header_parts.append(_safe_str(cv.location))
    if cv.phone: header_parts.append(_safe_str(cv.phone))
    if cv.email: header_parts.append(_safe_str(cv.email))
    if header_parts:
        lines.append(" | ".join(header_parts))

    if cv.website:
        lines.append(f"Website: {_safe_str(cv.website)}")
    if cv.linkedin:
        lines.append(f"LinkedIn: {_safe_str(cv.linkedin)}")

    lines.append("")

    # Summary
    lines.append("SUMMARY")
    if cv.objective:
        lines.append(_safe_str(cv.objective))
    lines.append("")

    # Education
    lines.append("EDUCATION")
    edu_text = _format_educations(cv.educations or [])
    if edu_text:
        lines.append(edu_text)
    lines.append("")

    # Experience
    lines.append("EXPERIENCE")
    exp_text = _format_experiences(cv.experiences or [])
    if exp_text:
        lines.append(exp_text)
    lines.append("")

    # Projects
    lines.append("PROJECTS")
    proj_text = _format_projects(cv.projects or [], cv.custom_sections or [])
    if proj_text:
        lines.append(proj_text)
    lines.append("")

    # Skills
    lines.append("SKILLS")
    skills_text = _format_skills(cv.skills or [])
    if skills_text:
        lines.append(skills_text)

    # remove empty tail
    return "\n".join([l for l in lines if l is not None]).strip()


@receiver(post_save, sender=CV)
def sync_cvprofile(sender, instance: CV, **kwargs):
    profile, _ = CVProfile.objects.get_or_create(user=instance.user)

    profile.cv_json = {
        "first_name": instance.first_name,
        "last_name": instance.last_name,
        "email": instance.email,
        "phone": instance.phone,
        "location": instance.location,
        "linkedin": instance.linkedin,
        "website": instance.website,
        "objective": instance.objective,
        "skills": instance.skills or [],
        "educations": instance.educations or [],
        "experiences": instance.experiences or [],
        "projects": instance.projects or [],
        "custom_sections": instance.custom_sections or [],
    }

    profile.cv_text = build_cv_text(instance)

    # ✅ update_fields لتقليل أي side effects
    profile.save(update_fields=["cv_json", "cv_text", "updated_at"])
# core/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CV, CVProfile
from .utils import build_full_cv_text


@receiver(post_save, sender=CV)
def sync_cvprofile(sender, instance: CV, **kwargs):
    profile, _ = CVProfile.objects.get_or_create(user=instance.user)

    profile.cv_json = {
        "first_name": instance.first_name,
        "last_name": instance.last_name,
        "email": instance.email,
        "phone": instance.phone,
        "location": instance.location,
        "linkedin": instance.linkedin,
        "website": instance.website,
        "objective": instance.objective,
        "skills": instance.skills or [],
        "educations": instance.educations or [],
        "experiences": instance.experiences or [],
        "projects": instance.projects or [],
        "custom_sections": instance.custom_sections or [],
    }

    # ✅ ده النص الكامل المنظم
    profile.cv_text = build_full_cv_text(instance)
    profile.save()
