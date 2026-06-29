// Representa una nota musical en el diapasón
export interface NoteData {
  name: string;        // ej. "C#", "Eb"
  octave?: number;     // ej. 4
  midi?: number;       // ej. 60
}

// Representa un acorde en la progresión
export interface ChordData {
  root: string;        // ej. "A"
  type: string;        // ej. "m7", "maj"
  name: string;        // ej. "Am7"
  notes: string[];     // Notas que lo componen: ["A", "C", "E", "G"]
}

// Representa un bloque de tiempo en el constructor de loops (Sequencer)
export interface TimeBlock {
  id: string;          // UUID único
  chord: ChordData | null; // null si es un silencio
  durationInBeats: number; // Duración (ej. 4 beats = 1 compás en 4/4)
}

// Representa el atajo pedagógico generado por el motor
export interface MentalShortcut {
  conceptName: string; 
  targetScale: string; 
  scaleNotes: string[];
  explanation: string; 
}

// Representa el análisis de una progresión completa
export interface ProgressionAnalysis {
  globalKey: string;             
  chords: ChordData[];           
  shortcut: MentalShortcut | null; 
}

// Opciones de Afinación
export type TuningName = "Standard" | "Half Step Down" | "Whole Step Down" | "Drop D";

export interface TuningDef {
  name: TuningName;
  strings: string[]; // de grave a aguda (ej. 6ta cuerda a 1ra cuerda)
}

export const TUNINGS: Record<TuningName, TuningDef> = {
  "Standard": { name: "Standard", strings: ["E2", "A2", "D3", "G3", "B3", "E4"] },
  "Half Step Down": { name: "Half Step Down", strings: ["Eb2", "Ab2", "Db3", "Gb3", "Bb3", "Eb4"] },
  "Whole Step Down": { name: "Whole Step Down", strings: ["D2", "G2", "C3", "F3", "A3", "D4"] },
  "Drop D": { name: "Drop D", strings: ["D2", "A2", "D3", "G3", "B3", "E4"] },
};

// Opciones de Compás (Time Signature)
export type TimeSignature = "3/4" | "4/4" | "5/4" | "6/8";
