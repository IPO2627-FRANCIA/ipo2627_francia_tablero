// Ejecutar con: node --test tests/*.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Settings } from '../js/model/Settings.js';

test('valores por defecto desde el esquema', () => {
  const settings = new Settings();
  for (const [key, { fallback }] of Object.entries(Settings.SCHEMA)) {
    assert.equal(settings[key], fallback);
  }
});

test('la dimensión se recorta al rango y se redondea', () => {
  const { min, max } = Settings.DIMENSION;
  assert.equal(new Settings({ dimension: 1 }).dimension, min);
  assert.equal(new Settings({ dimension: 99 }).dimension, max);
  assert.equal(new Settings({ dimension: '5' }).dimension, 5);
  assert.equal(new Settings({ dimension: 4.6 }).dimension, 5);
  assert.equal(new Settings({ dimension: 'abc' }).dimension, Settings.SCHEMA.dimension.fallback);
});

test('isInRange solo acepta dimensiones válidas tal cual', () => {
  assert.equal(Settings.isInRange(3), true);
  assert.equal(Settings.isInRange('8'), true);
  assert.equal(Settings.isInRange(2), false);
  assert.equal(Settings.isInRange(9), false);
  assert.equal(Settings.isInRange(4.5), false);
});

test('opciones desconocidas vuelven al valor por defecto', () => {
  const settings = new Settings({ tileSize: 'huge', shapeSet: 'x', palette: null });
  assert.equal(settings.tileSize, Settings.SCHEMA.tileSize.fallback);
  assert.equal(settings.shapeSet, Settings.SCHEMA.shapeSet.fallback);
  assert.equal(settings.palette, Settings.SCHEMA.palette.fallback);
});

test('with crea una instancia nueva inmutable y equals compara por valor', () => {
  const base = new Settings();
  const next = base.with({ palette: 'cool' });
  assert.notEqual(next, base);
  assert.equal(next.palette, 'cool');
  assert.equal(base.palette, 'warm');
  assert.ok(Object.isFrozen(next));
  assert.ok(base.equals(new Settings()));
  assert.ok(!base.equals(next));
});
