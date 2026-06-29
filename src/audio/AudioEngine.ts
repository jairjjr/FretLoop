import * as Tone from 'tone';
import { TimeBlock, TimeSignature } from '../core/types';

export class AudioEngine {
  private static synth: Tone.PolySynth | null = null;
  private static clickSynth: Tone.MembraneSynth | null = null;
  private static isInitialized = false;
  private static currentPart: Tone.Part | null = null;
  private static clickLoop: Tone.Loop | null = null;

  public static async init() {
    if (this.isInitialized) return;
    await Tone.start();
    
    // Sintetizador para Acordes (Sonido suave tipo Rhodes/Pad)
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 1.5 }
    }).toDestination();
    this.synth.volume.value = -12;

    // Sintetizador para el "Kick" (Metrónomo)
    this.clickSynth = new Tone.MembraneSynth().toDestination();
    this.clickSynth.volume.value = -20;

    Tone.Transport.bpm.value = 120;
    this.isInitialized = true;
  }

  public static setTimeSignature(ts: TimeSignature) {
    const [num, den] = ts.split('/').map(Number);
    Tone.Transport.timeSignature = [num, den];
  }

  public static setBpm(bpm: number) {
    Tone.Transport.bpm.value = bpm;
  }

  public static playSequence(blocks: TimeBlock[], onChordChange: (chordName: string | null, blockId: string) => void) {
    if (!this.isInitialized || !this.synth || !this.clickSynth) return;

    this.stop();

    const ticksPerBeat = Tone.Time("4n").toTicks();

    // Metrónomo en bucle cada Beat (4n)
    this.clickLoop = new Tone.Loop((time) => {
      // Acentuamos el primer beat de cada compás
      const currentBeatStr = (Tone.Transport.position as string | number).toString();
      const isFirstBeat = currentBeatStr.includes(":0:0");
      this.clickSynth?.triggerAttackRelease(isFirstBeat ? "C2" : "C3", "8n", time, isFirstBeat ? 1 : 0.5);
    }, "4n").start(0);

    // Eventos de Acordes
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
        notesToPlay.push(value.chord.root + "3");
        this.synth?.triggerAttackRelease(notesToPlay, value.duration, time);
      }
      
      Tone.Draw.schedule(() => {
        onChordChange(value.chord ? value.chord.name : null, value.blockId);
      }, time);

    }, events).start(0);

    this.currentPart.loop = true;
    this.currentPart.loopEnd = totalLoopTicks + "i";

    Tone.Transport.start();
  }

  public static stop() {
    Tone.Transport.stop();
    if (this.currentPart) {
      this.currentPart.dispose();
      this.currentPart = null;
    }
    if (this.clickLoop) {
      this.clickLoop.dispose();
      this.clickLoop = null;
    }
    // Reiniciar posición
    Tone.Transport.position = 0;
  }
}
