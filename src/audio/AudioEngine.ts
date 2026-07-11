import * as Tone from 'tone';
import { TimeBlock, TimeSignature } from '../core/types';

export class AudioEngine {
  private static padSampler: Tone.Sampler | null = null;
  private static bassSampler: Tone.Sampler | null = null;
  private static drumSampler: Tone.Sampler | null = null;
  
  private static isSetup = false;
  private static isStarted = false;
  
  private static currentPart: Tone.Part | null = null;
  private static drumLoop: Tone.Loop | null = null;

  private static currentNum = 4;
  private static currentDen = 4;
  
  private static lastCallback: ((chordName: string | null, blockId: string) => void) | null = null;

  private static async setupInstruments() {
    if (this.isSetup) return;

    // Efecto espacioso pero hiper-ligero para el piano
    const reverb = new Tone.JCReverb(0.4).toDestination();
    reverb.wet.value = 0.25;
    const chorus = new Tone.Chorus(4, 2.5, 0.5).connect(reverb).start();

    // 1. PIANO (Salamander Grand Piano)
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

    // 2. BAJO (Casio Synth Bass)
    this.bassSampler = new Tone.Sampler({
      urls: {
        C2: "C2.mp3",
      },
      baseUrl: "https://tonejs.github.io/audio/casio/",
    }).toDestination();
    this.bassSampler.volume.value = -2;

    // 3. BATERÍA (Roland CR-78)
    // Mapeamos las notas arbitrarias C2, D2, F2 a los audios reales
    this.drumSampler = new Tone.Sampler({
      urls: {
        C2: "kick.mp3",
        D2: "snare.mp3",
        F2: "hihat.mp3"
      },
      baseUrl: "https://tonejs.github.io/audio/drum-samples/CR78/",
    }).toDestination();
    this.drumSampler.volume.value = -4;

    // Esperar a que todos los audios en red terminen de descargarse
    await Tone.loaded();

    this.isSetup = true;
  }

  public static async startAudioContext() {
    await this.setupInstruments();
    if (!this.isStarted) {
      try {
        await Tone.start();
        this.isStarted = true;
      } catch (error) {
        console.warn("FretLoop AudioEngine: Autoplay policy previno el inicio de Tone.js.", error);
      }
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
    if (this.padSampler) this.padSampler.volume.rampTo(keys ? -Infinity : -6, 0.1);
    if (this.bassSampler) this.bassSampler.volume.rampTo(bass ? -Infinity : -2, 0.1);
    if (this.drumSampler) this.drumSampler.volume.rampTo(drums ? -Infinity : -4, 0.1);
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
        // Teclado (Keys): Piano en octavas 3 y 4
        const keysNotes = [
          ...value.chord.notes.map((n: string) => n + "3"),
          ...value.chord.notes.map((n: string) => n + "4")
        ];
        
        // Bajo (Bass): Tónica en octava 1 y 2
        const bassNotes = [value.chord.root + "1", value.chord.root + "2"];
        
        this.padSampler?.triggerAttackRelease(keysNotes, value.duration, time);
        this.bassSampler?.triggerAttackRelease(bassNotes, value.duration, time);
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
    if (!this.padSampler || !this.drumSampler || !this.bassSampler) return;

    this.stop();
    this.lastCallback = onChordChange;

    let eighthNoteCount = 0;
    
    this.drumLoop = new Tone.Loop((time) => {
      const eighthsPerMeasure = this.currentDen === 4 ? this.currentNum * 2 : this.currentNum;
      const step = eighthNoteCount % eighthsPerMeasure;

      // ── HI-HAT (F2) ──
      this.drumSampler?.triggerAttackRelease("F2", "32n", time, 0.3);

      // ── Patrón rítmico según el compás ──
      if (this.currentNum === 4 && this.currentDen === 4) {
        if (step === 0 || step === 4) {
          this.drumSampler?.triggerAttackRelease("C2", "8n", time, step === 0 ? 1 : 0.8);
        }
        if (step === 2 || step === 6) {
          this.drumSampler?.triggerAttackRelease("D2", "16n", time, 1);
        }
      } else if (this.currentNum === 3 && this.currentDen === 4) {
        if (step === 0) {
          this.drumSampler?.triggerAttackRelease("C2", "8n", time, 1);
        }
        if (step === 2 || step === 4) {
          this.drumSampler?.triggerAttackRelease("D2", "16n", time, 0.7);
        }
      } else if (this.currentNum === 6 && this.currentDen === 8) {
        if (step === 0) {
          this.drumSampler?.triggerAttackRelease("C2", "8n", time, 1);
        }
        if (step === 3) {
          this.drumSampler?.triggerAttackRelease("C2", "8n", time, 0.6);
          this.drumSampler?.triggerAttackRelease("D2", "16n", time, 0.8);
        }
      } else {
        if (step === 0) {
          this.drumSampler?.triggerAttackRelease("C2", "8n", time, 1);
        }
        if (step === Math.floor(eighthsPerMeasure / 2)) {
          this.drumSampler?.triggerAttackRelease("D2", "16n", time, 1);
        }
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
