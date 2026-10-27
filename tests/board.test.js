// Ejecutar con: node --test tests/*.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Board } from '../js/model/Board.js';

const SIZES = [3, 4, 5, 6, 7, 8];

const typeCounts = (board) => {
  const counts = Array(Board.TYPES).fill(0);
  for (let i = 0; i < board.cellCount; i++) counts[board.typeAt(i)]++;
  return counts;
};

test('un tablero nuevo nunca empieza resuelto ni con progreso', () => {
  for (const n of SIZES) {
    for (let k = 0; k < 50; k++) {
      const board = new Board(n);
      assert.equal(board.isSolved(), false);
      assert.equal(board.hasProgress(), false);
    }
  }
});

test('cada tipo aparece un múltiplo de N veces (siempre tiene solución)', () => {
  for (const n of SIZES) {
    const counts = typeCounts(new Board(n));
    counts.forEach((count) => assert.equal(count % n, 0));
    counts.forEach((count) => assert.ok(count >= n));
  }
});

test('seguir las pistas siempre resuelve el tablero', () => {
  for (const n of SIZES) {
    for (let k = 0; k < 50; k++) {
      const board = new Board(n);
      while (!board.isSolved()) {
        assert.ok(board.moves < n * n, 'demasiados movimientos');
        assert.equal(board.swap(...board.hint()), true);
      }
      assert.equal(board.hint(), null);
      assert.equal(board.completedRows(), n);
    }
  }
});

test('no se pueden intercambiar fichas del mismo tipo ni índices inválidos', () => {
  const board = new Board(4);
  const same = [...Array(board.cellCount).keys()].find((i) => i > 0 && board.typeAt(i) === board.typeAt(0));
  assert.equal(board.canSwap(0, same), false);
  assert.equal(board.swap(0, same), false);
  assert.equal(board.canSwap(0, board.cellCount), false);
  assert.equal(board.canSwap(-1, 0), false);
  assert.equal(board.moves, 0);
});

test('hasProgress tras un movimiento válido', () => {
  const board = new Board(5);
  const [a, b] = board.hint();
  board.swap(a, b);
  assert.equal(board.moves, 1);
  assert.equal(board.hasProgress(), !board.isSolved());
});

test('neighbour se mueve en la retícula sin salirse', () => {
  const board = new Board(4);
  assert.equal(board.neighbour(0, -1, 0), 0);
  assert.equal(board.neighbour(0, 0, -1), 0);
  assert.equal(board.neighbour(0, 1, 0), 4);
  assert.equal(board.neighbour(0, 0, 1), 1);
  assert.equal(board.neighbour(3, 0, 1), 3);
  assert.equal(board.neighbour(15, 1, 0), 15);
});
