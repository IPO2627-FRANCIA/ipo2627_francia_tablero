/**
 * Tema global de la página. La paleta se fija en la raíz para que la usen
 * el tablero, la ayuda y cualquier otra vista (css/tokens/color.css).
 */
export class ThemeView {
  #root;

  constructor(root) {
    this.#root = root;
  }

  apply(settings) {
    this.#root.dataset.palette = settings.palette;
  }
}
