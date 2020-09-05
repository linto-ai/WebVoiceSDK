let nativeSampleRate
let inputBuffer = []
let targetSampleRate
let targetFrameSize
let Int16Convert

onmessage = function (msg) {
    switch (msg.data.method) {
        case "configure":
            nativeSampleRate = msg.data.nativeSampleRate
            targetSampleRate = msg.data.targetSampleRate
            targetFrameSize = msg.data.targetFrameSize
            Int16Convert = msg.data.Int16Convert
            break
        case "process":
            process(msg.data.audioFrame)
            break
    }
}

function process(audioFrame) {
    for (let sample of audioFrame)
    {
        //binary 111111111111111, casts to 16Bit wav file spec
        Int16Convert ? inputBuffer.push(sample * 32767) : inputBuffer.push(sample)
    }
    while ((inputBuffer.length * targetSampleRate / nativeSampleRate) > targetFrameSize) {
        let outputFrame
        Int16Convert ? outputFrame = new Int16Array(targetFrameSize) : outputFrame = new Float32Array(targetFrameSize)
        let sum = 0
        let num = 0
        let outputIndex = 0
        let inputIndex = 0
        while (outputIndex < targetFrameSize) {
            sum = 0
            num = 0
            while (inputIndex < Math.min(inputBuffer.length, (outputIndex + 1) * nativeSampleRate / targetSampleRate)) {
                sum += inputBuffer[inputIndex]
                num++
                inputIndex++
            }
            outputFrame[outputIndex] = sum / num
            outputIndex++
        }
        inputBuffer = inputBuffer.slice(inputIndex)
        postMessage(outputFrame)
    }
}

