import Node from "../nodes/node.js";

import HotwordWorker from "../workers/hotword.worker.js?worker"; // for bundle with vite -> to encapsulate tensorflow and wasm files
const handler = function (mfcc) {
  if (this.mfccBuffer.length < this.mfccBufferSize) {
    this.mfccBuffer.push(mfcc.detail);
  } else {
    this.mfccBuffer.shift();
    this.mfccBuffer.push(mfcc.detail);
    if (this.vadNode && !this.vadNode.speaking) return;
    this.workerRuntime.postMessage({
      method: "process",
      features: this.mfccBuffer,
    });
  }
};

export default class HotWord extends Node {
  // List of available pre-trained models (shipped with the package)
  static availableModels = ["linto", "slinfox"];

  constructor() {
    super();
    // this.workerUrl = new URL(
    //   "../workers/hotword.worker.js?worker&url",
    //   import.meta.url,
    // );
    this.mfccBuffer = []; // buffer to infer when filled with 30 mfcc. See handler
    this.handler = handler.bind(this);
    this.type = "hotword";
    this.event = "hotword"; //emitted
    this.hookableOnNodeTypes = ["featuresExtractor"];
  }

  startWorker() {
    this.workerRuntime = new HotwordWorker();
    this.workerRuntime.onerror = (e) => {
      console.error("Worker error:", e);
    };
    this.workerRuntime.onmessage = (event) => {
      // Handle different message types from the worker
      if (event.data.type === "hotword") {
        this.dispatchEvent(
          new CustomEvent(this.event, {
            detail: event.data.word,
          }),
        );
      } else if (event.data.type === "modelLoaded") {
        this.dispatchEvent(new CustomEvent("modelLoaded"));
      }
    };
  }

  //Optional VAD node to infer only if vad.speaking==true
  async start(node, vadNode, threshold = 0.8) {
    await super.start(node);
    if (vadNode) this.vadNode = vadNode;
    // Configure TensorFlow WASM backend
    this.workerRuntime.postMessage({
      method: "configure",
      threshold,
    });
  }

  pause() {
    super.pause();
    this.mfccBuffer = []; // Clears already processed buffer
  }

  stop() {
    if (this.hookedOn) {
      super.stop();
    }
  }

  /**
   * Load a hotword detection model
   * @param {string} modelUrl - URL to the model.json file
   *   For bundled models, use: new URL('@linto-ai/webvoicesdk/hotwords/linto/model.json', import.meta.url)
   *   Or serve the hotwords folder and pass the URL directly
   */
  async loadModel(modelUrl) {
    // Fetches the model manifest to get configuration
    const manifestRequest = await fetch(modelUrl, {
      method: "GET",
    });
    const manifest = await manifestRequest.json();
    console.log("hotword.js: manifest loaded");
    // Sets number of MFCC frames
    this.mfccBufferSize =
      manifest.modelTopology.model_config.config.layers[0].config.batch_input_shape[1];

    return new Promise((resolve) => {
      const onModelLoaded = () => {
        console.log("hotword.js: model loaded");
        this.removeEventListener("modelLoaded", onModelLoaded);
        resolve();
      };
      this.addEventListener("modelLoaded", onModelLoaded);
      console.log("hotword.js: loading model");
      this.workerRuntime.postMessage({
        method: "loadModel",
        modelUrl: modelUrl.toString(),
        words: manifest.words,
      });
    });
  }
}
