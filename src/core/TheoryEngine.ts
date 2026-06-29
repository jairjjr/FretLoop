import { Chord, Key, Scale } from "tonal";
import { ChordData, ProgressionAnalysis, TheoryLesson } from "./types";

export class TheoryEngine {
  public static parseChord(chordName: string): ChordData | null {
    const chordInfo = Chord.get(chordName);
    if (chordInfo.empty) return null;

    return {
      root: chordInfo.tonic || "",
      type: chordInfo.type,
      name: chordInfo.name,
      notes: chordInfo.notes,
    };
  }

  public static analyzeProgression(chordNames: string[]): ProgressionAnalysis {
    const chords = chordNames
      .map(this.parseChord)
      .filter((c): c is ChordData => c !== null);

    if (chords.length === 0) {
      return { globalKey: "Unknown", chords: [], lesson: null };
    }

    // Heurística de Centro Tonal: nos basamos en el primer acorde de la secuencia
    const primaryChord = chords[0];
    const isMinor = primaryChord.type.includes("m") && !primaryChord.type.includes("maj");
    
    let globalKey = `${primaryChord.root} ${isMinor ? 'Menor' : 'Mayor'}`;
    let lesson: TheoryLesson | null = null;

    if (!isMinor) {
      const keyInfo = Key.majorKey(primaryChord.root);
      const relativeMinorRoot = keyInfo.minorRelative;
      
      lesson = {
        tonalCenter: globalKey,
        explanation: `Analizando toda la secuencia, tu "Centro Tonal" (el hogar de la canción) es ${primaryChord.root} Mayor. Puedes usar la escala mayor completa para un sonido heroico o feliz, pero el atajo mental clásico del Rock y Soul es pensar en la pentatónica de su relativa menor (${relativeMinorRoot}m).`,
        scaleSuggestions: [
          {
            id: 'major-penta',
            name: `Penta ${primaryChord.root} Mayor`,
            scaleName: `${primaryChord.root} major pentatonic`,
            notes: Scale.get(`${primaryChord.root} major pentatonic`).notes,
            description: "Sonido clásico, alegre y muy seguro."
          },
          {
            id: 'relative-minor-penta',
            name: `Penta ${relativeMinorRoot} Menor (Atajo)`,
            scaleName: `${relativeMinorRoot} minor pentatonic`,
            notes: Scale.get(`${relativeMinorRoot} minor pentatonic`).notes,
            description: "Mismas notas que la mayor, pero con una forma visual más rock/blues."
          },
          {
            id: 'major-scale',
            name: `Escala ${primaryChord.root} Mayor (Jónica)`,
            scaleName: `${primaryChord.root} major`,
            notes: Scale.get(`${primaryChord.root} major`).notes,
            description: "Escala completa con 7 notas. Perfecta para melodías ricas."
          }
        ]
      };
    } else {
      const keyInfo = Key.minorKey(primaryChord.root);
      const relativeMajorRoot = keyInfo.relativeMajor;

      lesson = {
        tonalCenter: globalKey,
        explanation: `Estás navegando en una tonalidad Menor (${primaryChord.root}m). La pentatónica menor es tu territorio seguro e infalible. Si quieres darle un giro más brillante a tu solo, piensa en su relativa mayor (${relativeMajorRoot}).`,
        scaleSuggestions: [
          {
            id: 'minor-penta',
            name: `Penta ${primaryChord.root} Menor`,
            scaleName: `${primaryChord.root} minor pentatonic`,
            notes: Scale.get(`${primaryChord.root} minor pentatonic`).notes,
            description: "Tu zona de confort clásica. Triste, rockera o bluesera."
          },
          {
            id: 'minor-scale',
            name: `Escala ${primaryChord.root} Menor Natural`,
            scaleName: `${primaryChord.root} minor`,
            notes: Scale.get(`${primaryChord.root} minor`).notes,
            description: "Escala completa con 7 notas. Ideal para pasajes épicos o melancólicos."
          },
          {
            id: 'relative-major-penta',
            name: `Penta ${relativeMajorRoot} Mayor (Atajo)`,
            scaleName: `${relativeMajorRoot} major pentatonic`,
            notes: Scale.get(`${relativeMajorRoot} major pentatonic`).notes,
            description: "Un respiro alegre. Mismas notas, distinto enfoque en el diapasón."
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
}
