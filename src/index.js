import webSpeech from './web-speech-sdk/webspeech'
// Attaches this singleton reference to the browser global scope. Any custom logic will then hook to webSpeech custom events being fired.
window.webSpeech = webSpeech
console.info("WebSpeech SDK Loaded !")