import { SHAPE_SETS, SHAPE_NAMES, PALETTES } from '../config/themes.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Pinta el tablero y refleja su estado visual (selección, arrastre, pistas).
 * No toma decisiones de juego: el controlador le dice qué mostrar.
 */
export class BoardView {
  #root;
  #grid;
  #rowStatus;
  #cells = [];
  #badges = [];
  #size = 0;
  #shapes = [];
  #colors = [];

  constructor(root) {
    this.#root = root;
    this.#grid = root.querySelector('[data-board]');
    this.#rowStatus = root.querySelector('[data-row-status]');

    // Roving tabindex: solo la celda activa entra en el orden de tabulación
    this.#grid.addEventListener('focusin', (event) => {
      const index = this.indexFrom(event.target);
      if (index !== null) this.#setActiveCell(index);
    });
  }

  get grid() {
    return this.#grid;
  }

  render(board, settings) {
    this.#size = board.size;
    this.#shapes = SHAPE_SETS[settings.shapeSet].shapes;
    this.#colors = PALETTES[settings.palette].colors;

    document.documentElement.dataset.palette = settings.palette;
    this.#root.dataset.tileSize = settings.tileSize;
    this.#root.style.setProperty('--n', board.size);
    this.setLocked(false);

    this.#cells = Array.from({ length: board.cellCount }, (_, index) => this.#createCell(index));
    const rows = Array.from({ length: board.size }, (_, row) => {
      const rowElement = document.createElement('div');
      rowElement.className = 'board__row';
      rowElement.setAttribute('role', 'row');
      rowElement.append(...this.#cells.slice(row * board.size, (row + 1) * board.size));
      return rowElement;
    });
    this.#grid.replaceChildren(...rows);

    this.#badges = rows.map(() => {
      const badge = document.createElement('li');
      badge.className = 'board__badge';
      return badge;
    });
    this.#rowStatus.replaceChildren(...this.#badges);

    this.#cells.forEach((_, index) => this.#paint(board, index));
    this.updateRows(board);
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

  #paint(board, index) {
    const type = board.typeAt(index);
    const shape = this.#shapes[type];
    const cell = this.#cells[index];
    const piece = cell.firstElementChild;

    piece.dataset.type = type;
    piece.dataset.shape = shape;
    cell.setAttribute('aria-label', `${this.positionLabel(index)}: ${SHAPE_NAMES[shape]} ${this.#colors[type]}`);
  }

  positionLabel(index) {
    const row = Math.floor(index / this.#size) + 1;
    const col = (index % this.#size) + 1;
    return `Fila ${row}, columna ${col}`;
  }

  pieceLabel(board, index) {
    const type = board.typeAt(index);
    return `${SHAPE_NAMES[this.#shapes[type]]} ${this.#colors[type]}`;
  }

  indexFrom(target) {
    const cell = target instanceof Element ? target.closest('[data-cell]') : null;
    return cell && this.#grid.contains(cell) ? Number(cell.dataset.index) : null;
  }

  /** Repinta las dos celdas y desliza cada pieza desde la posición de la otra. */
  showSwap(board, a, b) {
    this.#paint(board, a);
    this.#paint(board, b);
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

  updateRows(board) {
    for (let row = 0; row < board.size; row++) {
      const complete = board.isRowComplete(row);
      const badge = this.#badges[row];
      badge.toggleAttribute('data-complete', complete);
      badge.textContent = complete ? '✓' : `${board.rowProgress(row)}/${board.size}`;

      this.#cells
        .slice(row * board.size, (row + 1) * board.size)
        .forEach((cell) => cell.toggleAttribute('data-row-complete', complete));
    }
  }

  markSelected(index) {
    this.#cells.forEach((cell, i) => cell.setAttribute('aria-selected', String(i === index)));
  }

  markDragging(index) {
    // Se aplica en el siguiente frame para no afectar a la imagen de arrastre
    requestAnimationFrame(() => {
      this.#cells.forEach((cell, i) => cell.toggleAttribute('data-dragging', i === index));
    });
  }

  markDropTarget(index) {
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

  focusCell(index) {
    this.#setActiveCell(index);
    this.#cells[index].focus();
  }

  #setActiveCell(index) {
    this.#cells.forEach((cell, i) => (cell.tabIndex = i === index ? 0 : -1));
  }
}
