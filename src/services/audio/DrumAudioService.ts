/**
 * Skor / trống Khmer — synthesized via Web Audio API.
 * Deep resonant body + slap overtones, tempo-synced to race BPM.
 */
export class DrumAudioService {
  private ctx: AudioContext | null = null;
  private bpm = 120;
  private enabled = true;
  private lastBeatIndex = -1;

  async resume(): Promise<void> {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  start(bpm: number): void {
    this.bpm = bpm;
    this.lastBeatIndex = -1;
    void this.resume();
  }

  /** Gọi mỗi frame với elapsedMs từ simulator — đồng bộ trống với nhịp đua */
  sync(elapsedMs: number): void {
    if (!this.enabled) return;
    const beatMs = 60_000 / this.bpm;
    const beatIndex = Math.floor(elapsedMs / beatMs);
    if (beatIndex <= this.lastBeatIndex) return;
    this.lastBeatIndex = beatIndex;
    this.playBeat(beatIndex);
  }

  stop(): void {
    this.lastBeatIndex = -1;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  playAccent(): void {
    this.playDrum(0.95, 72, 0.22);
  }

  destroy(): void {
    this.stop();
    void this.ctx?.close();
    this.ctx = null;
  }

  private playBeat(beatIndex: number): void {
    if (!this.enabled || !this.ctx) return;
    const accent = beatIndex % 4 === 0;
    if (accent) {
      this.playDrum(1.0, 68, 0.28);
      setTimeout(() => this.playDrum(0.55, 180, 0.08), 40);
    } else {
      this.playDrum(0.75, 90, 0.14);
    }
  }

  private playDrum(gain: number, freq: number, decay: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + decay);

    amp.gain.setValueAtTime(gain * 0.5, now);
    amp.gain.exponentialRampToValueAtTime(0.001, now + decay);

    // Noise slap layer
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(gain * 0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(amp);
    amp.connect(this.ctx.destination);
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + decay);
    noise.start(now);
  }
}

export const drumAudio = new DrumAudioService();
