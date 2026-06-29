import { Chord, Key, Scale } from "tonal";
import { ChordData, MentalShortcut, ProgressionAnalysis } from "./types";

export class TheoryEngine {
  /**
   * Procesa un string de acorde (ej. "Am7") y devuelve sus datos estructurados.
   */
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

  /**
   * Analiza una lista de acordes para detectar la tonalidad global 
   * y sugerir el mejor "Atajo Mental" para improvisar.
   */
  public static analyzeProgression(chordNames: string[]): ProgressionAnalysis {
    const chords = chordNames
      .map(this.parseChord)
      .filter((c): c is ChordData => c !== null);

    if (chords.length === 0) {
      return { globalKey: "Unknown", chords: [], shortcut: null };
    }

    // Heurística simple MVP: El primer acorde suele dictar la tonalidad.
    const primaryChord = chords[0];
    const isMinor = primaryChord.type.includes("m") && !primaryChord.type.includes("maj");
    
    let globalKey = `${primaryChord.root} ${isMinor ? 'Minor' : 'Major'}`;
    let shortcut: MentalShortcut | null = null;

    // Lógica Pedagógica: Atajos Mentales
    if (!isMinor) {
      // Si la tonalidad es Mayor, el atajo clásico de guitarra (Country/Soul)
      // es usar la Pentatónica de la Relativa Menor.
      const keyInfo = Key.majorKey(primaryChord.root);
      const relativeMinorRoot = keyInfo.minorRelative;
      
      const scaleName = `${relativeMinorRoot} minor pentatonic`;
      const scaleNotes = Scale.get(scaleName).notes;

      shortcut = {
        conceptName: `Pentatónica de la Relativa Menor (${relativeMinorRoot}m)`,
        targetScale: scaleName,
        scaleNotes: scaleNotes,
        explanation: `Para improvisar sobre una progresión en ${primaryChord.root} Mayor con un toque Soul/Blues, toca la pentatónica de ${relativeMinorRoot} menor. Comparte las mismas notas clave pero enfoca tu fraseo desde una perspectiva más familiar en el mástil.`
      };
    } else {
      // Si la tonalidad es Menor, sugerimos la Pentatónica Menor directamente 
      const scaleName = `${primaryChord.root} minor pentatonic`;
      const scaleNotes = Scale.get(scaleName).notes;

      shortcut = {
        conceptName: `Pentatónica Menor Base (${primaryChord.root}m)`,
        targetScale: scaleName,
        scaleNotes: scaleNotes,
        explanation: `Estás en una tonalidad menor. Tu "zona segura" es la Pentatónica de ${primaryChord.root} menor. Ubica las notas rojas (raíz) en el mástil como tu punto de anclaje.`
      };
    }

    return {
      globalKey,
      chords,
      shortcut
    };
  }
}
