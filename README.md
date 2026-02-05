# WebVoice SDK

WebVoice SDK is a JavaScript library that provides lightweights and fairly well optimized buildings block for always-listening voice-enabled applications right in the browser. This library is the main technology behind LinTO's Web Client as it deals with everything related to user's voice input.

## Functionalities

- Hardware Microphone Handler : hook to hardware, record, playback, get file from buffer as wav... very handy
- Downsampler : re-inject acquired audio at any given samplerate / frame size
- Speech Preemphaser : Prepare acquired audio for machine learning tasks
- Voice activity detection : Detect when someone's speaking (even at very low signal-to-noise ratio)
- Features extraction : Pure JavaScript MFCC (Mel-Frequency Cepstral Coefficients) implementation
- wake word / hot word / trigger word : Immediatly trigger tasks whenever an associated chosen word has been pronounced

### Demo

You can run the demo locally :

```
git clone https://github.com/linto-ai/WebVoiceSDK.git
cd WebVoiceSDK
npm install
npm run dev
```

It showcases the entire pipeline : **microphone -> voice-activity-detection -> downsampling -> speech-preemphasis -> features-extraction -> wake-word-inference**

_**Note**_ : To start the tool, click on the start button, accept browser's access to the default audio input. The Voice Activity Detection "led" will blink as someone's speaking. Something magic will happen if someone says _Linto_. (Something like "LeanToh" for english speakers as the model was trained with our french data-set)

_**Note**_ : You can select the model you want to use. The library comes prepacked with two wake word models (one model for _LinTO_ and a triple headed model that bounces on _LinTO, Snips_ or _Firefox_)

## Highlights

- Complete multithreading JavaScript implementation using Workers for real-time processing on any machine
- WebAssembly optimisations whenever possible
- State of the art Recurent Neural Network that uses WebAssembly portable runtime for voice activity detection. This is modern and efficient alternative to the popular [Hark voice activity detection tool](https://www.npmjs.com/package/hark)
- Available as ES module and IIFE bundle for direct browser usage
- Built library ships as lightweight static files with a separate worker for wake word inference
- The wake word Engine relies on Tensorflow JS and WebAssembly portable runtime to infers towards single or multiple wake-words model with lightweight and ultra-effecient performances.
- Portable machine-learning models : Use the same wake word models on embedded devices, mobile phones, desktop computers, web pages. See : [LinTO Hotword Model Generator](https://github.com/linto-ai/linto-desktoptools-hmg) and [Create your custom wake-word](https://doc.linto.ai/#/client/custom_hotword)
- Full offline speech recognition in browser, no server behind, all the magic happens in your webpage itself

## Usage

### With a bundler (ES module)

```
npm install @linto-ai/webvoicesdk
```

```js
import WebVoiceSDK from "@linto-ai/webvoicesdk";
```

### In the browser (IIFE)

```html
<script src="dist/webvoicesdk.min.js"></script>
```

Or via CDN :

```html
<script src="https://cdn.jsdelivr.net/gh/linto-ai/WebVoiceSDK@master/dist/webvoicesdk.min.js"></script>
```

## API

Every node follows the same pattern : instantiate with options, `start(parentNode)` to connect, `stop()` to disconnect. Nodes are chained together to form a processing pipeline.

### Full pipeline example

```js
import { Mic, Vad, DownSampler, SpeechPreemphaser, FeaturesExtractor, Hotword } from "@linto-ai/webvoicesdk";

const mic = new Mic();
const vad = new Vad();
const downSampler = new DownSampler();
const speechPreemphaser = new SpeechPreemphaser();
const feat = new FeaturesExtractor();
const hotword = new Hotword();

await mic.start();
await vad.start(mic);
await downSampler.start(mic);
await speechPreemphaser.start(downSampler);
await feat.start(speechPreemphaser);
await hotword.start(feat, vad, 0.9);
await hotword.loadModel("/path/to/model.json");

vad.addEventListener("speakingStatus", (e) => {
  console.log("Speaking:", e.detail);
});

hotword.addEventListener("hotword", (e) => {
  console.log("Hotword detected:", e.detail);
});
```

### DownSampler

Resamples and reframes audio from a parent node. Emits a `downSamplerFrame` event for each processed frame.

```js
const downSampler = new DownSampler({
  targetSampleRate: 16000, // default: 16000
  targetFrameSize: 4096,   // default: 512
  Int16Convert: true,      // default: false
});

await downSampler.start(mic);
downSampler.addEventListener("downSamplerFrame", (e) => {
  console.log("Audio frame:", e.detail);
});
```

### Recorder

Hooks onto any node to record its output as a file.

```js
import { Recorder } from "@linto-ai/webvoicesdk";

const recorder = new Recorder();
await recorder.start(mic);
recorder.punchIn();
// ... record for a while ...
recorder.punchOut();
const wavUrl = recorder.getWavFile();
```

## Copyright notice

This library includes modified bits from :

- [Meyda](https://github.com/meyda/meyda) MIT Licence
- [FFTjs](https://github.com/nevosegal/fftjs) MIT Licence
- [node-dct](https://github.com/vail-systems/node-dct) MIT Licence
- [Jitsi](https://github.com/jitsi/jitsi-meet) Apache License 2.0
