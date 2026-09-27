"use client";

// Helper to safely get the audio context
const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  return new AudioContextClass();
};

export const playSuccessSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // A beautiful, bright 3-note arpeggio (C Major) for a highly satisfying "Saved" feeling
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(
        0.15,
        ctx.currentTime + startTime + 0.02,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + startTime + duration,
      );

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    playNote(523.25, 0, 0.2); // C5 (Start)
    playNote(659.25, 0.08, 0.2); // E5 (Middle)
    playNote(783.99, 0.16, 0.5); // G5 (Finish with a ring)
  } catch (e) {
    console.error("Audio error:", e);
  }
};

export const playDeleteSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // A crisp, negative double "bloop-bloop" to clearly indicate deletion/removal
    const playTone = (freq: number, startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // Filter out harsh highs of the square wave
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      osc.frequency.exponentialRampToValueAtTime(freq / 2, ctx.currentTime + startTime + 0.1);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + 0.15);
      
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + 0.15);
    };

    playTone(300, 0);       // First note
    playTone(200, 0.15);    // Second, lower note
  } catch (e) {
    console.error("Audio error:", e);
  }
};

export const playPopSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // A pleasant "Ding!" like a hotel reception desk bell
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    // Mix of high sine and triangle creates a metallic chime
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1244.51, ctx.currentTime); // D#6

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1864.66, ctx.currentTime); // A#6

    gain.gain.setValueAtTime(0, ctx.currentTime);
    // Fast attack
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    // Long, beautiful decay
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.8);
    osc2.stop(ctx.currentTime + 0.8);
  } catch (e) {
    console.error("Audio error:", e);
  }
};
