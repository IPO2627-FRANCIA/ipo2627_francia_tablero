import { Settings } from '../model/Settings.js';

const STORAGE_KEY = 'tablero.settings';

/** Persistencia de los ajustes entre visitas (localStorage). */
export const SettingsStore = {
  load() {
    try {
      return new Settings(JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {});
    } catch {
      return new Settings();
    }
  },

  save(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Sin almacenamiento disponible (modo privado): las preferencias no persisten.
    }
  },
};
