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

function undo(event: KeyboardEvent): boolean {
  const { key, ctrlKey, metaKey, shiftKey } = event;
  return (key === "z" || key === "Z") && (ctrlKey || metaKey) && !shiftKey;
}

function redo(event: KeyboardEvent): boolean {
  const { key, ctrlKey, metaKey, shiftKey } = event;
  return (key === "z" || key === "Z") && (ctrlKey || metaKey) && shiftKey;
}

function zoomIn(event: KeyboardEvent): boolean {
  const { key, ctrlKey, metaKey } = event;
  return (key === "=" || key === "+") && !ctrlKey && !metaKey;
}

function zoomOut(event: KeyboardEvent): boolean {
  const { key, ctrlKey, metaKey } = event;
  return (key === "-" || key === "_") && !ctrlKey && !metaKey;
}

type Shortcut = (event: KeyboardEvent) => boolean;

const shortcuts: Record<string, Shortcut> = {
  // Tools
  move: (event) => singleKey(event, " "),
  moveTool: (event) => singleKey(event, "w"),
  drawingTool: (event) => singleKey(event, "d"),
  fogTool: (event) => singleKey(event, "f"),
  measureTool: (event) => singleKey(event, "m"),
  pointerTool: (event) => singleKey(event, "q"),
  noteTool: (event) => singleKey(event, "n"),
  // Map editor
  gridNudgeUp: ({ key }) => key === "ArrowUp",
  gridNudgeLeft: ({ key }) => key === "ArrowLeft",
  gridNudgeRight: ({ key }) => key === "ArrowRight",
  gridNudgeDown: ({ key }) => key === "ArrowDown",
  // Drawing tool
  drawBrush: (event) => singleKey(event, "b"),
  drawPaint: (event) => singleKey(event, "p"),
  drawLine: (event) => singleKey(event, "l"),
  drawRect: (event) => singleKey(event, "r"),
  drawCircle: (event) => singleKey(event, "c"),
  drawTriangle: (event) => singleKey(event, "t"),
  drawErase: (event) => singleKey(event, "e"),
  drawBlend: (event) => singleKey(event, "o"),
  // Fog tool
  fogPolygon: (event) => singleKey(event, "p"),
  fogRectangle: (event) => singleKey(event, "r"),
  fogBrush: (event) => singleKey(event, "b"),
  fogToggle: (event) => singleKey(event, "t"),
  fogErase: (event) => singleKey(event, "e"),
  fogLayer: (event) => singleKey(event, "l"),
  fogPreview: (event) => singleKey(event, "f"),
  fogCut: (event) => singleKey(event, "c"),
  fogFinishPolygon: ({ key }) => key === "Enter",
  fogCancelPolygon: ({ key }) => key === "Escape",
  // Select tool
  selectTool: (event) => singleKey(event, "l"),
  selectPath: (event) => singleKey(event, "l"),
  selectRect: (event) => singleKey(event, "r"),
  // Stage interaction
  stageZoomIn: zoomIn,
  stageZoomOut: zoomOut,
  stagePrecisionZoom: ({ key }) => key === "Shift",
  // Select
  selectRange: ({ key }) => key === "Shift",
  selectMultiple: ({ key }) => key === "Control" || key === "Meta",
  // Common
  undo,
  redo,
  delete: ({ key }) => key === "Backspace" || key === "Delete",
};

export default shortcuts;
