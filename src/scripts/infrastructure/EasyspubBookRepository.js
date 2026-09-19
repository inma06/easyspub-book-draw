function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function text(documentRoot, selector) {
  return documentRoot.querySelector(selector)?.textContent?.replace(/\s+/g, " ").trim() || "";
}

function meta(documentRoot, selector) {
  return documentRoot.querySelector(selector)?.getAttribute("content")?.trim() || "";
}

function imageUrl(documentRoot, pageUrl) {
  const source = documentRoot.querySelector("#BOOK_IMGURL")?.getAttribute("src")?.trim()
    || meta(documentRoot, 'meta[property="og:image"]');
  if (!source) return "";
  try { return new URL(source, pageUrl).href; } catch { return ""; }
}

function author(documentRoot) {
  const label = [...documentRoot.querySelectorAll(".book_info dt")].find((element) =>
    element.textContent.replace(/\s+/g, "") === "저자"
  );
  return label?.nextElementSibling?.textContent?.replace(/\s+/g, " ").trim() || "";
}

/** Infrastructure adapter for the local /api/book-page HTTP boundary. */
export class EasyspubBookRepository {
  async findByUrl(rawUrl) {
    const url = safeHttpUrl(rawUrl);
    if (!url) throw new TypeError("올바른 도서 URL을 입력해 주세요.");

    const response = await fetch(`/api/book-page?url=${encodeURIComponent(url)}`, {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error("도서 페이지를 불러오지 못했습니다.");
    const payload = await response.json();
    if (!payload.html) throw new Error("도서 페이지 본문이 없습니다.");

    const documentRoot = new DOMParser().parseFromString(payload.html, "text/html");
    return {
      url,
      title: text(documentRoot, "#BOOK_TITLE") || meta(documentRoot, 'meta[property="og:title"]'),
      author: author(documentRoot),
      description: text(documentRoot, "#BOOK_COMMENT")
        || meta(documentRoot, 'meta[name="description"], meta[property="og:description"]'),
      image: imageUrl(documentRoot, url),
    };
  }
}
