import { messages } from './messages.js';

/** Pantalla final: capa sobre el tablero cuando la partida se completa. */
export class WinView {
  #root;
  #moves;
  #action;

  constructor(root) {
    this.#root = root;
    this.#moves = root.querySelector('[data-win-moves]');
    this.#action = root.querySelector('[data-action="new-game"]');
  }

  show(moves) {
    this.#moves.textContent = messages.moves(moves);
    this.#root.hidden = false;
    this.#action.focus();
  }

  hide() {
    this.#root.hidden = true;
  }
}
