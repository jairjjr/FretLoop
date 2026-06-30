export interface NoteData {
  name: string;
  octave?: number;
  midi?: number;
}

export interface ChordData {
  root: string;
  type: string;
  name: string;
  notes: string[];
  intervals: string[];
}

export interface TimeBlock {
  id: string;
  chord: ChordData | null;
  durationInBeats: number;
}

// NUEVO: Sugerencia de Escala Interactiva
export interface ScaleSuggestion {
  id: string;
  name: string; // ej. "Pentatónica Menor"
  scaleName: string; // Nombre interno de Tonal.js
  notes: string[];
  description: string;
}

// NUEVO: Lección Teórica
export interface TheoryLesson {
  tonalCenter: string;
  explanation: string;
  scaleSuggestions: ScaleSuggestion[];
}

export interface ProgressionAnalysis {
  globalKey: string;
  chords: ChordData[];
  lesson: TheoryLesson | null;
}

export type TuningName = "Standard" | "Half Step Down" | "Whole Step Down" | "Drop D";

export interface TuningDef {
  name: TuningName;
  strings: string[];
}

export const TUNINGS: Record<TuningName, TuningDef> = {
  "Standard": { name: "Standard", strings: ["E2", "A2", "D3", "G3", "B3", "E4"] },
  "Half Step Down": { name: "Half Step Down", strings: ["Eb2", "Ab2", "Db3", "Gb3", "Bb3", "Eb4"] },
  "Whole Step Down": { name: "Whole Step Down", strings: ["D2", "G2", "C3", "F3", "A3", "D4"] },
  "Drop D": { name: "Drop D", strings: ["D2", "A2", "D3", "G3", "B3", "E4"] },
};

export type TimeSignature = "3/4" | "4/4" | "5/4" | "6/8";
