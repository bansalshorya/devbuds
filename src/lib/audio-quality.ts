export type AudioQuality = { duration: number; warnings: string[]; peak: number; rms: number };

// Signal checks are language-independent heuristics, not speech recognition.
// Use the strongest channel so a silent stereo channel does not mask speech.
export function analyzeAudio(channels: Float32Array[], sampleRate: number): AudioQuality {
  if (!channels.length || !Number.isFinite(sampleRate) || sampleRate <= 0 || !channels[0].length) {
    return { duration: 0, peak: 0, rms: 0, warnings: ["The audio is empty. Record again before transcribing."] };
  }
  let peak = 0;
  let rms = 0;
  let clipping = 0;
  for (const channel of channels) {
    let sum = 0;
    let clipped = 0;
    for (const value of channel) {
      const amplitude = Math.abs(value);
      peak = Math.max(peak, amplitude);
      sum += value * value;
      if (amplitude >= 0.99) clipped++;
    }
    rms = Math.max(rms, Math.sqrt(sum / Math.max(1, channel.length)));
    clipping = Math.max(clipping, clipped / Math.max(1, channel.length));
  }
  const duration = channels[0].length / sampleRate;
  const warnings: string[] = [];
  if (duration < 1) warnings.push("This clip is under one second. Record a complete sentence for a more useful transcript.");
  if (rms < 0.0003 && peak < 0.003) warnings.push("Little or no sound detected. Check the microphone, unmute it, and record again.");
  else if (rms < 0.01) warnings.push("The audio volume is low. Move closer to the microphone or speak more clearly.");
  if (clipping > 0.01) warnings.push("The audio may be distorted. Move slightly away from the microphone or lower its input volume.");
  return { duration, warnings, peak, rms };
}
