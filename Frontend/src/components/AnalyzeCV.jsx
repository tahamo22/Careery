async function analyzeCV(cvText) {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/analyze-cv/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: cvText }),
    });

    const data = await response.json();
    console.log("AI Result:", data);

    // تقدر تعرض النتيجة في الواجهة
    // setResult(data[0]?.generated_text || "No result");
  } catch (error) {
    console.error("Error:", error);
  }
}