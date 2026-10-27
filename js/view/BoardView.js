import { SHAPE_SETS, SHAPE_NAMES, PALETTES } from '../config/appearance.js';
import { messages } from './messages.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const DRAG_TYPE = 'text/plain';

const ARROW_STEPS = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

/**
 * Pinta el tablero y refleja su estado visual (selección, arrastre, pistas).
 * Traduce los eventos del DOM (clic, teclado, Drag & Drop) en intenciones
 * —seleccionar, intercambiar, cancelar— sin tomar decisiones de juego.
 */
export class BoardView {
  #root;
  #grid;
  #rowStatus;
  #board = null;
  #cells = [];
  #badges = [];
  #shapes = [];
  #colors = [];
  #dragSource = null;
  #handlers = { select() {}, swap() {}, cancel() {}, dragStart() {} };

  constructor(root) {
    this.#root = root;
    this.#grid = root.querySelector('[data-board]');
    this.#rowStatus = root.querySelector('[data-row-status]');

    // Roving tabindex: solo la celda activa entra en el orden de tabulación
    this.#grid.addEventListener('focusin', (event) => {
      const index = this.#indexFrom(event.target);
      if (index !== null) this.#setActiveCell(index);
    });

    this.#grid.addEventListener('click', (event) => {
      const index = this.#indexFrom(event.target);
      if (index !== null) this.#handlers.select(index);
    });
    this.#grid.addEventListener('keydown', (event) => this.#onKeyDown(event));

    this.#grid.addEventListener('dragstart', (event) => this.#onDragStart(event));
    this.#grid.addEventListener('dragover', (event) => this.#onDragOver(event));
    this.#grid.addEventListener('dragleave', (event) => this.#onDragLeave(event));
    this.#grid.addEventListener('drop', (event) => this.#onDrop(event));
    this.#grid.addEventListener('dragend', () => this.#endDrag());
  }

  // --- Intenciones del usuario ---------------------------------------------

  /** Clic, Intro o Espacio sobre una ficha. */
  onSelect(handler) {
    this.#handlers.select = handler;
  }

  /** Ficha soltada sobre otra. */
  onSwap(handler) {
    this.#handlers.swap = handler;
  }

  /** Esc. */
  onCancel(handler) {
    this.#handlers.cancel = handler;
  }

  onDragStart(handler) {
    this.#handlers.dragStart = handler;
  }

  // --- Pintado -------------------------------------------------------------

  render(board, settings) {
    this.#board = board;
    this.#shapes = SHAPE_SETS[settings.shapeSet].shapes;
    this.#colors = PALETTES[settings.palette].colors;

    this.#root.dataset.tileSize = settings.tileSize;
    this.#root.style.setProperty('--n', board.size);
    this.setLocked(false);

    this.#cells = Array.from({ length: board.cellCount }, (_, index) => this.#createCell(index));
    const rows = Array.from({ length: board.size }, (_, row) => {
      const rowElement = document.createElement('div');
      rowElement.className = 'board__row';
      rowElement.setAttribute('role', 'row');
      rowElement.append(...this.#rowCells(row));
      return rowElement;
    });
    this.#grid.replaceChildren(...rows);

    this.#badges = rows.map(() => {
      const badge = document.createElement('li');
      badge.className = 'board__badge';
      return badge;
    });
    this.#rowStatus.replaceChildren(...this.#badges);

    this.#cells.forEach((_, index) => this.#paint(index));
    this.updateRows();
    this.#setActiveCell(0);
  }

  #createCell(index) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-selected', 'false');
    cell.dataset.cell = '';
    cell.dataset.index = index;
    cell.draggable = true;
    cell.tabIndex = -1;

    const piece = document.createElement('span');
    piece.className = 'piece';
    cell.append(piece);
    return cell;
  }

  #rowCells(row) {
    const size = this.#board.size;
    return this.#cells.slice(row * size, (row + 1) * size);
  }

  #paint(index) {
    const type = this.#board.typeAt(index);
    const cell = this.#cells[index];
    const piece = cell.firstElementChild;

    piece.dataset.type = type;
    piece.dataset.shape = this.#shapes[type];
    cell.setAttribute('aria-label', messages.cell(this.positionLabel(index), this.pieceLabel(index)));
  }

  positionLabel(index) {
    return messages.position(this.#board.rowOf(index) + 1, this.#board.colOf(index) + 1);
  }

  pieceLabel(index) {
    const type = this.#board.typeAt(index);
    return messages.piece(SHAPE_NAMES[this.#shapes[type]], this.#colors[type]);
  }

  #indexFrom(target) {
    const cell = target instanceof Element ? target.closest('[data-cell]') : null;
    return cell && this.#grid.contains(cell) ? Number(cell.dataset.index) : null;
  }

  /** Repinta las dos celdas y desliza cada pieza desde la posición de la otra. */
  showSwap(a, b) {
    this.#paint(a);
    this.#paint(b);
    if (reducedMotion.matches) return;

    const from = this.#cells[a].getBoundingClientRect();
    const to = this.#cells[b].getBoundingClientRect();
    const dx = to.left - from.left;
    const dy = to.top - from.top;
    this.#slide(a, dx, dy);
    this.#slide(b, -dx, -dy);
  }

  #slide(index, dx, dy) {
    const cell = this.#cells[index];
    cell.dataset.moving = '';
    const animation = cell.firstElementChild.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
      { duration: 260, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
    );
    animation.finished.finally(() => delete cell.dataset.moving).catch(() => {});
  }

  updateRows() {
    const board = this.#board;
    for (let row = 0; row < board.size; row++) {
      const complete = board.isRowComplete(row);
      const badge = this.#badges[row];
      badge.toggleAttribute('data-complete', complete);
      badge.textContent = complete ? '✓' : messages.rows(board.rowProgress(row), board.size);
      this.#rowCells(row).forEach((cell) => cell.toggleAttribute('data-row-complete', complete));
    }
  }

  // --- Estados visuales ----------------------------------------------------

  markSelected(index) {
    this.#cells.forEach((cell, i) => cell.setAttribute('aria-selected', String(i === index)));
  }

  #markDragging(index) {
    // Se aplica en el siguiente frame para no afectar a la imagen de arrastre
    requestAnimationFrame(() => {
      this.#cells.forEach((cell, i) => cell.toggleAttribute('data-dragging', i === index));
    });
  }

  #markDropTarget(index) {
    this.#cells.forEach((cell, i) => cell.toggleAttribute('data-drop-target', i === index));
  }

  markInvalid(index) {
    const cell = this.#cells[index];
    cell.removeAttribute('data-invalid');
    void cell.offsetWidth; // reinicia la animación si se repite
    cell.dataset.invalid = '';
    cell.addEventListener('animationend', () => cell.removeAttribute('data-invalid'), { once: true });
  }

  showHint(indexes) {
    this.clearHint();
    indexes.forEach((index) => (this.#cells[index].dataset.hint = ''));
  }

  clearHint() {
    this.#cells.forEach((cell) => cell.removeAttribute('data-hint'));
  }

  setLocked(locked) {
    this.#root.toggleAttribute('data-locked', locked);
    this.#cells.forEach((cell) => (cell.draggable = !locked));
  }

  #setActiveCell(index) {
    this.#cells.forEach((cell, i) => (cell.tabIndex = i === index ? 0 : -1));
  }

  // --- Teclado -------------------------------------------------------------

  #onKeyDown(event) {
    const index = this.#indexFrom(event.target);
    if (index === null) return;

    if (event.key in ARROW_STEPS) {
      event.preventDefault();
      const next = this.#board.neighbour(index, ...ARROW_STEPS[event.key]);
      this.#setActiveCell(next);
      this.#cells[next].focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.#handlers.select(index);
    } else if (event.key === 'Escape') {
      this.#handlers.cancel();
    }
  }

  // --- Drag & Drop ---------------------------------------------------------

  #onDragStart(event) {
    const index = this.#indexFrom(event.target);
    if (index === null) {
      event.preventDefault();
      return;
    }
    this.#dragSource = index;
    event.dataTransfer.setData(DRAG_TYPE, String(index));
    event.dataTransfer.effectAllowed = 'move';
    this.#markDragging(index);
    this.#handlers.dragStart(index);
  }

  #onDragOver(event) {
    const index = this.#indexFrom(event.target);
    if (index === null || this.#dragSource === null || !event.dataTransfer.types.includes(DRAG_TYPE)) return;

    event.preventDefault(); // permite soltar aquí
    const isSelf = index === this.#dragSource;
    event.dataTransfer.dropEffect = isSelf ? 'none' : 'move';
    this.#markDropTarget(isSelf ? null : index);
  }

  #onDragLeave(event) {
    if (!this.#grid.contains(event.relatedTarget)) this.#markDropTarget(null);
  }

  #onDrop(event) {
    event.preventDefault();
    const from = Number.parseInt(event.dataTransfer.getData(DRAG_TYPE), 10);
    const to = this.#indexFrom(event.target);
    this.#endDrag();
    if (Number.isInteger(from) && to !== null && from !== to) this.#handlers.swap(from, to);
  }

  #endDrag() {
    this.#dragSource = null;
    this.#markDragging(null);
    this.#markDropTarget(null);
  }
}
