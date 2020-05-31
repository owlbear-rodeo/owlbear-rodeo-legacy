export function omit(obj, keys) {
  let tmp = {};
  for (let [key, value] of Object.entries(obj)) {
    if (keys.includes(key)) {
      continue;
    }
    tmp[key] = value;
  }
  return tmp;
}

export function fromEntries(iterable) {
  if (Object.fromEntries) {
    return Object.fromEntries(iterable);
  }
  return [...iterable].reduce((obj, [key, val]) => {
    obj[key] = val;
    return obj;
  }, {});
}

// Check to see if all tracks are muted
export function isStreamStopped(stream) {
  return stream.getTracks().reduce((a, b) => a && b, { mute: true });
}

export function roundTo(x, to) {
  return Math.round(x / to) * to;
}

export function toRadians(angle) {
  return angle * (Math.PI / 180);
}

export function toDegrees(angle) {
  return angle * (180 / Math.PI);
}

export function lerp(a, b, alpha) {
  return a * (1 - alpha) + b * alpha;
}

// Console log an image
export function logImage(url, width, height) {
  const style = [
    "font-size: 1px;",
    `padding: ${height}px ${width}px;`,
    `background: url(${url}) no-repeat;`,
    "background-size: contain;",
  ].join(" ");
  console.log("%c ", style);
}
