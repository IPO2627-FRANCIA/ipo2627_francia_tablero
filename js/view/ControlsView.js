import { SHAPE_SETS, PALETTES } from "../config/themes.js";

/**
 * Formulario de ajustes: genera las opciones de aspecto, lee los valores
 * elegidos y refleja la configuración vigente.
 */
export class ControlsView {
  #form;
  #dimension;
  #preview;
  #stepButtons;

  constructor(form) {
    this.#form = form;
    this.#dimension = form.elements.dimension;
    this.#preview = form.querySelector("[data-dimension-preview]");
    this.#stepButtons = [...form.querySelectorAll("[data-step]")];

    this.#renderOptions(
      "shapeSet",
      Object.entries(SHAPE_SETS).map(([value, { label, shapes }]) => ({
        value,
        label,
        shapes,
      })),
    );
    this.#renderOptions(
      "palette",
      Object.entries(PALETTES).map(([value, { label }]) => ({
        value,
        label,
        shapes: ["circle", "circle", "circle"],
        palette: value,
      })),
    );

    form.addEventListener("submit", (event) => event.preventDefault());
    form.addEventListener("input", () =>
      this.#updateDimensionPreview(this.#dimension.value),
    );
    form.addEventListener("click", (event) => {
      const button = event.target.closest("[data-step]");
      if (button) this.#step(Number(button.dataset.step));
    });
  }

  #renderOptions(name, options) {
    const container = this.#form.querySelector(`[data-options="${name}"]`);
    const template = document.querySelector('[data-template="theme-option"]');

    container.replaceChildren(
      ...options.map(({ value, label, shapes, palette }) => {
        const option = template.content.firstElementChild.cloneNode(true);
        const input = option.querySelector("input");
        input.name = name;
        input.value = value;
        option.querySelector("[data-label]").textContent = label;

        const preview = option.querySelector("[data-preview]");
        if (palette) preview.dataset.palette = palette;
        preview.append(
          ...shapes.map((shape, type) => {
            const piece = document.createElement("span");
            piece.className = "piece";
            piece.dataset.shape = shape;
            piece.dataset.type = type;
            return piece;
          }),
        );
        return option;
      }),
    );
  }

  #step(delta) {
    const min = Number(this.#dimension.min);
    const max = Number(this.#dimension.max);
    const next = Math.min(
      max,
      Math.max(min, Number(this.#dimension.value) + delta),
    );
    if (next === Number(this.#dimension.value)) return;

    this.#dimension.value = next;
    this.#dimension.dispatchEvent(new Event("change", { bubbles: true }));
  }

  #updateDimensionPreview(value) {
    const n = Number(value);
    this.#preview.textContent =
      Number.isFinite(n) && n > 0 ? `${n} × ${n}` : "";
    this.#stepButtons.forEach((button) => {
      const delta = Number(button.dataset.step);
      button.disabled =
        delta < 0
          ? n <= Number(this.#dimension.min)
          : n >= Number(this.#dimension.max);
    });
  }

  read() {
    const data = new FormData(this.#form);
    return {
      dimension: Number(data.get("dimension")),
      tileSize: data.get("tileSize"),
      shapeSet: data.get("shapeSet"),
      palette: data.get("palette"),
      //
    };
  }

  write(settings) {
    const { elements } = this.#form;
    elements.dimension.value = settings.dimension;
    elements.tileSize.value = settings.tileSize;
    elements.shapeSet.value = settings.shapeSet;
    elements.palette.value = settings.palette;
    //
    this.#updateDimensionPreview(settings.dimension);
  }

  onChange(handler) {
    this.#form.addEventListener("change", () => handler(this.read()));
  }
}
