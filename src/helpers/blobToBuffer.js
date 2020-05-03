async function blobToBuffer(blob) {
  if (blob.arrayBuffer) {
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } else {
    const arrayBuffer = new Response(blob).arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }
}

export default blobToBuffer;
