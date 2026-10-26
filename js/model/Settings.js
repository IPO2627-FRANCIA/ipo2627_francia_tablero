import { TILE_SIZES, SHAPE_SETS, PALETTES } from '../config/themes.js';

const STORAGE_KEY = 'tablero.settings';

/**
 * Configuración de la partida. Inmutable: cada cambio crea una instancia
 * nueva ya validada, así el resto del código nunca ve valores inválidos.
 */
export class Settings {
  static MIN_DIMENSION = 3;
  static MAX_DIMENSION = 8;
  static DEFAULTS = Object.freeze({
    dimension: 4,
    tileSize: 'medium',
    shapeSet: 'basic',
    palette: 'warm',
  });

  constructor(values = {}) {
    const { dimension, tileSize, shapeSet, palette } = { ...Settings.DEFAULTS, ...values };
    this.dimension = Settings.clampDimension(dimension);
    this.tileSize = TILE_SIZES.includes(tileSize) ? tileSize : Settings.DEFAULTS.tileSize;
    this.shapeSet = Object.hasOwn(SHAPE_SETS, shapeSet) ? shapeSet : Settings.DEFAULTS.shapeSet;
    this.palette = Object.hasOwn(PALETTES, palette) ? palette : Settings.DEFAULTS.palette;
    Object.freeze(this);
  }

  static clampDimension(value) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return Settings.DEFAULTS.dimension;
    return Math.min(Settings.MAX_DIMENSION, Math.max(Settings.MIN_DIMENSION, n));
  }

  with(changes) {
    return new Settings({ ...this, ...changes });
  }

  equals(other) {
    return Object.keys(Settings.DEFAULTS).every((key) => this[key] === other[key]);
  }

  static load() {
    try {
      return new Settings(JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {});
    } catch {
      return new Settings();
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this));
    } catch {
      // Sin almacenamiento disponible (modo privado): las preferencias no persisten.
    }
  }
}
