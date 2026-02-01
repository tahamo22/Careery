import requests

HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/tahamo/qwen-job-description-ft4"
HUGGINGFACE_TOKEN = "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"

headers = {"Authorization": f"Bearer {HUGGINGFACE_TOKEN}"}


def analyze_with_ai(input_text):
    payload = {"inputs": input_text}
    response = requests.post(HUGGINGFACE_API_URL, headers=headers, json=payload)

    if response.status_code != 200:
        return {"error": f"AI request failed: {response.text}"}

    return response.json()