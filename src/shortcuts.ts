/**
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */
function hasModifier(event: KeyboardEvent): boolean {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}

/**
 * Key press without any modifiers and ignoring capitals
 * @param {KeyboardEvent} event
 * @param {string} key
 * @returns {boolean}
 */
function singleKey(event: KeyboardEvent, key: string): boolean {
  return (
    !hasModifier(event) &&
    (event.key === key || event.key === key.toUpperCase())
  );
}

/**
 * @param {Keyboard} event
 * @returns {string | boolean}
 */
function undo(event: KeyboardEvent): string | boolean {
  const { key, ctrlKey, metaKey, shiftKey } = event;
  return (key === "z" || key === "Z") && (ctrlKey || metaKey) && !shiftKey;
}

/**
 * @param {Keyboard} event
 * @returns {string | boolean}
 */
function redo(event: KeyboardEvent): string | boolean {
  const { key, ctrlKey, metaKey, shiftKey } = event;
  return (key === "z" || key === "Z") && (ctrlKey || metaKey) && shiftKey;
}

/**
 * @param {Keyboard} event
 * @returns {string | boolean}
 */
function zoomIn(event: KeyboardEvent): string | boolean {
  const { key, ctrlKey, metaKey } = event;
  return (key === "=" || key === "+") && !ctrlKey && !metaKey;
}

/**
 * @param {Keyboard} event
 * @returns {string | boolean}
 */
function zoomOut(event: KeyboardEvent): string | boolean {
  const { key, ctrlKey, metaKey } = event;
  return (key === "-" || key === "_") && !ctrlKey && !metaKey;
}

/**
 * @callback shortcut
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */

/**
 * @type {Object.<string, shortcut>}
 */
const shortcuts = {
  // Tools
  move: (event: KeyboardEvent) => singleKey(event, " "),
  moveTool: (event: KeyboardEvent) => singleKey(event, "w"),
  drawingTool: (event: KeyboardEvent) => singleKey(event, "d"),
  fogTool: (event: KeyboardEvent) => singleKey(event, "f"),
  measureTool: (event: KeyboardEvent) => singleKey(event, "m"),
  pointerTool: (event: KeyboardEvent) => singleKey(event, "q"),
  noteTool: (event: KeyboardEvent) => singleKey(event, "n"),
  // Map editor
  gridNudgeUp: ({ key }: { key: string}) => key === "ArrowUp",
  gridNudgeLeft: ({ key }: { key: string }) => key === "ArrowLeft",
  gridNudgeRight: ({ key }: { key: string }) => key === "ArrowRight",
  gridNudgeDown: ({ key }: { key: string }) => key === "ArrowDown",
  // Drawing tool
  drawBrush: (event: KeyboardEvent) => singleKey(event, "b"),
  drawPaint: (event: KeyboardEvent) => singleKey(event, "p"),
  drawLine: (event: KeyboardEvent) => singleKey(event, "l"),
  drawRect: (event: KeyboardEvent) => singleKey(event, "r"),
  drawCircle: (event: KeyboardEvent) => singleKey(event, "c"),
  drawTriangle: (event: KeyboardEvent) => singleKey(event, "t"),
  drawErase: (event: KeyboardEvent) => singleKey(event, "e"),
  drawBlend: (event: KeyboardEvent) => singleKey(event, "o"),
  // Fog tool
  fogPolygon: (event: KeyboardEvent) => singleKey(event, "p"),
  fogRectangle: (event: KeyboardEvent) => singleKey(event, "r"),
  fogBrush: (event: KeyboardEvent) => singleKey(event, "b"),
  fogToggle: (event: KeyboardEvent) => singleKey(event, "t"),
  fogErase: (event: KeyboardEvent) => singleKey(event, "e"),
  fogLayer: (event: KeyboardEvent) => singleKey(event, "l"),
  fogPreview: (event: KeyboardEvent) => singleKey(event, "f"),
  fogCut: (event: KeyboardEvent) => singleKey(event, "c"),
  fogFinishPolygon: ({ key }: { key: string }) => key === "Enter",
  fogCancelPolygon: ({ key }: { key: string }) => key === "Escape",
  // Stage interaction
  stageZoomIn: zoomIn,
  stageZoomOut: zoomOut,
  stagePrecisionZoom: ({ key }: { key: string }) => key === "Shift",
  // Select
  selectRange: ({ key }: { key: string }) => key === "Shift",
  selectMultiple: ({ key }: { key: string }) => key === "Control" || key === "Meta",
  // Common
  undo,
  redo,
  delete: ({ key }: { key: string }) => key === "Backspace" || key === "Delete",
};

export default shortcuts;
