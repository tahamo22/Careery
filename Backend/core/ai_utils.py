# core/ai_utils.py

def match_score(text1: str, text2: str) -> float:
    """
    دالة بسيطة لحساب درجة التشابه بين نصين.
    ممكن تستخدم تقنيات متقدمة (TF-IDF, embeddings, etc)
    هنا مثال تجريبي: عدد الكلمات المشتركة / متوسط عدد الكلمات.
    """
    set1 = set(text1.lower().split())
    set2 = set(text2.lower().split())
    common_words = set1.intersection(set2)
    if not set1 or not set2:
        return 0.0
    score = len(common_words) / ((len(set1) + len(set2)) / 2)
    return round(score, 2)
