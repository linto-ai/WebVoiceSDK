# WebVoice SDK

WebVoice SDK is a JavaScript library that provides lightweights and fairly well optimized buildings block for always-listening voice-enabled applications right in the browser. This library is the main technology behind LinTO's Web Client as it deals with everything related to user's voice input.

## Functionalities 
- Hardware Microphone Handler : hook to hardware, record, playback, get file from buffer as wav... very handy
- Downsampler : re-inject acquired audio at any given samplerate / frame size
- Speech Preemphaser : Prepare acquired audio for machine learning tasks
- Voice activity detection : Detect when someone's speaking (even at very low signal-to-noise ratio)
- Features extraction : Pure JavaScript MFCC (Mel-Frequency Cepstral Coefficients) implementation
- wake word / hot word / trigger word : Immediatly trigger tasks whenever an associated chosen word has been pronounced

### Online demo

You can find an online demo of the library on this static webpage : [https://webvoicesdk.netlify.app/](https://webvoicesdk.netlify.app/)

It showcases the entire pipeline : __microphone -> voice-activity-detection -> downsampling -> speech-preemphasis -> features-extraction -> wake-word-inference__

_**Note**_ : To start the tool, click on the start button, accept browser's access to the default audio input. The Voice Activity Detection "led" will blink as someone's speaking. Something magic will happen if someone says _Linto_. (Something like "LeanToh" for english speakers as the model was trained with our french data-set)


_**Note**_ : You can select the model you want to use. The library comes prepacked with two wake word models (one model for _LinTO_ and a triple headed model that bounces on _LinTO, Snips_ or _Firefox_)

## Highlights
- Complete multithreading JavaScript implementation using Workers for real-time processing on any machine
- WebAssembly optimisations whenever possible
- State of the art Recurent Neural Network that uses WebAssembly portable runtime for voice activity detection. This is modern and efficient alternative to the popular [Hark voice activity detection tool](https://www.npmjs.com/package/hark)
- Supports single inline script that can get deployed in any webpage without mandatory bundlers
- Built library embbeds everything (wasm files, tensorflow.js models for wake words, workers...) into a single static javascript file
- The wake word Engine relies on Tensorflow JS and WebAssembly portable runtime to infers towards single or multiple wake-words model with lightweight and ultra-effecient performances.
- Portable machine-learning models : Use the same wake word models on embedded devices, mobile phones, desktop computers, web pages. See : [LinTO Hotword Model Generator](https://github.com/linto-ai/linto-desktoptools-hmg) and [Create your custom wake-word](https://doc.linto.ai/#/client/custom_hotword)
- Full offline speech recognition in browser, no server behind, all the magic happens in your webpage itself

## Usage

Further documentation and information is in progress. For the moment, You can still build and test the library by yourself
```
npm run test
```

Or import it in your browser : 

```
<script>https://cdn.jsdelivr.net/gh/linto-ai/webVoiceSDK@master/dist/webVoiceSDK-linto.min.js</script>
```
 
## Copyright notice

This library includes modified bits from :
- [Meyda](https://github.com/meyda/meyda) MIT Licence
- [FFTjs](https://github.com/nevosegal/fftjs) MIT Licence
- [node-dct](https://github.com/vail-systems/node-dct) MIT Licence
- [Jitsi](https://github.com/jitsi/jitsi-meet) Apache License 2.0