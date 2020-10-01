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

export function isEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function keyBy(array, key) {
  return array.reduce(
    (prev, current) => ({ ...prev, [key ? current[key] : current]: current }),
    {}
  );
}

export function groupBy(array, key) {
  return array.reduce((prev, current) => {
    const k = current[key];
    (prev[k] || (prev[k] = [])).push(current);
    return prev;
  }, {});
}
