import { ModelJSON, WeightsManifestConfig } from "@tensorflow/tfjs-core/dist/io/types";
import blobToBuffer from "../helpers/blobToBuffer";

class Model {
  config: ModelJSON;
  weightsMapping: { [path: string]: string };
  constructor(config: ModelJSON, weightsMapping: { [path: string]: string }) {
    this.config = config;
    this.weightsMapping = weightsMapping;
  }

  async load() {
    // Load weights from the manifest then fetch them into an ArrayBuffer
    let buffers: ArrayBuffer[] = [];
    if (this.config === undefined) {
      return;
    }
    const manifest = this.config?.weightsManifest[0];
    for (let path of manifest.paths) {
      const url = this.weightsMapping[path];
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      buffers.push(buffer);
    }
    const merged = new Blob(buffers);
    const weightData = await blobToBuffer(merged);
    const weightSpecs = manifest.weights;

    const modelArtifacts = {
      modelTopology: this.config.modelTopology,
      format: this.config.format,
      generatedBy: this.config.generatedBy,
      convertedBy: this.config.convertedBy,
      weightData,
      weightSpecs,
    };
    return modelArtifacts;
  }
}

export default Model;
