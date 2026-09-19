const participationMessages = ["도전합니다.", "도전요", "도전!!!!!", "도전?", "도전할게요", "도전"];

/** Generates a realistic copied-chat fixture with 100 unique valid entrants. */
export function createTestChat() {
  const lines = ["=== 시작 ===", "@김종민-q6u", "오늘도 반가워요", "", "@user-qd4mb9dev", "#3", "do it 프론트엔드 면접관으로 들어갈 때 좋아요", ""];
  for (let number = 1; number <= 100; number += 1) {
    const handle = `@test-user-${String(number).padStart(3, "0")}`;
    const message = participationMessages[(number - 1) % participationMessages.length];
    if (number === 25) {
      lines.push(`${handle} ${message} @test-user-026 도전요`);
      number += 1;
      continue;
    }
    lines.push(handle, message);
    if (number % 20 === 0) lines.push("", "#3", "");
  }
  lines.push("@test-user-005", "도전합니다.", "@OJTube", "​=== 이상 ===");
  return lines.join("\n");
}
