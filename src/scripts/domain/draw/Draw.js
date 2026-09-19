export function removeCandidate(candidates, candidate) {
  return candidates.filter((name) => name !== candidate);
}

export function winnerAt(candidates, index) {
  if (!candidates.length) return null;
  return candidates[index];
}

export function secureRandomIndex(max, cryptoApi = globalThis.crypto) {
  if (max <= 1) return 0;
  const limit = Math.floor(0x100000000 / max) * max;
  const values = new Uint32Array(1);
  do cryptoApi.getRandomValues(values); while (values[0] >= limit);
  return values[0] % max;
}
