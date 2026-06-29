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

  // 1. Configuración perezosa en memoria (Sin pedir permisos al navegador aún)
  private static setupInstruments() {
    if (this.isSetup) return;

    // Efectos Globales
    const reverb = new Tone.Reverb(2.5).toDestination();
    reverb.wet.value = 0.3;
    const chorus = new Tone.Chorus(4, 2.5, 0.5).connect(reverb).start();

    // Pad Armónico Lujoso (FMSynth)
    this.padSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.5,
      modulationIndex: 2,
      oscillator: { type: "sine" },
      modulation: { type: "triangle" },
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 2 }
    }).connect(chorus);
    this.padSynth.volume.value = -12;

    // Drum Machine: Kick (Bombo)
    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
    }).toDestination();
    this.kick.volume.value = -6;

    // Drum Machine: Snare (Caja)
    this.snare = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0 }
    }).toDestination();
    this.snare.volume.value = -10;

    // Drum Machine: HiHat (Platillo)
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

  // 2. Arranque oficial (Requiere Clic del Usuario para no ser bloqueado)
  public static async startAudioContext() {
    this.setupInstruments(); // Construye en memoria si no existen
    if (!this.isStarted) {
      await Tone.start(); // Esto es instantáneo si ya hubo interacción
      this.isStarted = true;
    }
  }

  public static setTimeSignature(ts: TimeSignature) {
    const [num, den] = ts.split('/').map(Number);
    Tone.Transport.timeSignature = [num, den];
  }

  public static setBpm(bpm: number) {
    Tone.Transport.bpm.value = bpm;
  }

  public static async playSequence(blocks: TimeBlock[], onChordChange: (chordName: string | null, blockId: string) => void) {
    // Activamos AudioContext AQUÍ, de forma segura, respondiendo al clic
    await this.startAudioContext();
    if (!this.padSynth || !this.kick || !this.snare || !this.hihat) return;

    this.stop();

    const ticksPerBeat = Tone.Time("4n").toTicks();
    
    // Configurar patrón de batería básico (Rock/Pop clásico 4/4)
    // Tocaremos usando un Loop que se alinea a corcheas (8n)
    let eighthNoteCount = 0;
    this.drumLoop = new Tone.Loop((time) => {
      // 0, 1, 2, 3, 4, 5, 6, 7 (8 corcheas = 1 compás de 4/4)
      const isDownbeat = eighthNoteCount % 8 === 0; // Tiempo 1
      const isBackbeat = eighthNoteCount % 8 === 4; // Tiempo 3 (caja fuerte)
      const isKickSub = eighthNoteCount % 8 === 5; // Bombo adelantado opcional
      
      // Hihat toca en casi todas las corcheas
      if (eighthNoteCount % 2 === 0 || eighthNoteCount % 8 === 3) {
        this.hihat?.triggerAttackRelease("32n", time, 0.3);
      }

      if (isDownbeat || isKickSub) {
        this.kick?.triggerAttackRelease("C1", "8n", time, isDownbeat ? 1 : 0.6);
      }
      
      if (isBackbeat) {
        this.snare?.triggerAttackRelease("16n", time, 1);
      }
      
      eighthNoteCount++;
    }, "8n").start(0);

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
        // Voicing abierto para un Pad lujoso
        const notesToPlay = value.chord.notes.map((n: string) => n + "4");
        // Añadimos el bajo muy grave para dar profundidad
        notesToPlay.push(value.chord.root + "2");
        notesToPlay.push(value.chord.root + "3");
        
        this.padSynth?.triggerAttackRelease(notesToPlay, value.duration, time);
      }
      
      Tone.Draw.schedule(() => {
        onChordChange(value.chord ? value.chord.name : null, value.blockId);
      }, time);

    }, events).start(0);

    this.currentPart.loop = true;
    this.currentPart.loopEnd = totalLoopTicks + "i";

    // Iniciamos con una pequeñísima latencia para darle tiempo al scheduler y evitar tirones
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
    Tone.Transport.position = 0;
  }
}
