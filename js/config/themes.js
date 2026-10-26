// Opciones de aspecto de las fichas. Las claves coinciden con los atributos
// data-shape / data-palette que interpreta css/piece.css.

export const TILE_SIZES = ['small', 'medium', 'large'];

export const SHAPE_SETS = {
  basic: { label: 'Básicas', shapes: ['circle', 'square', 'triangle'] },
  gems: { label: 'Gemas', shapes: ['diamond', 'hexagon', 'star'] },
};

export const PALETTES = {
  warm: { label: 'Cálida', colors: ['coral', 'verde', 'índigo'] },
  cool: { label: 'Fresca', colors: ['ámbar', 'turquesa', 'rosa'] },
  contrast: { label: 'Contraste', colors: ['amarillo', 'azul', 'magenta'] },
};

export const SHAPE_NAMES = {
  circle: 'círculo',
  square: 'cuadrado',
  triangle: 'triángulo',
  diamond: 'rombo',
  hexagon: 'hexágono',
  star: 'estrella',
};
