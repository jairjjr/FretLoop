import * as Tone from 'tone';
import { TimeBlock, TimeSignature } from '../core/types';

export class AudioEngine {
  private static padSampler: Tone.Sampler | null = null;
  private static bassSampler: Tone.Sampler | null = null;
  private static drumSampler: Tone.Sampler | null = null;
  
  // Fallbacks sintéticos para operación offline o fallo de red CDN
  private static fallbackKeysSynth: Tone.PolySynth | null = null;
  private static fallbackBassSynth: Tone.MonoSynth | null = null;
  private static fallbackKickSynth: Tone.MembraneSynth | null = null;
  private static fallbackSnareSynth: Tone.NoiseSynth | null = null;
  private static fallbackHihatSynth: Tone.MetalSynth | null = null;
  
  private static useSyntheticFallback = false;
  private static isSetup = false;
  private static isStarted = false;
  
  private static currentPart: Tone.Part | null = null;
  private static drumLoop: Tone.Loop | null = null;

  private static currentNum = 4;
  private static currentDen = 4;
  
  private static lastCallback: ((chordName: string | null, blockId: string) => void) | null = null;

  private static setupSyntheticFallbacks() {
    if (this.fallbackKeysSynth) return;

    // Sintetizador polifónico cálido con simulación de resonancia de cuerdas
    this.fallbackKeysSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle8" },
      envelope: { attack: 0.02, decay: 0.4, sustain: 0.5, release: 1.2 }
    }).toDestination();
    this.fallbackKeysSynth.volume.value = -8;

    this.fallbackBassSynth = new Tone.MonoSynth({
      oscillator: { type: "sawtooth" },
      filter: { Q: 2, type: "lowpass", rolloff: -24 },
      filterEnvelope: { attack: 0.02, decay: 0.25, sustain: 0.3, release: 0.6, baseFrequency: 55, octaves: 2.2 }
    }).toDestination();
    this.fallbackBassSynth.volume.value = -4;

    this.fallbackKickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.4 }
    }).toDestination();
    this.fallbackKickSynth.volume.value = -6;

    this.fallbackSnareSynth = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
    }).toDestination();
    this.fallbackSnareSynth.volume.value = -12;

    this.fallbackHihatSynth = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.05 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();
    this.fallbackHihatSynth.volume.value = -18;
  }

  private static async setupInstruments() {
    if (this.isSetup) return;

    this.setupSyntheticFallbacks();

    try {
      const reverb = new Tone.JCReverb(0.35).toDestination();
      reverb.wet.value = 0.2;
      const chorus = new Tone.Chorus(3, 2.5, 0.4).connect(reverb).start();

      this.padSampler = new Tone.Sampler({
        urls: {
          C3: "C3.mp3",
          C4: "C4.mp3",
          C5: "C5.mp3",
          C6: "C6.mp3"
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
      }).connect(chorus);
      this.padSampler.volume.value = -6;

      this.bassSampler = new Tone.Sampler({
        urls: {
          C2: "C2.mp3",
        },
        baseUrl: "https://tonejs.github.io/audio/casio/",
      }).toDestination();
      this.bassSampler.volume.value = -2;

      this.drumSampler = new Tone.Sampler({
        urls: {
          C2: "kick.mp3",
          D2: "snare.mp3",
          F2: "hihat.mp3"
        },
        baseUrl: "https://tonejs.github.io/audio/drum-samples/CR78/",
      }).toDestination();
      this.drumSampler.volume.value = -4;

      // Tiempo límite de 3.5s para evitar bloqueo de UI si la red externa es lenta
      await Promise.race([
        Tone.loaded(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout descargando muestras")), 3500))
      ]);

      this.useSyntheticFallback = false;
    } catch {
      // Conmutar a sintetizadores de alta fidelidad locales si falla la CDN
      this.useSyntheticFallback = true;
    }

    this.isSetup = true;
  }

  public static async startAudioContext() {
    await this.setupInstruments();
    if (!this.isStarted) {
      try {
        await Tone.start();
        this.isStarted = true;
      } catch (error) {
        console.warn("AudioEngine: inicio diferido por política de autoplay del navegador.", error);
      }
    }
  }

  // Audición directa e instantánea al tocar o hacer clic en cualquier traste del diapasón
  public static async playNote(noteWithOctave: string) {
    await this.startAudioContext();
    const time = Tone.now();

    if (!this.useSyntheticFallback && this.padSampler?.loaded) {
      this.padSampler.triggerAttackRelease(noteWithOctave, "4n", time, 0.85);
    } else if (this.fallbackKeysSynth) {
      this.fallbackKeysSynth.triggerAttackRelease(noteWithOctave, "4n", time, 0.85);
    }
  }

  public static setTimeSignature(ts: TimeSignature) {
    const [num, den] = ts.split('/').map(Number);
    this.currentNum = num;
    this.currentDen = den;
    Tone.Transport.timeSignature = [num, den];
  }

  public static setBpm(bpm: number) {
    Tone.Transport.bpm.value = bpm;
  }

  public static setMutes(drums: boolean, bass: boolean, keys: boolean) {
    const keysVol = keys ? -Infinity : -6;
    const bassVol = bass ? -Infinity : -2;
    const drumsVol = drums ? -Infinity : -4;

    if (this.padSampler) this.padSampler.volume.rampTo(keysVol, 0.08);
    if (this.fallbackKeysSynth) this.fallbackKeysSynth.volume.rampTo(keysVol, 0.08);

    if (this.bassSampler) this.bassSampler.volume.rampTo(bassVol, 0.08);
    if (this.fallbackBassSynth) this.fallbackBassSynth.volume.rampTo(bassVol, 0.08);

    if (this.drumSampler) this.drumSampler.volume.rampTo(drumsVol, 0.08);
    if (this.fallbackKickSynth) this.fallbackKickSynth.volume.rampTo(drums ? -Infinity : -6, 0.08);
  }

  public static updateSequence(blocks: TimeBlock[]) {
    if (!this.currentPart || !this.lastCallback) return;
    
    this.currentPart.dispose();
    
    const ticksPerBeat = Tone.Time("4n").toTicks();
    const events: any[] = [];
    let currentTicks = 0;

    blocks.forEach(block => {
      const durationTicks = block.durationInBeats * ticksPerBeat;
      events.push({
        time: currentTicks + "i",
        chord: block.chord,
        duration: durationTicks + "i",
        blockId: block.id
      });
      currentTicks += durationTicks;
    });

    const totalLoopTicks = currentTicks;

    this.currentPart = new Tone.Part((time, value) => {
      if (value.chord) {
        const keysNotes = [
          ...value.chord.notes.map((n: string) => n + "3"),
          ...value.chord.notes.map((n: string) => n + "4")
        ];
        const bassNotes = [value.chord.root + "1", value.chord.root + "2"];

        // Disparo con desfase milimétrico (18ms) para simular rasgueo de guitarra
        if (!this.useSyntheticFallback && this.padSampler?.loaded) {
          keysNotes.forEach((n, idx) => {
            const strumOffset = idx * 0.018;
            this.padSampler?.triggerAttackRelease(n, value.duration, time + strumOffset);
          });
        } else if (this.fallbackKeysSynth) {
          keysNotes.forEach((n, idx) => {
            const strumOffset = idx * 0.018;
            this.fallbackKeysSynth?.triggerAttackRelease(n, value.duration, time + strumOffset);
          });
        }

        if (!this.useSyntheticFallback && this.bassSampler?.loaded) {
          this.bassSampler.triggerAttackRelease(bassNotes, value.duration, time);
        } else if (this.fallbackBassSynth) {
          this.fallbackBassSynth.triggerAttackRelease(bassNotes[0], value.duration, time);
        }
      }

      Tone.Draw.schedule(() => {
        if (this.lastCallback) this.lastCallback(value.chord ? value.chord.name : null, value.blockId);
      }, time);
    }, events).start(0);

    this.currentPart.loop = true;
    this.currentPart.loopEnd = totalLoopTicks + "i";
  }

  public static async playSequence(blocks: TimeBlock[], onChordChange: (chordName: string | null, blockId: string) => void) {
    await this.startAudioContext();
    this.stop();
    this.lastCallback = onChordChange;

    let eighthNoteCount = 0;
    
    this.drumLoop = new Tone.Loop((time) => {
      const eighthsPerMeasure = this.currentDen === 4 ? this.currentNum * 2 : this.currentNum;
      const step = eighthNoteCount % eighthsPerMeasure;

      // Hi-Hat
      if (!this.useSyntheticFallback && this.drumSampler?.loaded) {
        this.drumSampler.triggerAttackRelease("F2", "32n", time, 0.3);
      } else if (this.fallbackHihatSynth) {
        this.fallbackHihatSynth.triggerAttackRelease("32n", time, 0.2);
      }

      const triggerKick = (vel: number) => {
        if (!this.useSyntheticFallback && this.drumSampler?.loaded) {
          this.drumSampler.triggerAttackRelease("C2", "8n", time, vel);
        } else if (this.fallbackKickSynth) {
          this.fallbackKickSynth.triggerAttackRelease("C1", "8n", time, vel);
        }
      };

      const triggerSnare = (vel: number) => {
        if (!this.useSyntheticFallback && this.drumSampler?.loaded) {
          this.drumSampler.triggerAttackRelease("D2", "16n", time, vel);
        } else if (this.fallbackSnareSynth) {
          this.fallbackSnareSynth.triggerAttackRelease("16n", time, vel);
        }
      };

      // Mapeo rítmico según compás
      if (this.currentNum === 4 && this.currentDen === 4) {
        if (step === 0 || step === 4) triggerKick(step === 0 ? 1 : 0.75);
        if (step === 2 || step === 6) triggerSnare(0.9);
      } else if (this.currentNum === 3 && this.currentDen === 4) {
        if (step === 0) triggerKick(1);
        if (step === 2 || step === 4) triggerSnare(0.7);
      } else if (this.currentNum === 6 && this.currentDen === 8) {
        if (step === 0) triggerKick(1);
        if (step === 3) {
          triggerKick(0.6);
          triggerSnare(0.8);
        }
      } else {
        if (step === 0) triggerKick(1);
        if (step === Math.floor(eighthsPerMeasure / 2)) triggerSnare(0.9);
      }
      
      eighthNoteCount++;
    }, "8n").start(0);

    this.currentPart = new Tone.Part<any>(() => {}, []).start(0); 
    this.updateSequence(blocks);

    Tone.Transport.start("+0.01");
  }

  public static stop() {
    Tone.Transport.stop();
    this.padSampler?.releaseAll();
    this.bassSampler?.releaseAll();
    this.drumSampler?.releaseAll();
    this.fallbackKeysSynth?.releaseAll();
    
    if (this.currentPart) {
      this.currentPart.dispose();
      this.currentPart = null;
    }
    if (this.drumLoop) {
      this.drumLoop.dispose();
      this.drumLoop = null;
    }
    this.lastCallback = null;
    Tone.Transport.position = 0;
  }
}

