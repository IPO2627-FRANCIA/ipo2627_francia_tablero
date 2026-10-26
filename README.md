# Tablero

Juego de fichas sobre un tablero N×N (3 ≤ N ≤ 8). El objetivo es intercambiar fichas hasta que cada fila contenga fichas de un solo tipo. Está hecho con HTML, CSS y JavaScript nativos, sin bibliotecas.

## Ejecutar

Los scripts son módulos ES, así que hay que servir la carpeta por HTTP (abrir el archivo con `file://` no funciona):

```sh
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Funcionalidad

| Acción | Dónde |
| --- | --- |
| Nueva partida | Botón «Nuevo tablero» (cabecera) y «Jugar otra vez» al ganar |
| Cambiar N | Ajustes › Dimensión (botones − / + o escribiendo; limitado a 3–8) |
| Tamaño de ficha | Ajustes › Tamaño: pequeña, mediana, grande |
| Aspecto | Ajustes › Forma (Básicas / Gemas) y Color (Cálida / Fresca / Contraste) |
| Información | Botón «Cómo se juega» (diálogo modal) |

Cualquier cambio de ajustes crea un tablero nuevo. Si la partida ya tiene movimientos, se pide confirmación antes de descartarla. Los ajustes se guardan en `localStorage`.

### Mecánica

- **Comienzo:** las N filas se reparten entre los 3 tipos, con al menos una fila por tipo. Así cada tipo aparece un múltiplo de N veces y el tablero siempre se puede completar. Luego se baraja (Fisher–Yates) hasta que no salga ya resuelto.
- **Movimiento:** se intercambian dos celdas cualesquiera. Intercambiar dos fichas iguales se rechaza con un aviso, porque no cambia nada.
- **Fin:** cuando todas las filas son uniformes, aparece la pantalla final y el tablero se bloquea.

### Interacción y usabilidad

- **Drag & Drop** con `dataTransfer` (`setData('text/plain', índice)`). La ficha arrastrada se atenúa y la celda destino se marca.
- **Alternativa por clic o teclado** (la API de Drag & Drop no funciona en pantallas táctiles ni con teclado): se selecciona una ficha y luego otra. Las flechas mueven el foco (*roving tabindex*), Intro o Espacio seleccionan y Esc cancela.
- **Retroalimentación:** animación del intercambio; marcador por fila (`3/5` o `✓`); celdas de filas completas teñidas; contadores de movimientos y filas en la cabecera; avisos (*toast*); anuncios `aria-live` para lectores de pantalla.
- **Pista:** resalta un intercambio que acerca a la solución. Prefiere uno que coloque bien las dos fichas a la vez.
- **Prevención de errores:** confirmación antes de perder progreso, dimensión limitada y botones −/+ desactivados en los extremos.
- **Accesibilidad:** HTML semántico, `role="grid"` con etiquetas por celda, foco visible, respeto de `prefers-reduced-motion`, objetivos táctiles de al menos 44 px, y tipos distinguibles por forma además de por color.

## Arquitectura (MVC)

```
index.html
css/                 una hoja por componente (ver más abajo)
js/
├── main.js                      punto de entrada: crea el modelo, las vistas y el controlador
├── config/themes.js             catálogo de tamaños, formas y paletas
├── model/
│   ├── Board.js                 estado del tablero, generación, intercambio, victoria, pista
│   └── Settings.js              configuración validada e inmutable y su persistencia
├── view/
│   ├── BoardView.js             pinta el tablero y sus estados visuales
│   ├── ControlsView.js          formulario de ajustes
│   └── AssistView.js            marcadores, avisos, pantalla final y diálogos
└── controller/GameController.js eventos del usuario ↔ modelo ↔ vistas
```

- El **modelo** no toca el DOM. Usa campos privados (`#`) para que solo se pueda modificar a través de sus métodos.
- Las **vistas** no deciden reglas del juego, solo muestran lo que les indica el controlador.
- El **controlador** delega eventos en contenedores (un solo listener para todo el tablero y otro para todas las `[data-action]`).
- **Selección por `data-*`:** JS localiza los elementos solo mediante atributos `data-*` (`[data-board]`, `[data-cell]`, `[data-action="hint"]`, `[data-stat="moves"]`…) y refleja estados con ellos (`data-dragging`, `data-drop-target`, `data-hint`, `data-row-complete`). Las clases se reservan para el estilo.
- **Vinculación moderna:** cada hoja con `<link>` en `<head>` y un único `<script type="module">`, que se ejecuta diferido. No hay JS ni estilos en línea.

## CSS

Cada archivo contiene todo lo de su sección: composición, color, tipografía, posicionamiento, estados (`:hover`, foco, arrastre) y *media queries*. Las clases siguen BEM (`bloque__elemento--modificador`) y los estados se expresan con atributos (`[aria-selected="true"]`, `[data-dragging]`), lo que mantiene la especificidad baja y uniforme.

| Archivo | Contenido |
| --- | --- |
| `tokens.css` | Solo variables: estrategias cromática, tipográfica y espacial |
| `base.css` | Reinicio, valores por defecto y retícula de la página |
| `card.css` | Superficie elevada compartida |
| `buttons.css` | Botón píldora y sus tonos |
| `tooltip.css` | Ayudas emergentes |
| `header.css` | Cabecera fija y marcadores |
| `piece.css` | Formas y colores de las fichas (paletas) |
| `board.css` | Panel, retícula, celdas, marcadores de fila y pantalla final |
| `settings.css` | Formulario de ajustes y sus controles |
| `dialog.css` | Diálogos de ayuda y confirmación |
| `toast.css` | Aviso flotante |

### Composición

- **Grid (bidimensional):** retícula de la página (tablero + ajustes, que pasa a una columna en pantallas estrechas), el propio tablero N×N (`repeat(var(--n), var(--cell))`), la columna de marcadores de fila, las tarjetas de opciones y el ejemplo de la ayuda.
- **Flexbox (unidimensional):** cabecera, grupos de botones, selector de dimensión, control segmentado, columnas del panel y de los diálogos.
- El tamaño de celda se adapta con una *container query* (`100cqi`), de modo que el tablero nunca se desborda en móvil.

### Posicionamiento (asistencia al usuario)

| Elemento | `position` | Motivo |
| --- | --- | --- |
| Cabecera | `sticky` | Contadores y acciones siempre visibles al desplazarse (en móvil pasa a `static` para no tapar el tablero) |
| Marcadores de fila | `absolute` en `.board` (`relative`) | Columna alineada fila a fila con la retícula, sin alterar el grid |
| Anillo de pista | `absolute` (`::after` de la celda) | Resalta por fuera de la celda sin moverla |
| Pantalla final | `absolute; inset: 0` en el panel | Cubre el tablero sin sacarlo del flujo |
| Tooltips | `absolute` respecto al control | Ayuda contextual junto al control |
| Toast | `fixed` | Aviso ligado a la ventana, visible aunque haya desplazamiento |
| Radios ocultos | `absolute; inset: 0` | El control nativo cubre su tarjeta: se mantiene accesible y toda la tarjeta es clicable |

## Estrategias de diseño

### Cromática: triádica sobre neutros oscuros

- Tres tonos separados 120° en OKLCH (30°, 150° y 270° en la paleta *Cálida*), con la misma luminosidad y croma, para que ningún tipo destaque sobre otro.
- La paleta *Fresca* es la misma tríada rotada 60°. La de *Contraste* varía la luminosidad para que los tipos se distingan también en escala de grises.
- Superficies en una rampa monocromática azul-gris de croma muy bajo.
- Un único acento (el primer vértice de la tríada) para la acción principal, la selección y el foco. El verde de la tríada indica éxito (filas completas).

### Tipográfica: dos fuentes contrastadas

- **Fraunces** (serifa de display) para títulos y cifras.
- **Inter** (sans humanista) para el texto y la interfaz.
- Escala modular de tercera mayor (×1,25): caption, body, lead, title, display. Las etiquetas de grupo se realzan con versalitas espaciadas.

### Espacial

- Todas las medidas en `rem` (respetan el tamaño de letra del usuario), con una escala de espaciado de 4 px (`--space-1` a `--space-7`).
- Principios Gestalt:
  - **Región común:** tarjetas para el tablero y los ajustes.
  - **Proximidad:** poco espacio dentro de cada grupo de ajustes y más entre grupos.
  - **Semejanza:** mismo tipo = misma forma y color; todos los botones comparten forma.
  - **Continuidad:** marcadores alineados con su fila.
  - **Figura-fondo:** fichas claras sobre huecos oscuros.
