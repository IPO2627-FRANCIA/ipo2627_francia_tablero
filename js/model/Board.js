const randomInt = (max) => Math.floor(Math.random() * max);

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * Estado de una partida: N×N fichas de 3 tipos guardadas por filas en un
 * array plano (índice = fila * N + columna). No conoce el DOM.
 */
export class Board {
  static TYPES = 3;

  #size;
  #tiles;
  #moves = 0;

  constructor(size) {
    this.#size = size;
    this.#tiles = Board.#createTiles(size);
  }

  /**
   * Reparte las N filas entre los 3 tipos (al menos una fila por tipo).
   * Así cada tipo aparece un múltiplo de N veces y el tablero siempre
   * tiene solución. Después se baraja hasta que no esté ya resuelto.
   */
  static #createTiles(size) {
    const rowsPerType = Array(Board.TYPES).fill(1);
    for (let row = Board.TYPES; row < size; row++) rowsPerType[randomInt(Board.TYPES)]++;

    const tiles = rowsPerType.flatMap((rows, type) => Array(rows * size).fill(type));
    do {
      shuffle(tiles);
    } while (Board.#isSolved(tiles, size));
    return tiles;
  }

  static #isSolved(tiles, size) {
    return tiles.every((type, i) => type === tiles[i - (i % size)]);
  }

  get size() {
    return this.#size;
  }

  get moves() {
    return this.#moves;
  }

  get cellCount() {
    return this.#tiles.length;
  }

  typeAt(index) {
    return this.#tiles[index];
  }

  rowOf(index) {
    return Math.floor(index / this.#size);
  }

  colOf(index) {
    return index % this.#size;
  }

  /** Casilla vecina en la dirección dada, sin salir del tablero. */
  neighbour(index, dRow, dCol) {
    const clamp = (value) => Math.min(this.#size - 1, Math.max(0, value));
    return clamp(this.rowOf(index) + dRow) * this.#size + clamp(this.colOf(index) + dCol);
  }

  #row(row) {
    return this.#tiles.slice(row * this.#size, (row + 1) * this.#size);
  }

  #typeCounts(tiles) {
    const counts = Array(Board.TYPES).fill(0);
    tiles.forEach((type) => counts[type]++);
    return counts;
  }

  isRowComplete(row) {
    const tiles = this.#row(row);
    return tiles.every((type) => type === tiles[0]);
  }

  /** Número de fichas del tipo más repetido en la fila. */
  rowProgress(row) {
    return Math.max(...this.#typeCounts(this.#row(row)));
  }

  completedRows() {
    let completed = 0;
    for (let row = 0; row < this.#size; row++) if (this.isRowComplete(row)) completed++;
    return completed;
  }

  isSolved() {
    return Board.#isSolved(this.#tiles, this.#size);
  }

  /** Hay progreso que se perdería al abandonar la partida. */
  hasProgress() {
    return this.#moves > 0 && !this.isSolved();
  }

  #isValidIndex(index) {
    return Number.isInteger(index) && index >= 0 && index < this.#tiles.length;
  }

  /** Solo tiene sentido intercambiar fichas distintas. */
  canSwap(a, b) {
    return this.#isValidIndex(a) && this.#isValidIndex(b) && this.#tiles[a] !== this.#tiles[b];
  }

  swap(a, b) {
    if (!this.canSwap(a, b)) return false;
    [this.#tiles[a], this.#tiles[b]] = [this.#tiles[b], this.#tiles[a]];
    this.#moves++;
    return true;
  }

  /**
   * Propone un intercambio útil: [a, b] o null si ya está resuelto.
   * Prefiere intercambios que colocan bien las dos fichas a la vez.
   */
  hint() {
    if (this.isSolved()) return null;

    const targets = this.#targetTypes();
    const isMisplaced = (i) => this.#tiles[i] !== targets[this.rowOf(i)];
    const misplaced = this.#tiles.map((_, i) => i).filter(isMisplaced);

    for (const a of misplaced) {
      const wanted = targets[this.rowOf(a)];
      const b = misplaced.find(
        (i) => this.#tiles[i] === wanted && targets[this.rowOf(i)] === this.#tiles[a],
      );
      if (b !== undefined) return [a, b];
    }

    // Siempre existe: si una casilla espera el tipo T y no lo tiene,
    // alguna ficha de tipo T está en una fila que no la espera.
    const [a] = misplaced;
    const wanted = targets[this.rowOf(a)];
    return [a, misplaced.find((i) => this.#tiles[i] === wanted)];
  }

  /**
   * Asigna a cada fila el tipo que debería acabar teniendo, respetando
   * cuántas filas corresponden a cada tipo y maximizando las fichas que ya
   * están bien colocadas (programación dinámica, N ≤ 8).
   */
  #targetTypes() {
    const size = this.#size;
    const quota = this.#typeCounts(this.#tiles).map((count) => count / size);
    const matches = Array.from({ length: size }, (_, row) => this.#typeCounts(this.#row(row)));
    const memo = new Map();

    const best = (row, left) => {
      if (row === size) return { score: 0, plan: [] };
      const key = `${row}:${left}`;
      if (memo.has(key)) return memo.get(key);

      let result = { score: -1, plan: [] };
      left.forEach((rowsLeft, type) => {
        if (rowsLeft === 0) return;
        const rest = best(row + 1, left.with(type, rowsLeft - 1));
        const score = matches[row][type] + rest.score;
        if (score > result.score) result = { score, plan: [type, ...rest.plan] };
      });

      memo.set(key, result);
      return result;
    };

    return best(0, quota).plan;
  }
}
