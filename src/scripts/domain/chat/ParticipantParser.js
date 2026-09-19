export function normalizeChatText(value) {
  return String(value)
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F-\u009F\u00AD\u200B-\u200D\uFEFF\uFFFC]/g, "")
    .replace(/^[\s:：|·•—–-]+|[\s|]+$/g, "")
    .trim();
}

function isTimestamp(line) {
  return /^(방금|지금|고정됨|관리자|구독자|회원|\d+\s*(초|분|시간)\s*전|\d{1,2}:\d{2}(?::\d{2})?)$/i.test(line);
}

function linesWithinMarkers(raw) {
  const lines = String(raw).split(/\r?\n/);
  const marker = (line) => normalizeChatText(line);
  const start = lines.findIndex((line) => /^=*\s*시작\s*=*$/i.test(marker(line)));
  const stop = lines.findIndex((line, index) => index > start && /^=*\s*(그만|이상)\s*=*$/i.test(marker(line)));
  return lines.slice(start >= 0 ? start + 1 : 0, stop >= 0 ? stop : lines.length);
}

function isCopyArtifact(line) {
  return /^#\d+$/.test(line) || /^[|›»•·…]+$/.test(line);
}

/**
 * YouTube chat text is an anti-corruption boundary: this function converts
 * inconsistent copied chat formats into the Participant domain language.
 */
export function parseParticipants(rawChat, participationPhrase) {
  const phrase = normalizeChatText(participationPhrase).toLocaleLowerCase("ko-KR");
  if (!phrase) return { candidates: [], hits: 0, duplicates: 0 };

  const hits = [];
  let currentAuthor = "";
  let authorPending = false;
  const register = (author, message) => {
    if (author && normalizeChatText(message).toLocaleLowerCase("ko-KR").includes(phrase)) {
      hits.push(normalizeChatText(author));
    }
  };

  for (const sourceLine of linesWithinMarkers(rawChat)) {
    const line = normalizeChatText(sourceLine);
    if (!line || isCopyArtifact(line)) continue;

    const handles = [...line.matchAll(/@[\p{L}\p{N}_.-]+/gu)];
    if (handles.length) {
      handles.forEach((handle, index) => {
        const author = handle[0];
        const from = (handle.index || 0) + author.length;
        const to = index + 1 < handles.length ? handles[index + 1].index : line.length;
        const message = normalizeChatText(line.slice(from, to));
        if (message) register(author, message);
      });
      currentAuthor = handles.at(-1)[0];
      const last = handles.at(-1);
      authorPending = !normalizeChatText(line.slice((last.index || 0) + last[0].length));
      if (!authorPending) {
        currentAuthor = "";
      }
      continue;
    }

    const colonMatch = line.match(/^([^:：]{1,40})\s*[:：]\s*(.+)$/u);
    if (colonMatch) {
      currentAuthor = normalizeChatText(colonMatch[1]);
      register(currentAuthor, colonMatch[2]);
      authorPending = false;
      continue;
    }

    if (authorPending && isTimestamp(line)) continue;
    if (authorPending) {
      register(currentAuthor, line);
      authorPending = false;
    }
  }

  const unique = new Map();
  hits.forEach((name) => {
    const key = name.toLocaleLowerCase("ko-KR");
    if (!unique.has(key)) unique.set(key, name);
  });
  return { candidates: [...unique.values()], hits: hits.length, duplicates: hits.length - unique.size };
}
