const TOAST_DURATION = 2800;

/**
 * Avisos al usuario: toast visible (fijado a la ventana) y anuncios solo
 * para lectores de pantalla.
 */
export class FeedbackView {
  #toast;
  #toastTimer;
  #announcer;

  constructor(root) {
    this.#toast = root.querySelector('[data-toast]');
    this.#announcer = root.querySelector('[data-announcer]');
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
}
