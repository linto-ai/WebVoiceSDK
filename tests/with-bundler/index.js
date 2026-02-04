import webVoiceSDK from "../../src/webvoicesdk.js";

const VADHandler = function (speakingEvent) {
  console.log(speakingEvent);
  speakingEvent.detail
    ? (document.getElementById("VADLed").classList.add("led-red"),
      document.getElementById("VADLed").classList.remove("led-green"))
    : (document.getElementById("VADLed").classList.add("led-green"),
      document.getElementById("VADLed").classList.remove("led-red"));
};

const HotwordHandler = function (hotWordEvent) {
  hotword.pause();
  document.getElementById("LinTO").innerHTML = hotWordEvent.detail;
  document
    .getElementById("LinTO")
    .setAttribute("style", "display:inline-block;");

  setTimeout(() => {
    hotword.resume();
    document.getElementById("LinTO").setAttribute("style", "display:none;");
  }, 1500);
};

let mic = null;
let downSampler = null;
let vad = null;
let speechPreemphaser = null;
let feat = null;
let hotword = null;

let recMic = null;
let recFeatures = null;
let recDownsampler = null;
let recSpeechPreemphaser = null;
let recHw = null;

async function start() {
  mic = new webVoiceSDK.Mic(JSON.parse(document.getElementById("mic").value));
  downSampler = new webVoiceSDK.DownSampler();
  vad = new webVoiceSDK.Vad(JSON.parse(document.getElementById("VAD").value));
  speechPreemphaser = new webVoiceSDK.SpeechPreemphaser();
  feat = new webVoiceSDK.FeaturesExtractor();
  hotword = new webVoiceSDK.Hotword();
  await mic.start();
  await downSampler.start(mic);
  await vad.start(mic);
  await speechPreemphaser.start(downSampler);
  await feat.start(speechPreemphaser);
  //   await hotword.start(feat, vad, 0.9);
  //   // Models are served from the public directory (hotwords/)
  //   await hotword.loadModel("/linto/model.json");
  document
    .getElementById("VADLed")
    .setAttribute("style", "display:inline-block;");
  vad.addEventListener("speakingStatus", VADHandler);
  hotword.addEventListener("hotword", HotwordHandler);
}

async function stop(params) {
  await downSampler.stop();
  await vad.stop();
  await speechPreemphaser.stop();
  await feat.stop();
  await hotword.stop(feat, vad);
  document.getElementById("VADLed").setAttribute("style", "display:none;");
  vad.removeEventListener("speakingStatus", VADHandler);
}

async function rec() {
  recMic = new webVoiceSDK.Recorder();
  recFeatures = new webVoiceSDK.Recorder();
  recDownsampler = new webVoiceSDK.Recorder();
  recSpeechPreemphaser = new webVoiceSDK.Recorder();
  recHw = new webVoiceSDK.Recorder();
  await recMic.start(mic);
  await recHw.start(hotword);
  await recFeatures.start(feat);
  await recDownsampler.start(downSampler);
  await recSpeechPreemphaser.start(speechPreemphaser);
  recMic.rec();
  recFeatures.rec();
  recDownsampler.rec();
  recSpeechPreemphaser.rec();
  recHw.rec();
}

async function stopRec() {
  recMic.stopRec();
  recFeatures.stopRec();
  recDownsampler.stopRec();
  recSpeechPreemphaser.stopRec();
  recHw.stopRec();

  showLink(recMic);
  showLink(recFeatures);
  showLink(recDownsampler);
  showLink(recSpeechPreemphaser);
  showLink(recHw);
}

function showLink() {
  let url = recInstance.getFile();
  let link = window.document.createElement("a");
  link.href = url;
  if (
    recInstance.hookedOn.type == "mic" ||
    recInstance.hookedOn.type == "downSampler" ||
    recInstance.hookedOn.type == "speechPreemphaser"
  ) {
    link.download = recInstance.hookedOn.type + ".wav";
  }
  if (recInstance.hookedOn.type == "featuresExtractor") {
    link.download = recInstance.hookedOn.type + ".json";
  }
  if (recInstance.hookedOn.type == "hotword") {
    link.download = recInstance.hookedOn.type + ".json";
  }
  link.textContent = recInstance.hookedOn.type;
  let click = document.createEvent("Event");
  click.initEvent("click", true, true);
  link.dispatchEvent(click);
  // Attach the link to the DOM
  document.body.appendChild(link);
  let hr = window.document.createElement("hr");
  document.body.appendChild(hr);
}

// HTML Interface
document.getElementById("mic").value = JSON.stringify(
  webVoiceSDK.Mic.defaultOptions,
  false,
  4,
);
document.getElementById("VAD").value = JSON.stringify(
  webVoiceSDK.Vad.defaultOptions,
  false,
  4,
);

document.getElementById("start").onclick = async () => {
  start();
};

document.getElementById("lintomodel").onclick = async () => {
  await hotword.loadModel("/linto/model.json");
};

document.getElementById("slinfoxmodel").onclick = async () => {
  await hotword.loadModel("/slinfox/model.json");
};

document.getElementById("stop").onclick = async () => {
  stop();
};

document.getElementById("startrecord").onclick = async () => {
  rec();
};

document.getElementById("stoprecord").onclick = async () => {
  stopRec();
};
