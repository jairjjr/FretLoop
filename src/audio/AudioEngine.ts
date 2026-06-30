import * as Tone from 'tone';
import { TimeBlock, TimeSignature } from '../core/types';

export class AudioEngine {
  private static padSynth: Tone.PolySynth | null = null;
  private static kick: Tone.MembraneSynth | null = null;
  private static snare: Tone.NoiseSynth | null = null;
  private static hihat: Tone.MetalSynth | null = null;
  
  private static isSetup = false;
  private static isStarted = false;
  
  private static currentPart: Tone.Part | null = null;
  private static drumLoop: Tone.Loop | null = null;

  private static currentNum = 4;
  private static currentDen = 4;
  
  private static lastCallback: ((chordName: string | null, blockId: string) => void) | null = null;

  private static setupInstruments() {
    if (this.isSetup) return;

    const reverb = new Tone.Reverb(2.5).toDestination();
    reverb.wet.value = 0.3;
    const chorus = new Tone.Chorus(4, 2.5, 0.5).connect(reverb).start();

    this.padSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.5,
      modulationIndex: 2,
      oscillator: { type: "sine" },
      modulation: { type: "triangle" },
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 2 }
    }).connect(chorus);
    this.padSynth.volume.value = -12;

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
    this.setupInstruments();
    if (!this.isStarted) {
      await Tone.start();
      this.isStarted = true;
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
        const notesToPlay = value.chord.notes.map((n: string) => n + "4");
        notesToPlay.push(value.chord.root + "2");
        notesToPlay.push(value.chord.root + "3");
        this.padSynth?.triggerAttackRelease(notesToPlay, value.duration, time);
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
      const eighthsPerMeasure = this.currentDen === 4 ? this.currentNum * 2 : this.currentNum;
      const step = eighthNoteCount % eighthsPerMeasure;
      const isDownbeat = step === 0;
      
      // Inteligencia rítmica adaptada al compás (Time Signature)
      let isBackbeat = false;
      if (this.currentNum === 4 && this.currentDen === 4) isBackbeat = (step === 4);
      else if (this.currentNum === 3 && this.currentDen === 4) isBackbeat = (step === 2 || step === 4); // Vals moderno
      else if (this.currentNum === 5 && this.currentDen === 4) isBackbeat = (step === 4 || step === 8); // Polirritmia 5/4
      else if (this.currentNum === 6 && this.currentDen === 8) isBackbeat = (step === 3); // 6/8
      else isBackbeat = (step === Math.floor(eighthsPerMeasure / 2));

      // Groove
      if (eighthNoteCount % 2 === 0 || step === eighthsPerMeasure - 1) {
        this.hihat?.triggerAttackRelease("32n", time, 0.3);
      }

      // El bombo apoya la tónica
      if (isDownbeat || step === eighthsPerMeasure - 3) {
        this.kick?.triggerAttackRelease("C1", "8n", time, isDownbeat ? 1 : 0.6);
      }
      
      if (isBackbeat) {
        this.snare?.triggerAttackRelease("16n", time, 1);
      }
      
      eighthNoteCount++;
    }, "8n").start(0);

    // Reutilizamos la lógica de inyección de bloques
    this.currentPart = new Tone.Part<any>(() => {}, []).start(0); 
    this.updateSequence(blocks);

    Tone.Transport.start("+0.1");
  }

  public static stop() {
    Tone.Transport.stop();
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
