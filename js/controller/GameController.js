import { Board } from '../model/Board.js';
import { Settings } from '../model/Settings.js';
import { SHAPE_SETS } from '../config/themes.js';

const ARROW_STEPS = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

const DRAG_TYPE = 'text/plain';

/**
 * Coordina modelo y vistas: traduce eventos del usuario en operaciones
 * sobre el tablero y pide a las vistas que reflejen el resultado.
 */
export class GameController {
  #settings;
  #board;
  #selected = null;
  #dragSource = null;
  #boardView;
  #controlsView;
  #assistView;

  constructor({ settings, boardView, controlsView, assistView }) {
    this.#settings = settings;
    this.#boardView = boardView;
    this.#controlsView = controlsView;
    this.#assistView = assistView;
  }

  start() {
    this.#controlsView.write(this.#settings);
    this.#bindBoard();
    this.#bindActions();
    this.#controlsView.onChange((values) => this.#changeSettings(values));
    this.#newGame();
  }

  // --- Partida -------------------------------------------------------------

  #newGame() {
    this.#board = new Board(this.#settings.dimension);
    this.#selected = null;
    this.#boardView.render(this.#board, this.#settings);
    this.#assistView.hideWin();
    this.#refreshProgress();
  }

  #refreshProgress() {
    this.#boardView.updateRows(this.#board);
    this.#assistView.updateStats({
      moves: this.#board.moves,
      completed: this.#board.completedRows(),
      total: this.#board.size,
    });
  }

  get #isOver() {
    return this.#board.isSolved();
  }

  /** Pide confirmación solo si hay progreso que perder. */
  async #canDiscard() {
    if (this.#board.moves === 0 || this.#isOver) return true;
    return this.#assistView.confirmDiscard();
  }

  async #requestNewGame() {
    if (!(await this.#canDiscard())) return;
    this.#newGame();
    const n = this.#settings.dimension;
    this.#assistView.toast(`Nuevo tablero ${n} × ${n}`);
  }

  #trySwap(a, b) {
    if (a === b) return;
    if (!this.#board.swap(a, b)) {
      this.#boardView.markInvalid(b);
      this.#assistView.toast('Esas fichas son iguales: elige una distinta');
      return;
    }

    this.#boardView.clearHint();
    this.#boardView.showSwap(this.#board, a, b);
    this.#refreshProgress();

    if (this.#isOver) {
      this.#boardView.setLocked(true);
      this.#assistView.showWin(this.#board.moves);
      return;
    }
    this.#assistView.announce(
      `Intercambio hecho. Filas completas: ${this.#board.completedRows()} de ${this.#board.size}.`,
    );
  }

  // --- Selección con clic / teclado ----------------------------------------

  #select(index) {
    if (this.#isOver) return;

    if (this.#selected === null) {
      this.#selected = index;
      this.#boardView.markSelected(index);
      this.#assistView.announce(
        `${this.#boardView.pieceLabel(this.#board, index)} seleccionado. Elige otra ficha para intercambiarlas.`,
      );
      return;
    }

    const first = this.#selected;
    this.#clearSelection();
    if (first === index) {
      this.#assistView.announce('Selección cancelada.');
      return;
    }
    this.#trySwap(first, index);
  }

  #clearSelection() {
    this.#selected = null;
    this.#boardView.markSelected(null);
  }

  #onKeyDown(event) {
    const index = this.#boardView.indexFrom(event.target);
    if (index === null) return;

    if (event.key in ARROW_STEPS) {
      event.preventDefault();
      const [dRow, dCol] = ARROW_STEPS[event.key];
      const n = this.#board.size;
      const row = Math.min(n - 1, Math.max(0, this.#board.rowOf(index) + dRow));
      const col = Math.min(n - 1, Math.max(0, this.#board.colOf(index) + dCol));
      this.#boardView.focusCell(row * n + col);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.#select(index);
    } else if (event.key === 'Escape' && this.#selected !== null) {
      this.#clearSelection();
      this.#assistView.announce('Selección cancelada.');
    }
  }

  // --- Drag & Drop ---------------------------------------------------------

  #onDragStart(event) {
    const index = this.#boardView.indexFrom(event.target);
    if (index === null || this.#isOver) {
      event.preventDefault();
      return;
    }
    this.#clearSelection();
    this.#dragSource = index;
    event.dataTransfer.setData(DRAG_TYPE, String(index));
    event.dataTransfer.effectAllowed = 'move';
    this.#boardView.markDragging(index);
  }

  #onDragOver(event) {
    const index = this.#boardView.indexFrom(event.target);
    if (index === null || this.#dragSource === null || !event.dataTransfer.types.includes(DRAG_TYPE)) return;

    event.preventDefault(); // permite soltar aquí
    const isSelf = index === this.#dragSource;
    event.dataTransfer.dropEffect = isSelf ? 'none' : 'move';
    this.#boardView.markDropTarget(isSelf ? null : index);
  }

  #onDragLeave(event) {
    if (!this.#boardView.grid.contains(event.relatedTarget)) this.#boardView.markDropTarget(null);
  }

  #onDrop(event) {
    event.preventDefault();
    const from = Number.parseInt(event.dataTransfer.getData(DRAG_TYPE), 10);
    const to = this.#boardView.indexFrom(event.target);
    this.#endDrag();
    if (Number.isInteger(from) && to !== null) this.#trySwap(from, to);
  }

  #endDrag() {
    this.#dragSource = null;
    this.#boardView.markDragging(null);
    this.#boardView.markDropTarget(null);
  }

  // --- Ajustes y acciones --------------------------------------------------

  async #changeSettings(values) {
    const next = this.#settings.with(values);
    const clamped = next.dimension !== values.dimension;

    if (next.equals(this.#settings) || !(await this.#canDiscard())) {
      this.#controlsView.write(this.#settings);
      if (clamped) this.#rangeWarning();
      return;
    }

    this.#settings = next;
    next.save();
    this.#controlsView.write(next);
    this.#newGame();

    if (clamped) this.#rangeWarning();
    else this.#assistView.toast(`Nuevo tablero ${next.dimension} × ${next.dimension}`);
  }

  #rangeWarning() {
    this.#assistView.toast(`La dimensión va de ${Settings.MIN_DIMENSION} a ${Settings.MAX_DIMENSION}`);
  }

  #showHint() {
    if (this.#isOver) return;
    const [a, b] = this.#board.hint();
    this.#clearSelection();
    this.#boardView.showHint([a, b]);
    this.#assistView.announce(
      `Pista: intercambia ${this.#boardView.positionLabel(a)} con ${this.#boardView.positionLabel(b)}.`,
    );
  }

  #bindBoard() {
    const grid = this.#boardView.grid;
    grid.addEventListener('dragstart', (event) => this.#onDragStart(event));
    grid.addEventListener('dragover', (event) => this.#onDragOver(event));
    grid.addEventListener('dragleave', (event) => this.#onDragLeave(event));
    grid.addEventListener('drop', (event) => this.#onDrop(event));
    grid.addEventListener('dragend', () => this.#endDrag());
    grid.addEventListener('keydown', (event) => this.#onKeyDown(event));
    grid.addEventListener('click', (event) => {
      const index = this.#boardView.indexFrom(event.target);
      if (index !== null) this.#select(index);
    });
  }

  #bindActions() {
    const actions = {
      'new-game': () => this.#requestNewGame(),
      help: () => this.#assistView.openHelp(SHAPE_SETS[this.#settings.shapeSet].shapes),
      hint: () => this.#showHint(),
    };
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (button) actions[button.dataset.action]?.();
    });
  }
}
