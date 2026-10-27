// Textos que ve u oye el usuario. Única fuente: cambiar la redacción o
// traducir la interfaz se hace solo aquí (más index.html y config/).

const plural = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;

export const messages = {
  dimension: (n) => `${n} × ${n}`,
  rows: (completed, total) => `${completed}/${total}`,
  moves: (count) => plural(count, 'movimiento', 'movimientos'),

  position: (row, col) => `Fila ${row}, columna ${col}`,
  piece: (shape, color) => `${shape} ${color}`,
  cell: (position, piece) => `${position}: ${piece}`,

  newBoard: (n) => `Nuevo tablero ${messages.dimension(n)}`,
  rangeWarning: (min, max) => `La dimensión va de ${min} a ${max}`,
  sameType: 'Esas fichas son iguales: elige una distinta',

  selected: (piece) => `${piece} seleccionado. Elige otra ficha para intercambiarlas.`,
  selectionCancelled: 'Selección cancelada.',
  swapDone: (completed, total) => `Intercambio hecho. Filas completas: ${completed} de ${total}.`,
  hint: (a, b) => `Pista: intercambia ${a} con ${b}.`,
};
