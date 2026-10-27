import { SHAPE_SETS } from '../config/appearance.js';

/** Diálogos modales: ayuda sobre la mecánica y confirmación de descarte. */
export class DialogView {
  #help;
  #confirm;

  constructor(root) {
    this.#help = root.querySelector('[data-dialog="help"]');
    this.#confirm = root.querySelector('[data-dialog="confirm"]');

    // Clic en el fondo oscurecido cierra la ayuda
    this.#help.addEventListener('click', (event) => {
      if (event.target === this.#help) this.#help.close();
    });
  }

  /** Abre la ayuda con el ejemplo dibujado en las formas activas. */
  openHelp(settings) {
    const { shapes } = SHAPE_SETS[settings.shapeSet];
    this.#help.querySelectorAll('[data-help-example] [data-type]').forEach((piece) => {
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
