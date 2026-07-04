import * as Tone from 'tone';
import { TimeBlock, TimeSignature } from '../core/types';

export class AudioEngine {
  private static padSynth: Tone.PolySynth | null = null;
  private static bassSynth: Tone.PolySynth | null = null;
  private static kick: Tone.MembraneSynth | null = null;
  private static snare: Tone.NoiseSynth | null = null;
  private static hihat: Tone.MetalSynth | null = null;
  
  // El estado de los mutes se maneja directamente en los volúmenes,
  // por lo que no es necesario guardar un estado interno que TypeScript rechace.
  
  private static isSetup = false;
  private static isStarted = false;
  
  private static currentPart: Tone.Part | null = null;
  private static drumLoop: Tone.Loop | null = null;

  private static currentNum = 4;
  private static currentDen = 4;
  
  private static lastCallback: ((chordName: string | null, blockId: string) => void) | null = null;

  private static async setupInstruments() {
    if (this.isSetup) return;

    const reverb = new Tone.Reverb(1.2).toDestination();
    reverb.wet.value = 0.25;
    await reverb.ready; // Pre-calentar el Impulse Response para evitar lag en la primera reproducción
    const chorus = new Tone.Chorus(4, 2.5, 0.5).connect(reverb).start();

    this.padSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.5,
      modulationIndex: 2,
      oscillator: { type: "sine" },
      modulation: { type: "triangle" },
      envelope: { attack: 0.08, decay: 0.3, sustain: 0.7, release: 0.8 }
    }).connect(chorus);
    this.padSynth.volume.value = -12;

    this.bassSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1,
      modulationIndex: 1,
      oscillator: { type: "triangle" },
      modulation: { type: "sine" },
      envelope: { attack: 0.05, decay: 0.4, sustain: 0.8, release: 0.5 }
    }).toDestination();
    this.bassSynth.volume.value = -8;

    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
    }).toDestination();
    this.kick.volume.value = -6;

    this.snare = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0 }
    }).toDestination();
    this.snare.volume.value = -10;

    this.hihat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();
    this.hihat.frequency.value = 200;
    this.hihat.volume.value = -18;

    this.isSetup = true;
  }

  public static async startAudioContext() {
    await this.setupInstruments();
    if (!this.isStarted) {
      try {
        await Tone.start();
        this.isStarted = true;
      } catch (error) {
        // Fallback defensivo si el navegador bloquea el arranque asíncrono
        console.warn("FretLoop AudioEngine: Autoplay policy previno el inicio de Tone.js. Requiere interacción manual previa.", error);
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
    // Aplicar mutes al vuelo manipulando el volumen (-Infinity = silencio absoluto)
    if (this.padSynth) this.padSynth.volume.rampTo(keys ? -Infinity : -12, 0.1);
    if (this.bassSynth) this.bassSynth.volume.rampTo(bass ? -Infinity : -8, 0.1);
    if (this.kick) this.kick.volume.rampTo(drums ? -Infinity : -6, 0.1);
    if (this.snare) this.snare.volume.rampTo(drums ? -Infinity : -10, 0.1);
    if (this.hihat) this.hihat.volume.rampTo(drums ? -Infinity : -18, 0.1);
  }

  // Se llama dinámicamente si los bloques cambian mientras se reproduce
  public static updateSequence(blocks: TimeBlock[]) {
    if (!this.currentPart || !this.lastCallback) return;
    
    // Matar la partitura antigua, pero dejar el Transport y la batería corriendo
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
        // Teclado (Keys): Acorde en octavas 4 y 5
        const keysNotes = [
          ...value.chord.notes.map((n: string) => n + "4"),
          ...value.chord.notes.map((n: string) => n + "5")
        ];
        
        // Bajo (Bass): Tónica en octavas 1 y 2
        const bassNotes = [value.chord.root + "1", value.chord.root + "2"];
        
        this.padSynth?.triggerAttackRelease(keysNotes, value.duration, time);
        this.bassSynth?.triggerAttackRelease(bassNotes, value.duration, time);
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
    if (!this.padSynth || !this.kick || !this.snare || !this.hihat) return;

    this.stop();
    this.lastCallback = onChordChange;

    let eighthNoteCount = 0;
    
    this.drumLoop = new Tone.Loop((time) => {
      // Corcheas por compás: en X/4 son num*2, en X/8 son num directamente
      const eighthsPerMeasure = this.currentDen === 4 ? this.currentNum * 2 : this.currentNum;
      const step = eighthNoteCount % eighthsPerMeasure;

      // ── HI-HAT: Suena en TODAS las corcheas (8 por compás en 4/4) ──
      this.hihat?.triggerAttackRelease("32n", time, 0.3);

      // ── Patrón rítmico según el compás ──
      if (this.currentNum === 4 && this.currentDen === 4) {
        // 4/4 Estándar: Kick en 1 y 3, Snare en 2 y 4
        // step 0=beat1, 2=beat2, 4=beat3, 6=beat4
        if (step === 0 || step === 4) {
          this.kick?.triggerAttackRelease("C1", "8n", time, step === 0 ? 1 : 0.8);
        }
        if (step === 2 || step === 6) {
          this.snare?.triggerAttackRelease("16n", time, 1);
        }
      } else if (this.currentNum === 3 && this.currentDen === 4) {
        // 3/4 Vals: Kick en 1, Snare en 2 y 3
        if (step === 0) {
          this.kick?.triggerAttackRelease("C1", "8n", time, 1);
        }
        if (step === 2 || step === 4) {
          this.snare?.triggerAttackRelease("16n", time, 0.7);
        }
      } else if (this.currentNum === 6 && this.currentDen === 8) {
        // 6/8: Kick en 1 y 4, Snare en 4
        if (step === 0) {
          this.kick?.triggerAttackRelease("C1", "8n", time, 1);
        }
        if (step === 3) {
          this.kick?.triggerAttackRelease("C1", "8n", time, 0.6);
          this.snare?.triggerAttackRelease("16n", time, 0.8);
        }
      } else {
        // Fallback genérico: Kick en 1, Snare en la mitad del compás
        if (step === 0) {
          this.kick?.triggerAttackRelease("C1", "8n", time, 1);
        }
        if (step === Math.floor(eighthsPerMeasure / 2)) {
          this.snare?.triggerAttackRelease("16n", time, 1);
        }
      }
      
      eighthNoteCount++;
    }, "8n").start(0);

    // Reutilizamos la lógica de inyección de bloques
    this.currentPart = new Tone.Part<any>(() => {}, []).start(0); 
    this.updateSequence(blocks);

    Tone.Transport.start("+0.01");
  }

  public static stop() {
    Tone.Transport.stop();
    // Corte inmediato: matar todas las notas activas
    this.padSynth?.releaseAll();
    this.bassSynth?.releaseAll();
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
