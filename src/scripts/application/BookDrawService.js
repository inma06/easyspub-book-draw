import { createBook } from "../domain/book/Book.js";
import { removeCandidate, winnerAt } from "../domain/draw/Draw.js";

export class BookDrawService {
  constructor({ participantParser, bookRepository, randomIndex }) {
    this.participantParser = participantParser;
    this.bookRepository = bookRepository;
    this.randomIndex = randomIndex;
    this.candidates = [];
    this.book = createBook();
    this.winner = null;
  }

  registerChat(chatText, phrase) {
    const result = this.participantParser(chatText, phrase);
    this.candidates = result.candidates;
    return result;
  }

  clearCandidates() { this.candidates = []; }

  removeCandidate(candidate) {
    this.candidates = removeCandidate(this.candidates, candidate);
  }

  updateBook(values) {
    this.book = createBook({ ...this.book, ...values });
    return this.book;
  }

  async loadBook(url) {
    const book = await this.bookRepository.findByUrl(url);
    this.book = createBook(book);
    return this.book;
  }

  canStartDraw() { return this.candidates.length >= 2; }

  selectWinner() {
    if (!this.candidates.length) return null;
    this.winner = winnerAt(this.candidates, this.randomIndex(this.candidates.length));
    return this.winner;
  }

  redrawWithoutWinner() {
    if (this.winner) this.candidates = removeCandidate(this.candidates, this.winner);
    this.winner = null;
    return this.candidates;
  }
}
