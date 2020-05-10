async function blobToBuffer(blob) {
  if (blob.arrayBuffer) {
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } else {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      function onLoadEnd(event) {
        reader.removeEventListener("loadend", onLoadEnd, false);
        if (event.error) {
          reject(event.error);
        } else {
          resolve(Buffer.from(reader.result));
        }
      }

      reader.addEventListener("loadend", onLoadEnd, false);
      reader.readAsArrayBuffer(blob);
    });
  }
}

export default blobToBuffer;
