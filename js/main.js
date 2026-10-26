import { Settings } from './model/Settings.js';
import { BoardView } from './view/BoardView.js';
import { ControlsView } from './view/ControlsView.js';
import { AssistView } from './view/AssistView.js';
import { GameController } from './controller/GameController.js';

// Los módulos se ejecutan diferidos: el DOM ya está disponible aquí.
const controller = new GameController({
  settings: Settings.load(),
  boardView: new BoardView(document.querySelector('[data-board-wrapper]')),
  controlsView: new ControlsView(document.querySelector('[data-settings]')),
  assistView: new AssistView(document),
});

controller.start();
