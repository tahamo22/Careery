# core/upwork_scraper.py
import requests
from bs4 import BeautifulSoup

def scrape_upwork(query="developer", limit=20):
    url = f"https://www.upwork.com/nx/search/jobs/?q={query.replace(' ', '%20')}"

    headers = {
        "User-Agent": "Mozilla/5.0",
    }

    r = requests.get(url, headers=headers)
    jobs = []

    if r.status_code != 200:
        return []

    soup = BeautifulSoup(r.text, "html.parser")

    cards = soup.select("section.up-card-section")[:limit]

    for card in cards:
        title = card.select_one("h4").get_text(strip=True) if card.select_one("h4") else ""
        desc = card.select_one("p").get_text(strip=True) if card.select_one("p") else ""
        link = "https://www.upwork.com" + card.select_one("a")["href"] if card.select_one("a") else ""
        budget = card.select_one(".up-job-details__amount").get_text(strip=True) if card.select_one(".up-job-details__amount") else ""

        jobs.append({
            "title": title,
            "snippet": desc,
            "url": link,
            "budget": budget,
            "platform": "Upwork (Scraped)",
        })

    return jobs
