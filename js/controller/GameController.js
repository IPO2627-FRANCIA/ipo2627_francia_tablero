import { Board } from '../model/Board.js';
import { Settings } from '../model/Settings.js';
import { messages } from '../view/messages.js';

/**
 * Coordina modelo y vistas: recibe las intenciones del usuario que emiten
 * las vistas, aplica las reglas del modelo y pide a las vistas que reflejen
 * el resultado. No toca el DOM ni decide reglas de juego.
 */
export class GameController {
  #settings;
  #store;
  #views;
  #board;
  #selected = null;

  constructor({ settings, store, views }) {
    this.#settings = settings;
    this.#store = store;
    this.#views = views;
  }

  start() {
    const { board, controls, actions, dialogs } = this.#views;

    controls.write(this.#settings);
    controls.onChange((values) => this.#changeSettings(values));

    board.onSelect((index) => this.#select(index));
    board.onSwap((a, b) => this.#trySwap(a, b));
    board.onCancel(() => this.#cancelSelection());
    board.onDragStart(() => this.#clearSelection());

    actions.onAction('new-game', () => this.#requestNewGame());
    actions.onAction('hint', () => this.#showHint());
    actions.onAction('help', () => dialogs.openHelp(this.#settings));

    this.#newGame();
  }

  // --- Partida -------------------------------------------------------------

  #newGame() {
    this.#board = new Board(this.#settings.dimension);
    this.#selected = null;
    this.#views.theme.apply(this.#settings);
    this.#views.board.render(this.#board, this.#settings);
    this.#views.win.hide();
    this.#updateStats();
  }

  #refreshProgress() {
    this.#views.board.updateRows();
    this.#updateStats();
  }

  #updateStats() {
    this.#views.stats.update({
      moves: this.#board.moves,
      completed: this.#board.completedRows(),
      total: this.#board.size,
    });
  }

  /** Pide confirmación solo si hay progreso que perder. */
  async #canDiscard() {
    return !this.#board.hasProgress() || this.#views.dialogs.confirmDiscard();
  }

  async #requestNewGame() {
    if (!(await this.#canDiscard())) return;
    this.#newGame();
    this.#views.feedback.toast(messages.newBoard(this.#settings.dimension));
  }

  #trySwap(a, b) {
    if (this.#board.isSolved()) return;
    const { board, feedback, win } = this.#views;
    if (!this.#board.swap(a, b)) {
      board.markInvalid(b);
      feedback.toast(messages.sameType);
      return;
    }

    board.clearHint();
    board.showSwap(a, b);
    this.#refreshProgress();

    if (this.#board.isSolved()) {
      board.setLocked(true);
      win.show(this.#board.moves);
      return;
    }
    feedback.announce(messages.swapDone(this.#board.completedRows(), this.#board.size));
  }

  // --- Selección con clic / teclado ----------------------------------------

  #select(index) {
    if (this.#board.isSolved()) return;

    if (this.#selected === null) {
      this.#selected = index;
      this.#views.board.markSelected(index);
      this.#views.feedback.announce(messages.selected(this.#views.board.pieceLabel(index)));
      return;
    }

    const first = this.#selected;
    this.#clearSelection();
    if (first === index) {
      this.#views.feedback.announce(messages.selectionCancelled);
      return;
    }
    this.#trySwap(first, index);
  }

  #cancelSelection() {
    if (this.#selected === null) return;
    this.#clearSelection();
    this.#views.feedback.announce(messages.selectionCancelled);
  }

  #clearSelection() {
    this.#selected = null;
    this.#views.board.markSelected(null);
  }

  // --- Ajustes y pistas ----------------------------------------------------

  async #changeSettings(values) {
    const { controls, feedback } = this.#views;
    const next = this.#settings.with(values);
    const outOfRange = !Settings.isInRange(values.dimension);
    const rangeWarning = messages.rangeWarning(Settings.DIMENSION.min, Settings.DIMENSION.max);

    if (next.equals(this.#settings)) {
      controls.write(this.#settings);
      if (outOfRange) feedback.toast(rangeWarning);
      return;
    }
    if (!(await this.#canDiscard())) {
      controls.write(this.#settings);
      return;
    }

    this.#settings = next;
    this.#store.save(next);
    controls.write(next);
    this.#newGame();
    feedback.toast(outOfRange ? rangeWarning : messages.newBoard(next.dimension));
  }

  #showHint() {
    if (this.#board.isSolved()) return;
    const { board, feedback } = this.#views;
    const [a, b] = this.#board.hint();
    this.#clearSelection();
    board.showHint([a, b]);
    feedback.announce(messages.hint(board.positionLabel(a), board.positionLabel(b)));
  }
}
