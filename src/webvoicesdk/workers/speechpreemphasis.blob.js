
onmessage = function (msg) {
    switch (msg.data.method) {
        case "process":
            process(msg.data.audioFrame)
            break
    }
}

let lastFrameValue = 0
let val

function process(audioFrame) {
    let emphasedAudioFrame = []
    for (let i = 0; i < audioFrame.length; i++) {
        if (i == 0) {
            val = audioFrame[i] - lastFrameValue * 0.97
        } else {
            val = audioFrame[i] - audioFrame[i - 1] * 0.97
        }
        emphasedAudioFrame.push(val)
    }
    lastFrameValue = audioFrame[audioFrame.length - 1]
    postMessage(Float32Array.from(emphasedAudioFrame))
}