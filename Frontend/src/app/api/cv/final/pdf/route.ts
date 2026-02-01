import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import type { Browser } from "puppeteer";

export const runtime = "nodejs";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const printUrl = `${baseUrl}/user/create-cv/FinalCV?print=1`;

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) {
    return NextResponse.json(
      { error: "Missing Authorization token. Please login again." },
      { status: 401 }
    );
  }

  let browser: Browser | null = null;

  try {
    // 1) Fetch CV from backend
    const cvRes = await fetch(`${API_BASE_URL}/api/cvs/`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!cvRes.ok) {
      const t = await cvRes.text();
      return NextResponse.json(
        { error: "Failed to fetch CV from backend", details: t },
        { status: 500 }
      );
    }

    const cvList = await cvRes.json();
    const cvData = Array.isArray(cvList) && cvList.length > 0 ? cvList[0] : null;

    if (!cvData) {
      return NextResponse.json(
        { error: "No CV data found for this user." },
        { status: 404 }
      );
    }

    // 2) Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1700 });

    // 3) Inject token + cvData into localStorage
    await page.evaluateOnNewDocument(
      (tkn: string, cv: any) => {
        try {
          localStorage.setItem("access", tkn);
          localStorage.setItem("cvData", JSON.stringify(cv));
        } catch {}
      },
      token,
      cvData
    );

    // 4) Open print page
    await page.goto(printUrl, { waitUntil: "domcontentloaded" });

    // 5) Wait for readiness + preview
    await page.waitForFunction("window.__CV_READY__ === true", { timeout: 30000 });
    await page.waitForSelector("#cv-preview", { visible: true, timeout: 30000 });

    // 6) Small delay (safe replacement for waitForTimeout)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 7) Inject anti-break CSS (helps keep sections together)
    await page.addStyleTag({
      content: `
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          section, header, div, ul, li { break-inside: avoid !important; page-break-inside: avoid !important; }
        }
      `,
    });

    // 8) Measure REAL content size (scroll sizes) of cv-preview
    const box = await page.$eval("#cv-preview", (el) => {
      const htmlEl = el as HTMLElement;
      const width = Math.max(htmlEl.scrollWidth, htmlEl.offsetWidth);
      const height = Math.max(htmlEl.scrollHeight, htmlEl.offsetHeight);
      return { width, height };
    });

    if (!box.width || !box.height) {
      return NextResponse.json(
        { error: "Could not measure CV preview size." },
        { status: 500 }
      );
    }

    // 9) Compute scale to fit ONE A4 page (no cropping)
    const pxPerInch = 96;
    const a4WidthPx = 8.27 * pxPerInch; // ~794
    const a4HeightPx = 11.69 * pxPerInch; // ~1122

    // margins (mm) - you can reduce slightly if needed
    const marginTopMm = 4;
    const marginBottomMm = 4;
    const marginLeftMm = 6;
    const marginRightMm = 6;

    const mmToIn = (mm: number) => mm / 25.4;

    const availableWidthPx =
      a4WidthPx - (mmToIn(marginLeftMm) + mmToIn(marginRightMm)) * pxPerInch;

    const availableHeightPx =
      a4HeightPx - (mmToIn(marginTopMm) + mmToIn(marginBottomMm)) * pxPerInch;

    const scaleByWidth = availableWidthPx / box.width;
    const scaleByHeight = availableHeightPx / box.height;

    // Choose the smaller scale so EVERYTHING fits
    let scale = Math.min(scaleByWidth, scaleByHeight);

    // ✅ Safety factor to prevent tiny cropping due to fonts/layout rounding
    scale = scale * 0.94;

    // Clamp
    scale = Math.max(0.2, Math.min(1, scale));

    // 10) Generate PDF (A4) — WITHOUT pageRanges to avoid cropping
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      scale,
      margin: {
        top: `${marginTopMm}mm`,
        right: `${marginRightMm}mm`,
        bottom: `${marginBottomMm}mm`,
        left: `${marginLeftMm}mm`,
      },
    });

    const pdfUint8 = new Uint8Array(pdfBuffer);

    // 11) Upload generated PDF to backend (store per user)
    try {
      const form = new FormData();

      const blob = new Blob([pdfUint8], { type: "application/pdf" });

      // ✅ IMPORTANT: Do NOT use File() in Node runtime (may break). Use Blob with filename instead.
      form.append("file", blob, "Final_CV.pdf");
      form.append("kind", "final");

      // ✅ IMPORTANT: Your backend endpoint is /api/cv/pdf/upload/ (NOT /api/cv-pdf/upload/)
      const uploadRes = await fetch(`${API_BASE_URL}/api/cv/pdf/upload/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // ❌ Do not set Content-Type manually with FormData
        },
        body: form,
      });

      if (!uploadRes.ok) {
        const t = await uploadRes.text();
        console.error("PDF upload failed:", uploadRes.status, t);
      } else {
        const uploaded = await uploadRes.json();
        console.log("PDF uploaded:", uploaded);
      }
    } catch (err: any) {
      console.error("PDF upload exception:", err?.message || err);
    }

    return new NextResponse(Buffer.from(pdfUint8), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Final_CV.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to generate PDF", details: e?.message || String(e) },
      { status: 500 }
    );
  } finally {
    if (browser) await browser.close();
  }
}
