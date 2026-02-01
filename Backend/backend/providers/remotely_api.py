import os
import requests

def fetch_remotely_jobs(query="developer", limit=20):
    KEY = os.getenv("REMOTELY_KEY")
    HOST = os.getenv("REMOTELY_HOST")

    if not KEY:
        return []

    url = f"https://{HOST}/gigs"

    headers = {
        "X-RapidAPI-Key": KEY,
        "X-RapidAPI-Host": HOST
    }

    try:
        r = requests.get(url, headers=headers, params={"q": query}, timeout=15)
        if r.status_code != 200:
            return []

        gigs = r.json().get("gigs", [])

        cleaned = []
        for g in gigs[:limit]:
            cleaned.append({
                "title": g.get("title"),
                "description": g.get("description"),
                "url": g.get("url"),
                "skills": g.get("skills", []),
                "budget": g.get("payment"),
                "platform": "Remotely"
            })

        return cleaned

    except:
        return []
