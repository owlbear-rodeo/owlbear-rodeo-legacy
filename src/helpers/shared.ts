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
export function isStreamStopped(stream: MediaStream): boolean {
  // TODO: Check what this thing actually does
  return stream.getTracks().reduce((a, b) => a && b, { muted: true }).muted;
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

export function keyBy<Type extends Record<PropertyKey, any>>(
  array: Type[],
  key: string
): Record<string, Type> {
  return array.reduce(
    (prev, current) => ({
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

/**
 * Check that read and write permission is granted for clipboard.
 * If permission has yet to be granted or denied request it.
 * This will also return false if the browser does not support reading
 * and writing to the clipboard e.g. for Safari or Firefox
 */
export async function clipboardSupported(): Promise<boolean> {
  // @ts-ignore
  if (navigator.clipboard?.readText && navigator.clipboard?.writeText) {
    if (navigator.permissions) {
      let query = await navigator.permissions.query({ name: "clipboard-read" });
      if (query.state === "prompt") {
        try {
          await navigator.clipboard.readText();
          query = await navigator.permissions.query({ name: "clipboard-read" });
          // Wait 300ms before returning when permission has been accepted to prevent immediate calls
          // to the clipboard api to fail with a document not focused error
          await timeout(300);
        } catch {
          return false;
        }
      }
      return query.state === "granted";
    }
  }
  return false;
}

export function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}