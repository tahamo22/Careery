# backend/providers/upwork_api.py
import os
import requests

UPWORK_KEY = os.getenv("UPWORK_RAPIDAPI_KEY")
UPWORK_HOST = os.getenv("UPWORK_RAPIDAPI_HOST")

def fetch_upwork_jobs(query="developer", total_limit=100):
    if not UPWORK_KEY:
        print("❌ No Upwork API Key found")
        return []

    url = "https://upwork-jobs-api3.p.rapidapi.com/fetch-upwork-jobs"

    headers = {
        "X-RapidAPI-Key": UPWORK_KEY,
        "X-RapidAPI-Host": UPWORK_HOST,
    }

    params = {
        "query": query,
        "limit": min(total_limit, 100),
    }

    r = requests.get(url, headers=headers, params=params, timeout=20)

    print("\n=== UPWORK DEBUG ===")
    print("STATUS:", r.status_code)
    print(r.text[:500])
    print("====================\n")

    if r.status_code != 200:
        return []

    data = r.json()
    jobs = data.get("data") or data.get("results") or []

    collected = []
    for job in jobs:
        collected.append({
            "title": job.get("title"),
            "description": job.get("description"),
            "url": job.get("url"),
            "skills": job.get("skills", []),
            "country": job.get("country") or "Worldwide",
            "budget": job.get("budget"),
            "platform": "Upwork",
        })

    return collected[:total_limit]
