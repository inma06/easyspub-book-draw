import { BookDrawService } from "./application/BookDrawService.js";
import { parseParticipants, normalizeChatText } from "./domain/chat/ParticipantParser.js";
import { bookLabel } from "./domain/book/Book.js";
import { secureRandomIndex } from "./domain/draw/Draw.js";
import { EasyspubBookRepository } from "./infrastructure/EasyspubBookRepository.js";
import { drawWheel } from "./presentation/WheelRenderer.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const elements = {
  views: { prepare: $("#prepareView"), wheel: $("#wheelView"), winner: $("#winnerView") },
  keyword: $("#keywordInput"), chat: $("#chatInput"), parseButton: $("#parseButton"), parseSummary: $("#parseSummary"),
  candidateCount: $("#candidateCount"), candidateList: $("#candidateList"), clearCandidates: $("#clearCandidates"), goToWheel: $("#goToWheel"),
  bookUrl: $("#bookUrl"), bookTitle: $("#bookTitle"), bookAuthor: $("#bookAuthor"), bookDescription: $("#bookDescription"), bookImage: $("#bookImage"),
  loadBookButton: $("#loadBookButton"), bookLoadStatus: $("#bookLoadStatus"), bookCover: $("#bookCover"), bookCardTitle: $("#bookCardTitle"),
  bookCardDescription: $("#bookCardDescription"), bookHeadline: $("#bookHeadline"), wheelCanvas: $("#wheelCanvas"), wheelCount: $("#wheelCount"),
  wheelBook: $("#wheelBook"), spinButton: $("#spinButton"), spinLabel: $("#spinLabel"), winnerId: $("#winnerId"),
  winnerBookTitle: $("#winnerBookTitle"), winnerEmail: $("#winnerEmail"), winnerMessageText: $("#winnerMessageText"), drawAgain: $("#drawAgain"), toast: $("#toast"),
};
const service = new BookDrawService({ participantParser: parseParticipants, bookRepository: new EasyspubBookRepository(), randomIndex: secureRandomIndex });
const uiState = { currentView: "prepare", rotation: 0 };

function safeImageUrl(url) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch { return ""; }
}

function setCover(container, imageUrl) {
  const url = safeImageUrl(imageUrl);
  container.replaceChildren();
  if (!url) {
    container.classList.add("placeholder");
    container.innerHTML = "<span>BOOK</span>";
    return;
  }
  const image = document.createElement("img");
  image.src = url;
  image.alt = "도서 표지";
  image.referrerPolicy = "no-referrer";
  image.addEventListener("error", () => { container.classList.add("placeholder"); container.innerHTML = "<span>BOOK</span>"; });
  container.classList.remove("placeholder");
  container.append(image);
}

function bookFields() {
  return { url: elements.bookUrl.value, title: elements.bookTitle.value, author: elements.bookAuthor.value, description: elements.bookDescription.value, image: elements.bookImage.value };
}

function renderBook(book = service.book) {
  elements.bookCardTitle.textContent = book.title || "오늘의 책을 등록해 주세요";
  elements.bookCardDescription.textContent = book.description || "URL을 불러오거나 아래에서 직접 입력할 수 있어요.";
  elements.bookHeadline.textContent = bookLabel(book) || "도서 제목을 등록해 주세요.";
  setCover(elements.bookCover, book.image);
}

function renderCandidates() {
  const { candidates } = service;
  elements.candidateCount.textContent = String(candidates.length);
  elements.goToWheel.disabled = !service.canStartDraw();
  if (!candidates.length) {
    elements.candidateList.className = "candidate-list empty";
    elements.candidateList.innerHTML = "<p>분석된 후보가 여기에 표시됩니다.</p>";
    return;
  }
  elements.candidateList.className = "candidate-list";
  elements.candidateList.replaceChildren(...candidates.map((name) => {
    const chip = document.createElement("span");
    chip.className = "candidate-chip";
    const text = document.createElement("span");
    text.textContent = name;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.setAttribute("aria-label", `${name} 후보 삭제`);
    remove.textContent = "×";
    remove.addEventListener("click", () => { service.removeCandidate(name); renderCandidates(); });
    chip.append(text, remove);
    return chip;
  }));
}

function setView(name) {
  uiState.currentView = name;
  Object.entries(elements.views).forEach(([key, view]) => view.classList.toggle("is-active", key === name));
  const activeIndex = ["prepare", "wheel", "winner"].indexOf(name);
  $$(".step").forEach((step, index) => { step.classList.toggle("is-active", index === activeIndex); step.classList.toggle("is-done", index < activeIndex); });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderWheel() {
  elements.wheelCount.textContent = String(service.candidates.length);
  elements.wheelBook.querySelector("strong").textContent = bookLabel(service.book) || "도서 정보 없음";
  setCover(elements.wheelBook.querySelector(".stage-book-thumb"), service.book.image);
  drawWheel(elements.wheelCanvas, service.candidates);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2400);
}

function registerChat() {
  if (!elements.chat.value.trim()) return showToast("채팅 내용을 먼저 붙여넣어 주세요.");
  const result = service.registerChat(elements.chat.value, elements.keyword.value);
  renderCandidates();
  elements.parseSummary.textContent = result.candidates.length ? `${result.candidates.length}명 등록 · 중복 ${result.duplicates}건 제외` : `‘${elements.keyword.value || "도전"}’를 쓴 계정을 찾지 못했습니다.`;
  elements.parseSummary.className = result.candidates.length ? "parse-summary success" : "parse-summary";
  if (result.candidates.length) showToast(`${result.candidates.length}명의 후보를 등록했습니다.`);
}

async function loadBook() {
  const url = safeImageUrl(elements.bookUrl.value);
  if (!url) return showToast("올바른 도서 URL을 입력해 주세요.");
  elements.loadBookButton.disabled = true;
  elements.loadBookButton.textContent = "불러오는 중";
  elements.bookLoadStatus.textContent = "도서 정보를 확인하고 있습니다…";
  elements.bookLoadStatus.className = "helper loading";
  try {
    const book = await service.loadBook(url);
    Object.entries(book).forEach(([key, value]) => {
      const field = elements[`book${key[0].toUpperCase()}${key.slice(1)}`];
      if (field) field.value = value;
    });
    renderBook(book);
    elements.bookLoadStatus.textContent = "도서 정보를 불러왔습니다.";
    elements.bookLoadStatus.className = "helper";
    showToast("오늘의 도서를 등록했습니다.");
  } catch (error) {
    elements.bookLoadStatus.textContent = error.message || "자동 불러오기에 실패했습니다.";
    elements.bookLoadStatus.className = "helper error";
    $(".manual-fields").open = true;
  } finally {
    elements.loadBookButton.disabled = false;
    elements.loadBookButton.textContent = "불러오기";
  }
}

function prepareWheel() {
  service.updateBook(bookFields());
  if (!service.canStartDraw()) return showToast("추첨 후보는 2명 이상이어야 합니다.");
  renderWheel();
  setView("wheel");
}

function spinWheel() {
  if (elements.spinButton.disabled || !service.candidates.length) return;
  const winner = service.selectWinner();
  const sliceDegrees = 360 / service.candidates.length;
  const current = ((uiState.rotation % 360) + 360) % 360;
  const winnerIndex = service.candidates.indexOf(winner);
  uiState.rotation += 360 * 7 + ((360 - winnerIndex * sliceDegrees - current + 360) % 360);
  elements.spinButton.disabled = true;
  elements.spinButton.classList.add("is-spinning");
  elements.spinLabel.textContent = "추첨 중…";
  elements.wheelCanvas.style.transition = "transform 4.8s cubic-bezier(.12,.68,.08,1)";
  elements.wheelCanvas.style.transform = `rotate(${uiState.rotation}deg)`;
  setTimeout(showWinner, 5000);
}

function showWinner() {
  elements.spinButton.disabled = false;
  elements.spinButton.classList.remove("is-spinning");
  elements.spinLabel.textContent = "추첨하기";
  elements.winnerId.textContent = service.winner || "당첨자";
  elements.winnerBookTitle.textContent = service.book.title || "오늘의 도서";
  elements.winnerEmail.textContent = "ohjiwan@gmail.com";
  elements.winnerMessageText.textContent = "이름, 전화번호, 주소, 책이름, 사인 유무를 보내주세요.";
  setCover($(".winner-book-cover"), service.book.image);
  setView("winner");
}

function redraw() {
  service.redrawWithoutWinner();
  renderCandidates();
  if (!service.canStartDraw()) { setView("prepare"); return showToast("남은 후보가 2명 미만이라 준비 화면으로 돌아갑니다."); }
  uiState.rotation = 0;
  elements.wheelCanvas.style.transition = "none";
  elements.wheelCanvas.style.transform = "rotate(0deg)";
  renderWheel();
  setView("wheel");
}

$(".brand-image").addEventListener("error", (event) => { event.currentTarget.style.display = "none"; $(".brand-fallback").style.display = "inline"; });
elements.parseButton.addEventListener("click", registerChat);
elements.clearCandidates.addEventListener("click", () => { service.clearCandidates(); renderCandidates(); elements.parseSummary.textContent = "후보를 모두 비웠습니다."; elements.parseSummary.className = "parse-summary"; });
elements.goToWheel.addEventListener("click", prepareWheel);
elements.loadBookButton.addEventListener("click", loadBook);
[elements.bookTitle, elements.bookAuthor, elements.bookDescription, elements.bookImage].forEach((field) => field.addEventListener("input", () => renderBook(service.updateBook(bookFields()))));
elements.spinButton.addEventListener("click", spinWheel);
elements.drawAgain.addEventListener("click", redraw);
$("[data-action='back-prepare']").addEventListener("click", () => setView("prepare"));
$$("[data-action='home']").forEach((button) => button.addEventListener("click", (event) => { event.preventDefault(); setView("prepare"); }));
window.addEventListener("resize", () => { if (uiState.currentView === "wheel") renderWheel(); });

const modelContext = document.modelContext;
if (modelContext?.registerTool) {
  Promise.resolve(modelContext.registerTool({
    name: "prepare_book_draw", title: "도서 추첨 준비", description: "유튜브 채팅과 도전 문구를 입력해 중복을 제거한 추첨 후보를 준비 화면에 등록합니다.",
    inputSchema: { type: "object", properties: { chatText: { type: "string", minLength: 1 }, keyword: { type: "string", minLength: 1, maxLength: 20 } }, required: ["chatText", "keyword"], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    execute(input) {
      const keyword = normalizeChatText(input?.keyword);
      if (!keyword || keyword.length > 20 || !input?.chatText?.trim()) throw new TypeError("유효한 채팅 원문과 20자 이하의 도전 문구를 입력해 주세요.");
      elements.chat.value = input.chatText;
      elements.keyword.value = keyword;
      const result = service.registerChat(input.chatText, keyword);
      renderCandidates(); setView("prepare");
      elements.parseSummary.textContent = `${result.candidates.length}명 등록 · 중복 ${result.duplicates}건 제외`;
      elements.parseSummary.className = result.candidates.length ? "parse-summary success" : "parse-summary";
      return { candidateCount: result.candidates.length, duplicatesRemoved: result.duplicates };
    }
  })).catch(() => {});
}

renderCandidates();
