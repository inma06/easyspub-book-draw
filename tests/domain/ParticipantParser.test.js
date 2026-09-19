import test from "node:test";
import assert from "node:assert/strict";
import { parseParticipants } from "../../src/scripts/domain/chat/ParticipantParser.js";
import { createTestChat } from "../../src/scripts/testing/createTestChat.js";

test("참여 문구가 포함된 메시지를 핸들별로 한 번만 후보에 등록한다", () => {
  const result = parseParticipants(`시작\n@rpgh8322\n​​참여?\n@baeglet\n참여합니다.\n@rpgh8322 참여!!\n그만`, "참여");

  assert.deepEqual(result.candidates, ["@rpgh8322", "@baeglet"]);
  assert.equal(result.hits, 3);
  assert.equal(result.duplicates, 1);
});

test("100명 테스트 채팅의 복사 노이즈와 줄바꿈 없는 핸들을 처리한다", () => {
  const result = parseParticipants(createTestChat(), "참여");

  assert.equal(result.candidates.length, 100);
  assert.equal(result.candidates.includes("@OJTube"), false);
  assert.equal(result.candidates.includes("@test-user-026"), true);
  assert.equal(result.duplicates, 1);
});
