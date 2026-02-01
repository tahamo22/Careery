import os, re, html
import requests
from typing import List, Dict, Tuple
from urllib.parse import urlencode
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# ========= Helpers =========
def _clean_text(txt: str | None) -> str:
    if not txt:
        return ""
    txt = html.unescape(txt)
    txt = re.sub(r"<[^>]+>", " ", txt)
    txt = re.sub(r"\s+", " ", txt).strip()
    return txt


def normalize(items: List[Dict], source: str) -> List[Dict]:
    out = []
    for j in items:
        title = j.get("title") or j.get("job_title") or ""
        company = (
            j.get("company")
            or j.get("company_name")
            or j.get("employer_name")
            or ""
        )
        location = (
            j.get("location")
            or j.get("location_display")
            or j.get("city")
            or j.get("job_city")
            or ""
        )
        summary = (
            j.get("snippet")
            or j.get("description")
            or j.get("content")
            or ""
        )
        posted = (
            j.get("updated")
            or j.get("created")
            or j.get("date")
            or j.get("publication_date")
            or j.get("job_posted_at_datetime_utc")
        )
        link = (
            j.get("link")
            or j.get("redirect_url")
            or j.get("url")
            or j.get("job_apply_link")
        )

        out.append(
            {
                "title": _clean_text(title),
                "company": _clean_text(company),
                "location": _clean_text(location),
                "summary": _clean_text(summary),
                "posted_at": posted,
                "link": link,
                "source": source,
                "score": j.get("score"),
            }
        )
    # نخلي بس الوظايف اللي فيها لينك
    return [r for r in out if r["link"]]


# ========= Feature Flags from ENV =========
def _is_enabled(name: str, default: bool = False) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return str(val).strip().lower() in {"1", "true", "yes", "on"}


# ========= Jooble =========
def provider_jooble(
    title: str, location: str | None, limit: int
) -> Tuple[List[Dict], Dict]:
    meta = {
        "enabled": _is_enabled("ENABLE_JOOBLE", False),
        "ok": False,
        "count": 0,
        "status": None,
        "note": "",
    }
    if not meta["enabled"]:
        meta["note"] = "Jooble disabled by ENABLE_JOOBLE"
        return [], meta

    key = os.getenv("JOOBLE_API_KEY", "")
    if not key:
        meta["enabled"] = False
        meta["note"] = "disabled: JOOBLE_API_KEY missing"
        return [], meta

    url = f"https://jooble.org/api/{key}"
    payload = {
        "keywords": title,
        "page": 1,
        "location": location or "",
        "radius": 50,
    }
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Joblytic/1.0 (+contact: joblytic@local)",
    }
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=15)
        meta["status"] = r.status_code
        if r.status_code != 200:
            body = (r.text or "")[:300]
            meta["note"] = (
                "403 from Jooble (check key/IP/policy). " + body
                if r.status_code == 403
                else body
            )
            return [], meta
        data = r.json() or {}
        norm = normalize(data.get("jobs", [])[:limit], "jooble")
        meta["ok"] = True
        meta["count"] = len(norm)
        return norm, meta
    except Exception as e:
        meta["note"] = str(e)
        return [], meta


# ========= Adzuna =========
ADZUNA_SUPPORTED = {
    "gb",
    "us",
    "au",
    "ca",
    "de",
    "fr",
    "nl",
    "pl",
    "za",
    "in",
    "it",
    "es",
    "sg",
    "nz",
    "br",
    "mx",
    "at",
    "ch",
    "be",
    "ie",
    "pt",
    "ar",
    "dk",
    "no",
    "se",
    "fi",
    "cz",
    "ro",
    "hu",
    "gr",
    "ae",
}


def _sanitize_adzuna_countries(codes: List[str]) -> Tuple[List[str], str]:
    cleaned, note_parts = [], []
    for c in codes:
        c2 = c.lower()
        if c2 in ADZUNA_SUPPORTED:
            cleaned.append(c2)
        else:
            if c2 == "eg":
                note_parts.append(
                    "Adzuna: 'eg' not supported; fallback to ['ae','gb','us']."
                )
                cleaned.extend(["ae", "gb", "us"])
            else:
                note_parts.append(
                    f"Adzuna: country '{c2}' not supported; skipped."
                )
    cleaned = list(dict.fromkeys(cleaned))
    return (cleaned or ["ae", "gb", "us"], " ".join(note_parts))


def adzuna_fetch(
    country: str, title: str, location: str | None, limit: int
) -> Tuple[List[Dict], Dict]:
    meta = {
        "country": country,
        "enabled": _is_enabled("ENABLE_ADZUNA", False),
        "ok": False,
        "count": 0,
        "status": None,
        "note": "",
    }
    if not meta["enabled"]:
        meta["note"] = "Adzuna disabled by ENABLE_ADZUNA"
        return [], meta

    app_id = os.getenv("ADZUNA_APP_ID", "")
    app_key = os.getenv("ADZUNA_APP_KEY", "")
    if not (app_id and app_key):
        meta["enabled"] = False
        meta["note"] = "disabled: ADZUNA_APP_ID/KEY missing or invalid"
        return [], meta
    if app_id.startswith(("your_", "PUT_")) or app_key.startswith(
        ("your_", "PUT_")
    ):
        meta["enabled"] = False
        meta["note"] = "disabled: placeholder ADZUNA credentials"
        return [], meta

    base = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
    qs = {
        "app_id": app_id,
        "app_key": app_key,
        "results_per_page": min(limit, 50),
        "what": title,
    }
    if location and location.lower() != "any":
        qs["where"] = location

    url = f"{base}?{urlencode(qs)}"
    headers = {
        "Accept": "application/json",
        "User-Agent": "Joblytic/1.0 (+contact: joblytic@local)",
    }
    try:
        r = requests.get(url, headers=headers, timeout=15)
        meta["status"] = r.status_code
        if r.status_code != 200:
            meta["note"] = (r.text or "")[:300]
            return [], meta
        data = r.json() or {}
        norm = normalize(
            data.get("results", [])[:limit], f"adzuna-{country}"
        )
        meta["ok"] = True
        meta["count"] = len(norm)
        return norm, meta
    except Exception as e:
        meta["note"] = str(e)
        return [], meta


# ========= JSearch (RapidAPI) =========
def _guess_country_code(loc: str | None) -> str | None:
    """استنتاج كود الدولة لـ JSearch من المكان"""
    if not loc:
        return "eg"
    l = loc.strip().lower()

    if any(x in l for x in ["egypt", "eg", "cairo", "alexandria", "giza"]):
        return "eg"
    if any(x in l for x in ["uae", "united arab emirates", "dubai", "abu dhabi", "ae"]):
        return "ae"
    if any(x in l for x in ["saudi", "ksa", "saudi arabia", "sa"]):
        return "sa"
    if any(x in l for x in ["qatar", "qa", "doha"]):
        return "qa"
    if any(x in l for x in ["kuwait", "kw"]):
        return "kw"
    return None


def provider_jsearch(
    title: str, location: str | None, limit: int
) -> Tuple[List[Dict], Dict]:
    """
    استدعاء JSearch من RapidAPI وإرجاع النتائج بشكل موحد.
    """
    meta = {
        "enabled": _is_enabled("ENABLE_JSEARCH", True),
        "ok": False,
        "count": 0,
        "status": None,
        "note": "",
    }
    if not meta["enabled"]:
        meta["note"] = "JSearch disabled by ENABLE_JSEARCH"
        return [], meta

    key = os.getenv("JSEARCH_API_KEY", "")
    if not key:
        meta["note"] = "disabled: JSEARCH_API_KEY missing"
        return [], meta

    url = "https://jsearch.p.rapidapi.com/search"

    # نخلي الـ query بسيط زي الـ playground
    query = title
    if location:
        query = f"{title} in {location}"

    country = _guess_country_code(location)

    # نخليها صفحة واحدة بس عشان ما يطولش (ونكتفي بحد أقصى 20 نتيجة)
    limit = min(limit, 20)
    num_pages = 1

    params = {
        "query": query,
        "page": "1",
        "num_pages": str(num_pages),
        "date_posted": "all",
    }
    if country:
        params["country"] = country

    headers = {
        "X-RapidAPI-Key": key,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        "Accept": "application/json",
        "User-Agent": "Joblytic/1.0 (+contact: joblytic@local)",
    }

    try:
        print(" Calling JSearch with:", params)
        r = requests.get(url, headers=headers, params=params, timeout=60)  # ← زودنا الـ timeout
        meta["status"] = r.status_code
        print(" JSearch HTTP status:", r.status_code)

        if r.status_code != 200:
            meta["note"] = (r.text or "")[:300]
            print(" JSearch error body:", meta["note"])
            return [], meta

        ctype = (r.headers.get("content-type") or "").lower()
        if "json" not in ctype:
            meta["note"] = f"Unexpected content-type: {ctype}. Body: {(r.text or '')[:200]}"
            print(" JSearch unexpected content-type:", ctype)
            return [], meta

        data = r.json() or {}
        items = data.get("data", [])[:limit]
        print(" JSearch items returned:", len(items))
        norm = normalize(items, "jsearch")

        meta["ok"] = True
        meta["count"] = len(norm)
        return norm, meta
    except Exception as e:
        meta["note"] = str(e)
        print(" JSearch exception:", e)
        return [], meta
# ========= TheirStack =========
def provider_theirstack(
    title: str, location: str | None, limit: int
) -> Tuple[List[Dict], Dict]:
    meta = {
        "enabled": _is_enabled("ENABLE_THEIRSTACK", True),
        "ok": False,
        "count": 0,
        "status": None,
        "note": "",
    }
    if not meta["enabled"]:
        meta["note"] = "TheirStack disabled by ENABLE_THEIRSTACK"
        return [], meta

    key = os.getenv("THEIRSTACK_API_KEY", "")
    if not key:
        meta["enabled"] = False
        meta["note"] = "disabled: THEIRSTACK_API_KEY missing"
        return [], meta

    headers = {
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
        "User-Agent": "Joblytic/1.0 (+contact: joblytic@local)",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://app.theirstack.com/",
    }

    endpoints = [
        (
            "https://app.theirstack.com/api/search/jobs/new",
            {"query": title},
        ),
        (
            "https://api.theirstack.com/v1/jobs/search",
            {"q": title},
        ),
    ]
    if location and location.lower() != "any":
        endpoints[0][1]["location"] = location
        endpoints[1][1]["location"] = location

    for url, params in endpoints:
        try:
            r = requests.get(url, headers=headers, params=params, timeout=20)
            meta["status"] = r.status_code
            if r.status_code != 200:
                meta["note"] = (r.text or "")[:300]
                continue

            ctype = (r.headers.get("content-type") or "").lower()
            if "json" not in ctype:
                meta["note"] = (
                    f"Unexpected content-type: {ctype}. "
                    f"Body: {(r.text or '')[:300]}"
                )
                continue

            data = r.json() or {}
            raw = data.get("data", data)
            if not isinstance(raw, list):
                meta["note"] = (
                    f"Unexpected JSON shape: keys={list(data.keys())[:5]}"
                )
                continue

            norm = normalize(raw[:limit], "theirstack")
            meta["ok"] = True
            meta["count"] = len(norm)
            return norm, meta

        except Exception as e:
            meta["note"] = str(e)
            continue

    return [], meta


# ========= API View =========
class ExternalJobSearchAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        title = request.query_params.get("title") or request.query_params.get("q")
        if not title:
            return Response({"detail": "Missing title parameter"}, status=400)

        raw_loc = (request.query_params.get("location") or "").strip()
        location = None if (not raw_loc or raw_loc.lower() == "any") else raw_loc

        countries_param = (
            request.query_params.get("countries")
            or request.query_params.get("country")
            or "eg"
        ).lower()
        requested_countries = [
            c.strip() for c in countries_param.split(",") if c.strip()
        ]
        adz_countries, adz_note = _sanitize_adzuna_countries(
            requested_countries
        )

        providers_param = (
            request.query_params.get("providers") or ""
        ).strip().lower()
        providers = [
            p for p in [s.strip() for s in providers_param.split(",")] if p
        ]

        limit = int(request.query_params.get("limit", 30) or 30)
        skip_cache = request.query_params.get("nocache") == "1"

        cache_key = (
            f"ext_jobs:v8:{title}:{location}:"
            f"{','.join(requested_countries)}:{limit}:{','.join(providers)}"
        )
        if not skip_cache:
            cached = cache.get(cache_key)
            if cached:
                return Response(cached)

        all_results: List[Dict] = []
        meta = {
            "notes": [],
            "jooble": {},
            "adzuna": [],
            "jsearch": {},
            "theirstack": {},
        }

        # Jooble
        if not providers or "jooble" in providers:
            jooble_res, jooble_meta = provider_jooble(title, location, limit)
            all_results.extend(jooble_res)
            meta["jooble"] = jooble_meta

        # Adzuna
        if adz_note:
            meta["notes"].append(adz_note)
        if not providers or "adzuna" in providers:
            adz_total, adz_meta_list = [], []
            for ctry in adz_countries:
                res, m = adzuna_fetch(ctry, title, location, limit)
                adz_total.extend(res)
                adz_meta_list.append(m)
            meta["adzuna"] = adz_meta_list
            all_results.extend(adz_total)

        # JSearch
        if not providers or "jsearch" in providers:
            js_res, js_meta = provider_jsearch(title, location, limit)
            all_results.extend(js_res)
            meta["jsearch"] = js_meta

        # TheirStack
        if not providers or "theirstack" in providers:
            ts_res, ts_meta = provider_theirstack(title, location, limit)
            all_results.extend(ts_res)
            meta["theirstack"] = ts_meta

        # dedupe by link
        seen, unique = set(), []
        for r in all_results:
            if r["link"] in seen:
                continue
            seen.add(r["link"])
            unique.append(r)

        resp = {
            "query": title,
            "location": location,
            "countries": requested_countries,
            "count_raw": len(all_results),
            "count_returned": len(unique),
            "results": unique,
            "meta": meta,
        }

        if not skip_cache:
            cache.set(resp, cache_key, 60 * 5)

        return Response(resp, status=status.HTTP_200_OK)
