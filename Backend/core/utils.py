# core/utils.py
def _safe(v):
    return (v or "").strip()


def _upper(v):
    return _safe(v).upper()


def build_full_cv_text(cv):
    """
    يبني نص مرتب من CV model object
    """
    lines = []

    # HEADER
    full_name = f"{_upper(cv.first_name)} {_upper(cv.last_name)}".strip()
    if full_name:
        lines.append(full_name)

    header_line = " | ".join(
        [x for x in [_safe(cv.location), _safe(cv.phone), _safe(cv.email)] if x]
    )
    if header_line:
        lines.append(header_line)

    if cv.website:
        lines.append(f"Website: {cv.website}")
    if cv.linkedin:
        lines.append(f"LinkedIn: {cv.linkedin}")

    lines.append("")

    # SUMMARY
    lines.append("SUMMARY")
    if cv.objective:
        lines.append(_safe(cv.objective))
    lines.append("")

    # EDUCATION
    lines.append("EDUCATION")
    for edu in (cv.educations or []):
        school = _safe(edu.get("school"))
        degree = _safe(edu.get("degree"))
        from_ = _safe(edu.get("from"))
        to_ = _safe(edu.get("to"))
        loc = _safe(edu.get("location"))
        desc = _safe(edu.get("desc"))

        if school:
            lines.append(school)
        if degree:
            lines.append(degree)

        dates = " – ".join([x for x in [from_, to_] if x])
        if dates:
            lines.append(dates)

        if loc:
            lines.append(loc)
        if desc:
            lines.append(desc)
        lines.append("")

    # EXPERIENCE
    lines.append("EXPERIENCE")
    for exp in (cv.experiences or []):
        company = _safe(exp.get("company"))
        role = _safe(exp.get("role"))
        from_ = _safe(exp.get("from"))
        to_ = _safe(exp.get("to"))
        tasks = exp.get("tasks") or []

        if company:
            lines.append(company)
        if role:
            lines.append(role)

        dates = " – ".join([x for x in [from_, to_] if x])
        if dates:
            lines.append(dates)

        if isinstance(tasks, list):
            for t in tasks:
                t = _safe(str(t))
                if t:
                    lines.append(f"- {t}")
        lines.append("")

    # PROJECTS (من custom_sections لو موجودة)
    lines.append("PROJECTS")
    for sec in (cv.custom_sections or []):
        if (sec.get("section_name") or "").strip().upper() == "PROJECTS":
            for item in (sec.get("items") or []):
                title = _safe(item.get("title"))
                if title:
                    lines.append(title)

                for ach in (item.get("key_achievements") or []):
                    ach = _safe(str(ach))
                    if ach:
                        lines.append(f"- {ach}")

                lines.append("")

    # SKILLS
    lines.append("SKILLS")
    for sk in (cv.skills or []):
        if isinstance(sk, dict):
            cat = _safe(sk.get("category"))
            items = sk.get("items")
            if isinstance(items, list):
                items_txt = ", ".join([_safe(str(x)) for x in items if _safe(str(x))])
            else:
                items_txt = _safe(str(items))
            if cat or items_txt:
                lines.append(f"{cat}: {items_txt}".strip(": "))
        else:
            # fallback
            s = _safe(str(sk))
            if s:
                lines.append(s)

    return "\n".join([l for l in lines if l is not None]).strip()


def build_full_cv_text_from_json(cv_json: dict) -> str:
    """
    يبني نفس النص لكن من cv_json (علشان POST /api/cv/profile/)
    """
    class Dummy:
        pass

    cv = Dummy()
    cv.first_name = cv_json.get("first_name")
    cv.last_name = cv_json.get("last_name")
    cv.email = cv_json.get("email")
    cv.phone = cv_json.get("phone")
    cv.location = cv_json.get("location")
    cv.linkedin = cv_json.get("linkedin")
    cv.website = cv_json.get("website")
    cv.objective = cv_json.get("objective")
    cv.skills = cv_json.get("skills") or []
    cv.educations = cv_json.get("educations") or []
    cv.experiences = cv_json.get("experiences") or []
    cv.custom_sections = cv_json.get("custom_sections") or []

    return build_full_cv_text(cv)
