import { SettingsStore } from './services/SettingsStore.js';
import { ThemeView } from './view/ThemeView.js';
import { BoardView } from './view/BoardView.js';
import { ControlsView } from './view/ControlsView.js';
import { StatsView } from './view/StatsView.js';
import { ActionsView } from './view/ActionsView.js';
import { FeedbackView } from './view/FeedbackView.js';
import { WinView } from './view/WinView.js';
import { DialogView } from './view/DialogView.js';
import { GameController } from './controller/GameController.js';

// Los módulos se ejecutan diferidos: el DOM ya está disponible aquí.
const controller = new GameController({
  settings: SettingsStore.load(),
  store: SettingsStore,
  views: {
    theme: new ThemeView(document.documentElement),
    board: new BoardView(document.querySelector('[data-board-wrapper]')),
    controls: new ControlsView(document.querySelector('[data-settings]')),
    stats: new StatsView(document.querySelector('[data-stats]')),
    actions: new ActionsView(document),
    feedback: new FeedbackView(document),
    win: new WinView(document.querySelector('[data-win]')),
    dialogs: new DialogView(document),
  },
});

controller.start();
