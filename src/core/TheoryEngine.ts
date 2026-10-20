import { Chord, Key, Scale, Note, Interval } from "tonal";
import { ChordData, ProgressionAnalysis, TheoryLesson, ProgressionPreset } from "./types";

export const PROGRESSION_PRESETS: ProgressionPreset[] = [
  {
    id: "pop-classic",
    name: "Pop Rock (I - V - vi - IV)",
    genre: "Pop / Rock",
    description: "Estructura armónica elemental para improvisación diatónica fluida.",
    timeSignature: "4/4",
    bpm: 120,
    chords: [
      { chordName: "C", bars: 1 },
      { chordName: "G", bars: 1 },
      { chordName: "Am", bars: 1 },
      { chordName: "F", bars: 1 }
    ]
  },
  {
    id: "jazz-cadence",
    name: "Jazz Standard (ii - V - I - VI)",
    genre: "Jazz",
    description: "Cadencia fundamental con dominante secundaria para resolución melódica.",
    timeSignature: "4/4",
    bpm: 110,
    chords: [
      { chordName: "Dm7", bars: 1 },
      { chordName: "G7", bars: 1 },
      { chordName: "Cmaj7", bars: 1 },
      { chordName: "A7", bars: 1 }
    ]
  },
  {
    id: "andalusian-cadence",
    name: "Cadencia Andaluza (i - bVII - bVI - V)",
    genre: "Flamenco / Rock",
    description: "Descenso armónico tradicional con tensión cadencial hacia el V grado.",
    timeSignature: "4/4",
    bpm: 100,
    chords: [
      { chordName: "Am", bars: 1 },
      { chordName: "G", bars: 1 },
      { chordName: "F", bars: 1 },
      { chordName: "E", bars: 1 }
    ]
  },
  {
    id: "blues-shuffle",
    name: "Blues Clásico (I7 - IV7 - V7)",
    genre: "Blues",
    description: "Base de dominantes con blue notes sobre escalas pentatónicas.",
    timeSignature: "4/4",
    bpm: 95,
    chords: [
      { chordName: "A7", bars: 2 },
      { chordName: "D7", bars: 1 },
      { chordName: "A7", bars: 1 },
      { chordName: "E7", bars: 1 },
      { chordName: "D7", bars: 1 }
    ]
  },
  {
    id: "neo-soul-groove",
    name: "Neo-Soul Groove (i7 - iv7 - bVII - v7)",
    genre: "Neo-Soul",
    description: "Tensiones de 7ma y extensiones para desarrollo melódico horizontal.",
    timeSignature: "4/4",
    bpm: 88,
    chords: [
      { chordName: "Dm7", bars: 1 },
      { chordName: "Gm7", bars: 1 },
      { chordName: "C7", bars: 1 },
      { chordName: "Am7", bars: 1 }
    ]
  }
];

export class TheoryEngine {
  public static parseChord(chordName: string): ChordData | null {
    const chordInfo = Chord.get(chordName);
    if (chordInfo.empty) return null;

    return {
      root: chordInfo.tonic || "",
      type: chordInfo.type,
      name: chordInfo.name,
      notes: chordInfo.notes,
      intervals: chordInfo.intervals,
    };
  }

  public static getRomanNumeral(tonic: string, chord: ChordData): { roman: string; func: string } {
    try {
      const distance = Interval.distance(tonic, chord.root);
      const semitones = (Interval.semitones(distance) % 12 + 12) % 12;
      
      const isMinorType = chord.type.includes("m") && !chord.type.includes("maj");
      const isDiminished = chord.type.includes("dim") || chord.type.includes("m7b5");

      const intervalMap: Record<number, { upper: string; lower: string; defaultFunc: string }> = {
        0: { upper: "I", lower: "i", defaultFunc: "Tónica" },
        1: { upper: "bII", lower: "bii", defaultFunc: "Préstamo modal" },
        2: { upper: "II", lower: "ii", defaultFunc: "Subdominante" },
        3: { upper: "bIII", lower: "biii", defaultFunc: "Préstamo modal" },
        4: { upper: "III", lower: "iii", defaultFunc: "Tónica secundaria" },
        5: { upper: "IV", lower: "iv", defaultFunc: "Subdominante" },
        6: { upper: "bV", lower: "bv", defaultFunc: "Paso cromático" },
        7: { upper: "V", lower: "v", defaultFunc: "Dominante" },
        8: { upper: "bVI", lower: "bvi", defaultFunc: "Préstamo modal" },
        9: { upper: "VI", lower: "vi", defaultFunc: "Tónica relativa" },
        10: { upper: "bVII", lower: "bvii", defaultFunc: "Subdominante modal" },
        11: { upper: "VII", lower: "vii", defaultFunc: "Dominante" },
      };

      const entry = intervalMap[semitones] || { upper: "I", lower: "i", defaultFunc: "Tónica" };
      let base = (isMinorType || isDiminished) ? entry.lower : entry.upper;
      if (isDiminished) base += "°";

      // Añadir indicador de 7ma si el tipo lo contiene
      if (chord.type === "7") base += "7";
      else if (chord.type === "maj7") base += "maj7";
      else if (chord.type === "m7") base += "7";

      return { roman: base, func: entry.defaultFunc };
    } catch {
      return { roman: chord.name, func: "Armonía" };
    }
  }

  public static analyzeProgression(chordNames: string[]): ProgressionAnalysis {
    const rawChords = chordNames
      .map(this.parseChord)
      .filter((c): c is ChordData => c !== null);

    if (rawChords.length === 0) {
      return { globalKey: "Sin datos", chords: [], lesson: null };
    }

    const detection = this.detectTonalCenter(rawChords);
    const primaryRoot = detection.root;
    const isMinor = detection.isMinor;
    
    // Asignar grados romanos calculados en relación al centro tonal
    const chords = rawChords.map(c => {
      const { roman, func } = this.getRomanNumeral(primaryRoot, c);
      return {
        ...c,
        romanNumeral: roman,
        harmonicFunction: func
      };
    });

    const globalKey = `${primaryRoot} ${isMinor ? 'Menor' : 'Mayor'}`;
    let lesson: TheoryLesson | null = null;

    let borrowedWarning = "";
    if (detection.borrowedChords.length > 0) {
      const names = Array.from(new Set(detection.borrowedChords.map(c => c.name))).join(", ");
      borrowedWarning = `\n\nPréstamo modal: Los acordes [${names}] introducen notas cromáticas fuera del marco de ${globalKey}. Al transitar por ellos, utiliza los puntos destacados en rojo (raíz) y azul (quinta) del diapasón para resolver el fraseo con precisión armónica.`;
    }

    if (!isMinor) {
      const keyInfo = Key.majorKey(primaryRoot);
      const relativeMinorRoot = keyInfo.minorRelative;
      
      lesson = {
        tonalCenter: globalKey,
        explanation: `El centro armónico gravita en torno a ${primaryRoot} Mayor. Para evitar estancarte en una única posición estática, conecta la tónica, tercera y quinta deslizando a lo largo de una misma cuerda. Las notas en rojo identifican la raíz y las azules marcan los descansos consonantes de quinta justa.${borrowedWarning}`,
        scaleSuggestions: [
          {
            id: 'major-penta',
            name: `Pentatónica Mayor (${primaryRoot})`,
            scaleName: `${primaryRoot} major pentatonic`,
            notes: Scale.get(`${primaryRoot} major pentatonic`).notes,
            description: "Consonancia directa y segura para conectar cajas adyacentes horizontalmente."
          },
          {
            id: 'relative-minor-penta',
            name: `Pentatónica Relativa (${relativeMinorRoot}m)`,
            scaleName: `${relativeMinorRoot} minor pentatonic`,
            notes: Scale.get(`${relativeMinorRoot} minor pentatonic`).notes,
            description: "Perspectiva melódica sobre las mismas notas con resolución en registros agudos."
          },
          {
            id: 'major-scale',
            name: `Escala Mayor (Jónica)`,
            scaleName: `${primaryRoot} major`,
            notes: Scale.get(`${primaryRoot} major`).notes,
            description: "Espectro diatónico completo de 7 notas para enlaces de semitono."
          },
          {
            id: 'mixolydian-mode',
            name: `Modo Mixolidio`,
            scaleName: `${primaryRoot} mixolydian`,
            notes: Scale.get(`${primaryRoot} mixolydian`).notes,
            description: "Incorpora la séptima menor para cadencias dominantes y acento blues-rock."
          },
          {
            id: 'lydian-mode',
            name: `Modo Lidio`,
            scaleName: `${primaryRoot} lydian`,
            notes: Scale.get(`${primaryRoot} lydian`).notes,
            description: "Cuarta aumentada para generar una atmósfera armónica expansiva y moderna."
          },
          {
            id: 'major-blues',
            name: `Blues Mayor`,
            scaleName: `${primaryRoot} major blues`,
            notes: Scale.get(`${primaryRoot} major blues`).notes,
            description: "Añade la tercera menor como nota de paso cromática hacia la tercera mayor."
          }
        ]
      };
    } else {
      const keyInfo = Key.minorKey(primaryRoot);
      const relativeMajorRoot = keyInfo.relativeMajor;

      lesson = {
        tonalCenter: globalKey,
        explanation: `El centro armónico gravita en torno a ${primaryRoot} Menor. Para construir solos estructurados, ubica los tonos guía en el diapasón: la raíz (rojo) y la quinta (azul). Finalizar una frase melódica en tiempo fuerte sobre estas notas ancla la sonoridad con máxima solidez.${borrowedWarning}`,
        scaleSuggestions: [
          {
            id: 'minor-penta',
            name: `Pentatónica Menor (${primaryRoot}m)`,
            scaleName: `${primaryRoot} minor pentatonic`,
            notes: Scale.get(`${primaryRoot} minor pentatonic`).notes,
            description: "Base clásica de blues y rock con articulación fluida entre trastes."
          },
          {
            id: 'relative-major-penta',
            name: `Pentatónica Relativa (${relativeMajorRoot})`,
            scaleName: `${relativeMajorRoot} major pentatonic`,
            notes: Scale.get(`${relativeMajorRoot} major pentatonic`).notes,
            description: "Color melódico más abierto sobre una base rítmica menor."
          },
          {
            id: 'minor-scale',
            name: `Menor Natural (Eólica)`,
            scaleName: `${primaryRoot} minor`,
            notes: Scale.get(`${primaryRoot} minor`).notes,
            description: "Estructura diatónica menor completa con tensiones de segunda y sexta."
          },
          {
            id: 'dorian-mode',
            name: `Modo Dórico`,
            scaleName: `${primaryRoot} dorian`,
            notes: Scale.get(`${primaryRoot} dorian`).notes,
            description: "Sexta mayor para un carácter sofisticado y brillante dentro del ámbito menor."
          },
          {
            id: 'phrygian-mode',
            name: `Modo Frigio`,
            scaleName: `${primaryRoot} phrygian`,
            notes: Scale.get(`${primaryRoot} phrygian`).notes,
            description: "Segunda menor tensa para acentos de raíz flamenca o metal progresivo."
          },
          {
            id: 'minor-blues',
            name: `Blues Menor`,
            scaleName: `${primaryRoot} minor blues`,
            notes: Scale.get(`${primaryRoot} minor blues`).notes,
            description: "Quinta disminuida como puente cromático entre el cuarto y quinto grado."
          }
        ]
      };
    }

    return {
      globalKey,
      chords,
      lesson
    };
  }

  private static detectTonalCenter(chords: ChordData[]): { root: string, isMinor: boolean, borrowedChords: ChordData[] } {
    const chordChromas = chords.map(c => {
      const chromas = new Set<number>();
      c.notes.forEach(n => {
        const chroma = Note.chroma(n);
        if (chroma !== undefined) chromas.add(chroma);
      });
      return Array.from(chromas);
    });

    const roots = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    let bestScore = -Infinity;
    let bestCandidates: { root: string, isMinor: boolean }[] = [];

    roots.forEach(root => {
      [false, true].forEach(isMinor => {
        const scaleNotes = isMinor ? Key.minorKey(root).natural.scale : Key.majorKey(root).scale;
        const scaleChromas = new Set<number>();
        scaleNotes.forEach(n => {
          const c = Note.chroma(n);
          if (c !== undefined) scaleChromas.add(c);
        });

        let score = 0;
        chordChromas.forEach(notes => {
          notes.forEach(c => {
            if (scaleChromas.has(c)) score += 1;
            else score -= 1;
          });
        });

        const firstChordChroma = Note.chroma(chords[0].root);
        const lastChordChroma = Note.chroma(chords[chords.length - 1].root);
        const rootChroma = Note.chroma(root);

        let tiebreaker = 0;
        if (rootChroma === firstChordChroma) tiebreaker += 0.5;
        if (rootChroma === lastChordChroma) tiebreaker += 0.2;
        
        const firstChordIsMinor = chords[0].type.includes("m") && !chords[0].type.includes("maj");
        if (isMinor === firstChordIsMinor) tiebreaker += 0.1;

        const finalScore = score + tiebreaker;

        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestCandidates = [{ root, isMinor }];
        } else if (finalScore === bestScore) {
          bestCandidates.push({ root, isMinor });
        }
      });
    });

    const winner = bestCandidates[0] || { root: chords[0].root, isMinor: chords[0].type.includes("m") };

    const winningScaleNotes = winner.isMinor ? Key.minorKey(winner.root).natural.scale : Key.majorKey(winner.root).scale;
    const winningScaleChromas = new Set<number>();
    winningScaleNotes.forEach(n => {
      const c = Note.chroma(n);
      if (c !== undefined) winningScaleChromas.add(c);
    });

    const borrowedChords = chords.filter(c => {
      let isBorrowed = false;
      c.notes.forEach(n => {
        const chroma = Note.chroma(n);
        if (chroma !== undefined && !winningScaleChromas.has(chroma)) {
          isBorrowed = true;
        }
      });
      return isBorrowed;
    });

    return { ...winner, borrowedChords };
  }
}

