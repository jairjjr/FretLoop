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
  chord: ChordData;
  durationInBeats: number; // Duración (ej. 4 beats = 1 compás en 4/4)
  startTime: number;   // Tiempo de inicio relativo al loop
}

// Representa el atajo pedagógico generado por el motor
export interface MentalShortcut {
  conceptName: string; // ej. "Relativa Menor Pentatónica"
  targetScale: string; // ej. "F# minor pentatonic"
  scaleNotes: string[];// ["F#", "A", "B", "C#", "E"]
  explanation: string; // Explicación pedagógica para el usuario
}

// Representa el análisis de una progresión completa
export interface ProgressionAnalysis {
  globalKey: string;             // Tonalidad detectada (ej. "A Major")
  chords: ChordData[];           // Acordes analizados
  shortcut: MentalShortcut | null; // El atajo sugerido
}
