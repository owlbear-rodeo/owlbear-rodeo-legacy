async function blobToBuffer(blob) {
  if (blob.arrayBuffer) {
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer;
  } else {
    const arrayBuffer = await new Response(blob).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer;
  }
}

export default blobToBuffer;
