function shortName(name, max = 13) {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

export function drawWheel(canvas, candidates) {
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 14;
  const slice = (Math.PI * 2) / candidates.length;
  const colors = ["#e94236", "#20283a", "#ffd85a", "#668df0", "#61d2b4", "#f18659"];
  ctx.clearRect(0, 0, size, size);

  candidates.forEach((name, index) => {
    const start = -Math.PI / 2 - slice / 2 + index * slice;
    const end = start + slice;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    ctx.lineWidth = candidates.length > 35 ? 1 : 3;
    ctx.strokeStyle = "rgba(255,255,255,.72)";
    ctx.stroke();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + slice / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = index % colors.length === 2 ? "#20232b" : "#fff";
    const fontSize = Math.max(12, Math.min(24, 520 / Math.max(candidates.length, 12)));
    ctx.font = `800 ${fontSize}px Pretendard, sans-serif`;
    ctx.fillText(shortName(name, candidates.length > 24 ? 10 : 15), radius - 27, 0);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.lineWidth = 12;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
}
