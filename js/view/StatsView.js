import { messages } from './messages.js';

/** Marcadores de la cabecera: movimientos y filas completas. */
export class StatsView {
  #moves;
  #rows;

  constructor(root) {
    this.#moves = root.querySelector('[data-stat="moves"]');
    this.#rows = root.querySelector('[data-stat="rows"]');
  }

  update({ moves, completed, total }) {
    this.#moves.value = moves;
    this.#rows.value = messages.rows(completed, total);
  }
}
