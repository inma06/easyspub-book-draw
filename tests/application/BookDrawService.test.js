import test from "node:test";
import assert from "node:assert/strict";
import { BookDrawService } from "../../src/scripts/application/BookDrawService.js";

test("당첨자를 제외한 재추첨 후보를 유지한다", () => {
  const service = new BookDrawService({
    participantParser: () => ({ candidates: ["@one", "@two", "@three"], hits: 3, duplicates: 0 }),
    bookRepository: { findByUrl: async () => ({}) },
    randomIndex: () => 1,
  });

  service.registerChat("ignored", "도전");
  assert.equal(service.selectWinner(), "@two");
  assert.deepEqual(service.redrawWithoutWinner(), ["@one", "@three"]);
});
