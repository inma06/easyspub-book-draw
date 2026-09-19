import test from "node:test";
import assert from "node:assert/strict";
import { scrapeBookPage } from "../../scripts/book-page.mjs";

test("이지스퍼블리싱 세션 쿠키를 유지해 도서 HTML을 가져온다", async () => {
  const calls = [];
  const fetcher = async (_url, options) => {
    calls.push(options);
    if (calls.length === 1) {
      return { ok: true, headers: { getSetCookie: () => ["session=abc; Path=/"] }, text: async () => "" };
    }
    return { ok: true, headers: { getSetCookie: () => [] }, text: async () => "<h2>도서</h2>" };
  };

  const result = await scrapeBookPage("https://www.easyspub.co.kr/20_Menu/BookView/901/PUB", fetcher);

  assert.equal(result.html, "<h2>도서</h2>");
  assert.equal(calls[1].headers.Cookie, "session=abc");
});
