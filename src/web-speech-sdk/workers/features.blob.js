/* 
references :
https://github.com/meyda/meyda
https://github.com/nevosegal/fftjs
https://github.com/vail-systems/node-dct
https://github.com/Lokhozt/mfcc/blob/master/lib/mfcc.dart
*/


// =============================================================================
//  DCT
// =============================================================================
var cosMap = null;

// Builds a cosine map for the given input size. This allows multiple input sizes to be memoized automagically
// if you want to run the DCT over and over.
var memoizeCosines = function (N) {
    cosMap = cosMap || {};
    cosMap[N] = new Array(N * N);
    var PI_N = Math.PI / N;
    for (var k = 0; k < N; k++) {
        for (var n = 0; n < N; n++) {
            cosMap[N][n + (k * N)] = Math.cos(PI_N * (n + 0.5) * k);
        }
    }
};
// DCT type 2 with ortho norm
function dct(signal) {
    var N = signal.length
    var result = new Array(N);
    var sum = 0.0;

    // First value
    for (var n = 0; n < N ; n++) {
        sum += signal[n];
    }
    result[0] = sum * 2 * Math.sqrt(1 / (4 * N))

    // Following values
    for (var k = 1; k < N; k++){
        sum = 0.0;
        for (var n = 0; n < N ; n++) {
          sum += signal[n] * Math.cos(Math.PI * k * (2 * n + 1)/(2 * N));
        }
        result[k] = sum * 2 * Math.sqrt(1 / (2 * N));
      }
      return result;
  }

// =============================================================================
// FFT UTILS
// =============================================================================

// memoization of the reversal of different lengths.
var memoizedReversal = {};
var memoizedZeroBuffers = {}

let constructComplexArray = function (signal) {
    var complexSignal = {};

    complexSignal.real = (signal.real === undefined) ? signal.slice() : signal.real.slice();

    var bufferSize = complexSignal.real.length;

    if (memoizedZeroBuffers[bufferSize] === undefined) {
        memoizedZeroBuffers[bufferSize] = Array.apply(null, Array(bufferSize)).map(Number.prototype.valueOf, 0);
    }

    complexSignal.imag = memoizedZeroBuffers[bufferSize].slice();

    return complexSignal;
}

let bitReverseArray = function (N) {
    if (memoizedReversal[N] === undefined) {
        let maxBinaryLength = (N - 1).toString(2).length; //get the binary length of the largest index.
        let templateBinary = '0'.repeat(maxBinaryLength); //create a template binary of that length.
        let reversed = {};
        for (let n = 0; n < N; n++) {
            let currBinary = n.toString(2); //get binary value of current index.

            //prepend zeros from template to current binary. This makes binary values of all indices have the same length.
            currBinary = templateBinary.substr(currBinary.length) + currBinary;

            currBinary = [...currBinary].reverse().join(''); //reverse
            reversed[n] = parseInt(currBinary, 2); //convert to decimal
        }
        memoizedReversal[N] = reversed; //save
    }
    return memoizedReversal[N];
}

// complex multiplication
let multiply = function (a, b) {
    return {
        'real': a.real * b.real - a.imag * b.imag,
        'imag': a.real * b.imag + a.imag * b.real
    };
}

// complex addition
let add = function (a, b) {
    return {
        'real': a.real + b.real,
        'imag': a.imag + b.imag
    };
}

// complex subtraction
let subtract = function (a, b) {
    return {
        'real': a.real - b.real,
        'imag': a.imag - b.imag
    };
}

// euler's identity e^x = cos(x) + sin(x)
let euler = function (kn, N) {
    let x = -2 * Math.PI * kn / N;
    return {
        'real': Math.cos(x),
        'imag': Math.sin(x)
    };
}

// complex conjugate
let conj = function (a) {
    a.imag *= -1;
    return a;
}

// =============================================================================
//  FFT COMPUTE
// =============================================================================


// real to complex fft
let fft = function (signal) {

    let complexSignal = {};

    if (signal.real === undefined || signal.imag === undefined) {
        complexSignal = constructComplexArray(signal);
    } else {
        complexSignal.real = signal.real.slice();
        complexSignal.imag = signal.imag.slice();
    }

    const N = complexSignal.real.length;
    const logN = Math.log2(N);

    if (Math.round(logN) != logN) throw new Error('Input size must be a power of 2.');

    if (complexSignal.real.length != complexSignal.imag.length) {
        throw new Error('Real and imaginary components must have the same length.');
    }

    const bitReversedIndices = bitReverseArray(N);

    // sort array
    let ordered = {
        'real': [],
        'imag': []
    };

    for (let i = 0; i < N; i++) {
        ordered.real[bitReversedIndices[i]] = complexSignal.real[i];
        ordered.imag[bitReversedIndices[i]] = complexSignal.imag[i];
    }

    for (let i = 0; i < N; i++) {
        complexSignal.real[i] = ordered.real[i];
        complexSignal.imag[i] = ordered.imag[i];
    }
    // iterate over the number of stages
    for (let n = 1; n <= logN; n++) {
        let currN = Math.pow(2, n);

        // find twiddle factors
        for (let k = 0; k < currN / 2; k++) {
            let twiddle = euler(k, currN);

            // on each block of FT, implement the butterfly diagram
            for (let m = 0; m < N / currN; m++) {
                let currEvenIndex = (currN * m) + k;
                let currOddIndex = (currN * m) + k + (currN / 2);

                let currEvenIndexSample = {
                    'real': complexSignal.real[currEvenIndex],
                    'imag': complexSignal.imag[currEvenIndex]
                }
                let currOddIndexSample = {
                    'real': complexSignal.real[currOddIndex],
                    'imag': complexSignal.imag[currOddIndex]
                }

                let odd = multiply(twiddle, currOddIndexSample);

                let subtractionResult = subtract(currEvenIndexSample, odd);
                complexSignal.real[currOddIndex] = subtractionResult.real;
                complexSignal.imag[currOddIndex] = subtractionResult.imag;

                let additionResult = add(odd, currEvenIndexSample);
                complexSignal.real[currEvenIndex] = additionResult.real;
                complexSignal.imag[currEvenIndex] = additionResult.imag;
            }
        }
    }

    return complexSignal;
}


// =============================================================================
//  MFCC
// =============================================================================

var prepareSignalWithSpectrum = function (signal, bufferSize) {
    var preparedSignal = {};
    preparedSignal.complexSpectrum = fft(signal.slice(0, bufferSize / 2));
    preparedSignal.powSpectrum = new Float32Array(bufferSize / 4 + 1);
    for (var i = 0; i < bufferSize / 4 + 1; i++) {
        preparedSignal.powSpectrum[i] = (
            Math.pow(preparedSignal.complexSpectrum.real[i], 2) +
            Math.pow(preparedSignal.complexSpectrum.imag[i], 2)) / (bufferSize / 2);
    }
    return preparedSignal;
};

function _melToFreq(melValue) {
    var freqValue = 700 * (Math.exp(melValue / 1127) - 1);
    return freqValue;
}

function _freqToMel(freqValue) {
    var melValue = 1127 * Math.log(1 + (freqValue / 700));
    return melValue;
}

function melToFreq(mV) {
    return _melToFreq(mV);
}

function freqToMel(fV) {
    return _freqToMel(fV);
}

function createMelFilterBank(numFilters, sampleRate, bufferSize) {
    //the +2 is the upper and lower limits
    let melValues = new Float32Array(numFilters + 2);
    let melValuesInFreq = new Float32Array(numFilters + 2);

    //Generate limits in Hz - from 0 to the nyquist.
    let lowerLimitFreq = 0;
    let upperLimitFreq = sampleRate / 2;

    //Convert the limits to Mel
    let lowerLimitMel = _freqToMel(lowerLimitFreq);
    let upperLimitMel = _freqToMel(upperLimitFreq);

    //Find the range
    let range = upperLimitMel - lowerLimitMel;

    //Find the range as part of the linear interpolation
    let valueToAdd = range / (numFilters + 1);

    let fftBinsOfFreq = Array(numFilters + 2);

    for (let i = 0; i < melValues.length; i++) {
        // Initialising the mel frequencies
        // They're a linear interpolation between the lower and upper limits.
        melValues[i] = i * valueToAdd;

        // Convert back to Hz
        melValuesInFreq[i] = _melToFreq(melValues[i]);

        // Find the corresponding bins
        fftBinsOfFreq[i] = Math.floor((bufferSize + 1) *
            melValuesInFreq[i] / sampleRate);
    }

    var filterBank = Array(numFilters);
    for (let j = 0; j < filterBank.length; j++) {
        // Create a two dimensional array of size numFilters * (buffersize/2)+1
        // pre-populating the arrays with 0s.
        filterBank[j] = Array.apply(
            null,
            new Array((bufferSize / 2) + 1)).map(Number.prototype.valueOf, 0);

        //creating the lower and upper slopes for each bin
        for (let i = fftBinsOfFreq[j]; i < fftBinsOfFreq[j + 1]; i++) {
            filterBank[j][i] = (i - fftBinsOfFreq[j]) /
                (fftBinsOfFreq[j + 1] - fftBinsOfFreq[j]);
        }

        for (let i = fftBinsOfFreq[j + 1]; i < fftBinsOfFreq[j + 2]; i++) {
            filterBank[j][i] = (fftBinsOfFreq[j + 2] - i) /
                (fftBinsOfFreq[j + 2] - fftBinsOfFreq[j + 1]);
        }
    }
    return filterBank;
}


function mffcCompute(args) {
    if (typeof args.powSpectrum !== 'object') {
        throw new TypeError('Valid ampSpectrum is required to generate MFCC');
    }
    if (typeof args.melFilterBank !== 'object') {
        throw new TypeError('Valid melFilterBank is required to generate MFCC');
    }

    let numberOfMFCCCoefficients = Math.min(40, Math.max(1, args.numberOfMFCCCoefficients || 13));

    // Tutorial from:
    // http://practicalcryptography.com/miscellaneous/machine-learning
    // /guide-mel-frequency-cepstral-coefficients-mfccs/
    let numFilters = args.melFilterBank.length;
    let filtered = Array(numFilters);

    if (numFilters < numberOfMFCCCoefficients) {
        throw new Error("Insufficient filter bank for requested number of coefficients");
    }
    let loggedMelBands = new Float32Array(numFilters);

    for (let i = 0; i < loggedMelBands.length; i++) {
        filtered[i] = new Float32Array(args.bufferSize / 4 + 1);
        loggedMelBands[i] = 0;
        for (let j = 0; j < (args.bufferSize / 4 + 1); j++) {
            //point-wise multiplication between power spectrum and filterbanks.
            filtered[i][j] = args.melFilterBank[i][j] * args.powSpectrum[j];
            //summing up all of the coefficients into one array
            loggedMelBands[i] += filtered[i][j];
        }
        //log each coefficient.
        loggedMelBands[i] = Math.log(loggedMelBands[i] > 0.0 ? loggedMelBands[i] : 1e-45);
    }
    //dct
    let loggedMelBandsArray = Array.prototype.slice.call(loggedMelBands);
    let mfccs = dct(loggedMelBandsArray).slice(0, numberOfMFCCCoefficients);

    return mfccs;
}

// =============================================================================
//  JAVASCRIPT WORKER IMPLEMENTATION
// =============================================================================

let melFilterBank = null
let sampleRate
let numFilters
let numCoefs
let discardFirstBand = true
let bufferSize = 0

onmessage = function (msg) {
    switch (msg.data.method) {
        case "configure":
            numFilters = msg.data.numFilters
            numCoefs = msg.data.numCoefs
            sampleRate = msg.data.sampleRate
            bufferSize = msg.data.bufferSize
            discardFirstBand = msg.data.discardFirstBand
            melFilterBank = createMelFilterBank(numFilters, sampleRate * 2, bufferSize / 2)
            break
        case "process":
            mfcc(msg.data.audioFrame, sampleRate, bufferSize)
            break
    }
}

function mfcc(audioBuffer, sampleRate, bufferSize) {
    let preparedSignal = prepareSignalWithSpectrum(audioBuffer, bufferSize)
    let preparedObject = {
        numberOfMFCCCoefficients: numCoefs,
        sampleRate,
        bufferSize,
        powSpectrum: preparedSignal.powSpectrum,
        melFilterBank
    }
    let mfccs = mffcCompute(preparedObject)
    if (discardFirstBand) mfccs.shift()
    postMessage(mfccs)
}