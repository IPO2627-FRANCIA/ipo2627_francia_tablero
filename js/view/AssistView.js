const TOAST_DURATION = 2800;

const pluralize = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;

/**
 * Asistencia al usuario: marcadores, avisos, anuncios para lectores de
 * pantalla, pantalla final y diálogos.
 */
export class AssistView {
  #moves;
  #rows;
  #toast;
  #toastTimer;
  #announcer;
  #win;
  #winMoves;
  #help;
  #confirm;

  constructor(root) {
    this.#moves = root.querySelector('[data-stat="moves"]');
    this.#rows = root.querySelector('[data-stat="rows"]');
    this.#toast = root.querySelector('[data-toast]');
    this.#announcer = root.querySelector('[data-announcer]');
    this.#win = root.querySelector('[data-win]');
    this.#winMoves = root.querySelector('[data-win-moves]');
    this.#help = root.querySelector('[data-dialog="help"]');
    this.#confirm = root.querySelector('[data-dialog="confirm"]');

    // Clic en el fondo oscurecido cierra la ayuda
    this.#help.addEventListener('click', (event) => {
      if (event.target === this.#help) this.#help.close();
    });
  }

  updateStats({ moves, completed, total }) {
    this.#moves.value = moves;
    this.#rows.value = `${completed}/${total}`;
  }

  /** Mensaje solo para lectores de pantalla. */
  announce(message) {
    this.#announcer.textContent = '';
    requestAnimationFrame(() => (this.#announcer.textContent = message));
  }

  /** Aviso visible y anunciado (role="status"). */
  toast(message) {
    clearTimeout(this.#toastTimer);
    this.#toast.textContent = message;
    this.#toast.dataset.visible = '';
    this.#toastTimer = setTimeout(() => this.#toast.removeAttribute('data-visible'), TOAST_DURATION);
  }

  showWin(moves) {
    this.#winMoves.textContent = pluralize(moves, 'movimiento', 'movimientos');
    this.#win.hidden = false;
    this.#win.querySelector('[data-action="new-game"]').focus();
  }

  hideWin() {
    this.#win.hidden = true;
  }

  /** Abre la ayuda con el ejemplo dibujado en las formas activas. */
  openHelp(shapes) {
    this.#help.querySelectorAll('[data-help-example] .piece').forEach((piece) => {
      piece.dataset.shape = shapes[piece.dataset.type];
    });
    this.#help.showModal();
  }

  /** Resuelve true si el usuario confirma descartar la partida. */
  confirmDiscard() {
    const dialog = this.#confirm;
    return new Promise((resolve) => {
      dialog.returnValue = '';
      dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), { once: true });
      dialog.showModal();
    });
  }
}
