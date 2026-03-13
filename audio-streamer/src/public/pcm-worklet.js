class PCMWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(0);
    this.port.onmessage = (e) => {
      // Receive PCM data from main thread
      const incoming = e.data;
      const merged = new Float32Array(this.buffer.length + incoming.length);
      merged.set(this.buffer);
      merged.set(incoming, this.buffer.length);
      this.buffer = merged;
    };
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    const channels = output.length;
    const frameSize = output[0].length; // typically 128 frames

    const samplesNeeded = frameSize * channels;

    if (this.buffer.length >= samplesNeeded) {
      // Deinterleave: buffer is [L,R,L,R,...] → separate channels
      for (let i = 0; i < frameSize; i++) {
        for (let ch = 0; ch < channels; ch++) {
          output[ch][i] = this.buffer[i * channels + ch];
        }
      }
      this.buffer = this.buffer.subarray(samplesNeeded);
    } else {
      // Underrun — output silence
      for (let ch = 0; ch < channels; ch++) {
        output[ch].fill(0);
      }
    }

    return true;
  }
}

registerProcessor('pcm-worklet', PCMWorklet);
