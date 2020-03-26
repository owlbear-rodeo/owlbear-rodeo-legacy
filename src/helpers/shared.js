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

/**
 * This asks for audio permission on safari based devices
 * this is needed to fix a implementation detail in safari
 * where webRTC data channels cannot be opened without first
 * using getUserMedia see:
 * https://github.com/webrtc/samples/issues/1123
 * https://bugs.webkit.org/show_bug.cgi?id=189503
 * https://github.com/w3c/webrtc-nv-use-cases/issues/58
 */
export async function enableDataConnectionForSafari() {
  if (
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    (navigator.userAgent.match(/Safari/i) &&
      !navigator.userAgent.match(/Chrome/i))
  ) {
    let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
  }
}
