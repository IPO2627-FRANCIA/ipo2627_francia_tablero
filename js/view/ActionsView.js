/**
 * Botones de acción ([data-action]) de toda la página: cabecera, pantalla
 * final… Un solo listener delegado avisa al manejador de cada acción.
 */
export class ActionsView {
  #handlers = {};

  constructor(root) {
    root.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (button) this.#handlers[button.dataset.action]?.();
    });
  }

  onAction(name, handler) {
    this.#handlers[name] = handler;
  }
}
