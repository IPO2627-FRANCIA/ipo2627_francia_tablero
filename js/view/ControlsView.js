import { TILE_SIZES, SHAPE_SETS, PALETTES } from '../config/appearance.js';
import { Settings } from '../model/Settings.js';
import { messages } from './messages.js';

/** Opciones de cada grupo [data-options]: valor, etiqueta y vista previa. */
const OPTION_SOURCES = {
  tileSize: () => Object.entries(TILE_SIZES).map(([value, { label }]) => ({ value, label })),
  shapeSet: () => Object.entries(SHAPE_SETS).map(([value, { label, shapes }]) => ({ value, label, shapes })),
  palette: () =>
    Object.entries(PALETTES).map(([value, { label }]) => ({
      value,
      label,
      shapes: ['circle', 'circle', 'circle'],
      palette: value,
    })),
};

/**
 * Formulario de ajustes: genera las opciones desde la configuración, lee los
 * valores elegidos y refleja la configuración vigente. Los campos se
 * recorren a partir de Settings.SCHEMA.
 */
export class ControlsView {
  #form;
  #dimension;
  #preview;
  #stepButtons;

  constructor(form) {
    this.#form = form;
    this.#dimension = form.querySelector('[data-setting="dimension"]');
    this.#preview = form.querySelector('[data-dimension-preview]');
    this.#stepButtons = [...form.querySelectorAll('[data-step]')];

    this.#dimension.min = Settings.DIMENSION.min;
    this.#dimension.max = Settings.DIMENSION.max;

    form.querySelectorAll('[data-options]').forEach((container) => this.#renderOptions(container));

    form.addEventListener('submit', (event) => event.preventDefault());
    form.addEventListener('input', () => this.#updateDimensionPreview(this.#dimension.value));
    form.addEventListener('click', (event) => {
      const button = event.target.closest('[data-step]');
      if (button) this.#step(Number(button.dataset.step));
    });
  }

  #renderOptions(container) {
    const name = container.dataset.options;
    if (!Object.hasOwn(OPTION_SOURCES, name)) {
      throw new Error(`ControlsView: falta OPTION_SOURCES.${name} para [data-options="${name}"]`);
    }
    const template = document.querySelector(`[data-template="${container.dataset.optionTemplate}"]`);

    container.replaceChildren(...OPTION_SOURCES[name]().map(({ value, label, shapes = [], palette }) => {
      const option = template.content.firstElementChild.cloneNode(true);
      const input = option.querySelector('[data-option-input]');
      input.name = name;
      input.value = value;
      input.dataset.setting = name;
      option.querySelector('[data-label]').textContent = label;

      const preview = option.querySelector('[data-preview]');
      if (preview && palette) preview.dataset.palette = palette;
      preview?.append(...shapes.map((shape, type) => {
        const piece = document.createElement('span');
        piece.className = 'piece';
        piece.dataset.shape = shape;
        piece.dataset.type = type;
        return piece;
      }));
      return option;
    }));
  }

  #step(delta) {
    const { min, max } = Settings.DIMENSION;
    const next = Math.min(max, Math.max(min, Number(this.#dimension.value) + delta));
    if (next === Number(this.#dimension.value)) return;

    this.#dimension.value = next;
    this.#dimension.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #updateDimensionPreview(value) {
    const n = Number(value);
    this.#preview.textContent = Number.isFinite(n) && n > 0 ? messages.dimension(n) : '';
    this.#stepButtons.forEach((button) => {
      const delta = Number(button.dataset.step);
      button.disabled = delta < 0 ? n <= Settings.DIMENSION.min : n >= Settings.DIMENSION.max;
    });
  }

  #fields(key) {
    return this.#form.querySelectorAll(`[data-setting="${key}"]`);
  }

  /** Valores del formulario; los grupos sin valor no se incluyen. */
  read() {
    const data = new FormData(this.#form);
    return Object.fromEntries(Object.keys(Settings.SCHEMA).filter((key) => data.has(key)).map((key) => [key, data.get(key)]));
  }

  write(settings) {
    for (const key of Object.keys(Settings.SCHEMA)) {
      this.#fields(key).forEach((field) => {
        if (field.type === 'radio') field.checked = field.value === settings[key];
        else field.value = settings[key];
      });
    }
    this.#updateDimensionPreview(settings.dimension);
  }

  onChange(handler) {
    this.#form.addEventListener('change', () => handler(this.read()));
  }
}
