import Model from "../Model";

import config from "./model.json";
import weights from "./group1-shard1of1.bin";
import { LayersModel } from "@tensorflow/tfjs";
import { ModelJSON } from "@tensorflow/tfjs-core/dist/io/types";

class GridSizeModel extends Model {
  // Store model as static to prevent extra network requests
  static model: LayersModel;
  // Load tensorflow dynamically

  static tf;
  constructor() {
    super(config as ModelJSON, { "group1-shard1of1.bin": weights });
  }

  async predict(imageData: ImageData) {
    if (!GridSizeModel.tf) {
      GridSizeModel.tf = await import("@tensorflow/tfjs");
    }
    const tf = GridSizeModel.tf;

    if (!GridSizeModel.model) {
      GridSizeModel.model = await tf.loadLayersModel(this);
    }
    const model = GridSizeModel.model;

    const prediction = tf.tidy(() => {
      const image = tf.browser.fromPixels(imageData, 1).toFloat();
      const normalized = image.div(tf.scalar(255.0));
      const batched = tf.expandDims(normalized);
      return model.predict(batched);
    });
    const data = await prediction.data();
    return data[0];
  }
}

export default GridSizeModel;
