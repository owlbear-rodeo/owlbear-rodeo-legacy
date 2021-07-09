export function omit(obj: Record<PropertyKey, any>, keys: string[]) {
  let tmp: Record<PropertyKey, any> = {};
  for (let [key, value] of Object.entries(obj)) {
    if (keys.includes(key)) {
      continue;
    }
    tmp[key] = value;
  }
  return tmp;
}

export function fromEntries(iterable: Iterable<[string | number, any]>) {
  if (Object.fromEntries) {
    return Object.fromEntries(iterable);
  }
  return [...iterable].reduce(
    (obj: Record<string | number, any>, [key, val]) => {
      obj[key] = val;
      return obj;
    },
    {}
  );
}

// Check to see if all tracks are muted
export function isStreamStopped(stream: MediaStream) {
  return stream.getTracks().reduce((a: any, b: any) => a && b, { mute: true });
}

export function roundTo(x: number, to: number): number {
  return Math.round(x / to) * to;
}

export function floorTo(x: number, to: number): number {
  return Math.floor(x / to) * to;
}

export function toRadians(angle: number): number {
  return angle * (Math.PI / 180);
}

export function toDegrees(angle: number): number {
  return angle * (180 / Math.PI);
}

export function lerp(a: number, b: number, alpha: number): number {
  return a * (1 - alpha) + b * alpha;
}

// Console log an image
export function logImage(url: string, width: number, height: number): void {
  const style = [
    "font-size: 1px;",
    `padding: ${height}px ${width}px;`,
    `background: url(${url}) no-repeat;`,
    "background-size: contain;",
  ].join(" ");
  console.log("%c ", style);
}

export function isEmpty(obj: Object): boolean {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function keyBy<Type>(array: Type[], key: string): Record<string, Type> {
  return array.reduce(
    (prev: any, current: any) => ({
      ...prev,
      [key ? current[key] : current]: current,
    }),
    {}
  );
}

export function groupBy(array: Record<PropertyKey, any>[], key: string) {
  return array.reduce((prev: Record<string, any[]>, current) => {
    const k = current[key];
    (prev[k] || (prev[k] = [])).push(current);
    return prev;
  }, {});
}

export const isMacLike = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);

export function shuffle<Type>(array: Type[]) {
  let temp = [...array];
  var currentIndex = temp.length,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [temp[currentIndex], temp[randomIndex]] = [
      temp[randomIndex],
      temp[currentIndex],
    ];
  }

  return temp;
}
