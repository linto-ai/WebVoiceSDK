# WebVoice SDK

WebVoice SDK is a JavaScript library that provides lightweight and fairly well optimized buildings block for always-listening voice-enabled applications right in the browser. This library is the main technology behind LinTO's Web Client as it deals with everything related to user's voice input.

## Functionalities 
- Hardware Microphone Handler : hook to hardware, record, playback, get file from buffer as wav... very handy
- Downsampler : re-inject acquired audio at any given samplerate / frame size
- Speech Preemphaser : Prepare acquired audio for machine learning tasks
- Voice activity detection : Detect when someone's speaking (even at very low signal-to-noise ratio)
- Features extraction : Pure JavaScript MFCC (Mel-Frequency Cepstral Coefficients) implementation
- wake word / hot word / trigger word : Immediatly trigger tasks whenever an associated chosen word has been pronounced

## Highlights
- Complete multithreading JavaScript implementation using Workers for real-time processing on any machine
- WebAssembly optimisations whenever possible
- State of the art Recurent Neural Network that uses WebAssembly portable runtime for voice activity detection
- Supports single inline script that can get deployed in any webpage without mandatory bundlers
- Built library embbeds everything (wasm files, tensorflow.js models for wake words, workers...) into a single static javascript file
- The wake word Engine relies on Tensorflow JS and WebAssembly portable runtime to infers towards single or multiple wake-words model with lightweight and ultra-effecient performances.
- Prepacked with two wake word models (_LinTO_ and _LinTO,Snips,Firefox_)
- Portable models from LinTO'HMG : Use the same wake word models on embedded devices, mobile phones, desktop computers, web pages. It just works 
- Full offline speech recognition in browser, no server behind, all the magic happens in your webpage itself

## Usage

Further documentation and information is in progress. For the moment, You can still build and test the library by yourself :
```
npm run test
```
 
## Copyright notice

This library includes modified bits from :
- [Meyda](https://github.com/meyda/meyda) MIT Licence
- [FFTjs](https://github.com/nevosegal/fftjs) MIT Licence
- [node-dct](https://github.com/vail-systems/node-dct) MIT Licence
- [Jitsi](https://github.com/jitsi/jitsi-meet) Apache License 2.0