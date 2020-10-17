import * as tf from "@tensorflow/tfjs";

import Model from "../Model";

import config from "./model.json";
import weights from "./group1-shard1of1.bin";

class GridSizeModel extends Model {
  // Store model as static to prevent extra network requests
  static model;
  constructor() {
    super(config, { "group1-shard1of1.bin": weights });
  }

  async predict(imageData) {
    if (!GridSizeModel.model) {
      GridSizeModel.model = await tf.loadLayersModel(this);
    }
    const prediction = tf.tidy(() => {
      const image = tf.browser.fromPixels(imageData, 1).toFloat();
      const normalized = image.div(tf.scalar(255.0));
      const batched = tf.expandDims(normalized);
      return GridSizeModel.model.predict(batched);
    });
    const data = await prediction.data();
    return data[0];
  }
}

export default GridSizeModel;
