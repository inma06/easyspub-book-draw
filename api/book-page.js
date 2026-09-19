import { BookPageScrapingError, scrapeBookPage } from "../scripts/book-page.mjs";

/** Vercel Function for the browser's same-origin book scraping request. */
export async function GET(request) {
  const sourceUrl = new URL(request.url).searchParams.get("url") || "";
  try {
    return Response.json(await scrapeBookPage(sourceUrl), {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    const status = error instanceof BookPageScrapingError ? error.status : 500;
    const message = error instanceof Error ? error.message : "도서 페이지를 불러오지 못했습니다.";
    return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
