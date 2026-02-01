import os
import requests

def fetch_workana_jobs(query="developer", limit=20):
    KEY = os.getenv("WORKANA_KEY")
    HOST = os.getenv("WORKANA_HOST")

    if not KEY:
        return []

    url = f"https://{HOST}/job/list"

    headers = {
        "X-RapidAPI-Key": KEY,
        "X-RapidAPI-Host": HOST
    }

    try:
        r = requests.get(url, headers=headers, params={"search": query}, timeout=15)
        if r.status_code != 200:
            return []

        items = r.json().get("jobs", [])

        cleaned = []
        for job in items[:limit]:
            cleaned.append({
                "title": job.get("title"),
                "description": job.get("excerpt") or job.get("description"),
                "url": "https://www.workana.com" + job.get("link", ""),
                "skills": job.get("skills", []),
                "budget": job.get("budget"),
                "platform": "Workana"
            })

        return cleaned

    except:
        return []
