import { TILE_SIZES, SHAPE_SETS, PALETTES } from '../config/appearance.js';

const DIMENSION = Object.freeze({ min: 3, max: 8 });

/** Devuelve el valor si es una de las opciones, si no undefined. */
const oneOf = (options) => (value) => (Object.hasOwn(options, value) ? value : undefined);

function clampDimension(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return undefined;
  return Math.min(DIMENSION.max, Math.max(DIMENSION.min, n));
}

/**
 * Configuración de la partida. Inmutable: cada cambio crea una instancia
 * nueva ya validada, así el resto del código nunca ve valores inválidos.
 */
export class Settings {
  static DIMENSION = DIMENSION;

  /**
   * Única definición de los ajustes: valor por defecto y cómo normalizar lo
   * que llegue. Añadir un ajuste empieza por añadir una entrada aquí.
   */
  static SCHEMA = Object.freeze({
    dimension: { fallback: 4, normalize: clampDimension },
    tileSize: { fallback: 'medium', normalize: oneOf(TILE_SIZES) },
    shapeSet: { fallback: 'basic', normalize: oneOf(SHAPE_SETS) },
    palette: { fallback: 'warm', normalize: oneOf(PALETTES) },
  });

  constructor(values = {}) {
    for (const [key, { fallback, normalize }] of Object.entries(Settings.SCHEMA)) {
      this[key] = normalize(values[key] ?? fallback) ?? fallback;
    }
    Object.freeze(this);
  }

  /** true si la dimensión pedida es válida tal cual, sin recortarla. */
  static isInRange(dimension) {
    return clampDimension(dimension) === Number(dimension);
  }

  with(changes) {
    return new Settings({ ...this, ...changes });
  }

  equals(other) {
    return Object.keys(Settings.SCHEMA).every((key) => this[key] === other[key]);
  }
}
