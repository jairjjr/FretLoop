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
      intervals: chordInfo.intervals,
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
        explanation: `Tu centro tonal es ${primaryChord.root} Mayor. Para expandir tu vocabulario horizontal y romper la clásica "caja" vertical, visualiza la carretera de notas a lo largo de una sola cuerda en lugar de cruzar seis. Conecta la Tónica, la 3ra y la 5ta deslizando (slides) el dedo índice o anular por el mástil. Al cambiar el acorde, las notas en rojo (Raíz) y azul (3ra y 5ta) te indicarán exactamente dónde puedes "descansar" (resolver) tu fraseo con total seguridad.`,
        scaleSuggestions: [
          {
            id: 'major-penta',
            name: `Penta Mayor (${primaryChord.root})`,
            scaleName: `${primaryChord.root} major pentatonic`,
            notes: Scale.get(`${primaryChord.root} major pentatonic`).notes,
            description: "Clásica y segura. Toca horizontalmente uniendo 2 cajas vecinas."
          },
          {
            id: 'relative-minor-penta',
            name: `Penta Relativa (${relativeMinorRoot}m)`,
            scaleName: `${relativeMinorRoot} minor pentatonic`,
            notes: Scale.get(`${relativeMinorRoot} minor pentatonic`).notes,
            description: "Atajo mental rockero. Desliza sobre las cuerdas agudas."
          },
          {
            id: 'major-scale',
            name: `Escala Mayor (Jónica)`,
            scaleName: `${primaryChord.root} major`,
            notes: Scale.get(`${primaryChord.root} major`).notes,
            description: "Las 7 notas. Usa los semitonos como puentes de paso rápidos."
          },
          {
            id: 'mixolydian-mode',
            name: `Modo Mixolidio (Disruptiva)`,
            scaleName: `${primaryChord.root} mixolydian`,
            notes: Scale.get(`${primaryChord.root} mixolydian`).notes,
            description: "Sonido Blues/Funk. Tiene la 7ma menor. Úsala para un groove más sucio."
          },
          {
            id: 'lydian-mode',
            name: `Modo Lidio (Disruptiva)`,
            scaleName: `${primaryChord.root} lydian`,
            notes: Scale.get(`${primaryChord.root} lydian`).notes,
            description: "Sonido onírico/Jazz. Tiene la 4ta aumentada. Muy mística y flotante."
          },
          {
            id: 'major-blues',
            name: `Blues Mayor (Country/Rock)`,
            scaleName: `${primaryChord.root} major blues`,
            notes: Scale.get(`${primaryChord.root} major blues`).notes,
            description: "Añade la \"Blue note\" (b3) a la penta mayor. El secreto del country y el rock sureño."
          }
        ]
      };
    } else {
      const keyInfo = Key.minorKey(primaryChord.root);
      const relativeMajorRoot = keyInfo.relativeMajor;

      lesson = {
        tonalCenter: globalKey,
        explanation: `Tu centro es ${primaryChord.root} Menor. No te quedes atrapado en la posición 1 de la pentatónica. Oblígate a tocar un solo usando únicamente las cuerdas Sol (G) y Si (B), moviéndote horizontalmente por los trastes. Fíjate en los puntos rojos y azules: son las notas fuertes del acorde que suena en este instante. Terminar una línea melódica en una nota azul (la tercera del acorde) justo en el tiempo fuerte del compás te dará un sonido inmensamente profesional.`,
        scaleSuggestions: [
          {
            id: 'minor-penta',
            name: `Penta Menor (${primaryChord.root}m)`,
            scaleName: `${primaryChord.root} minor pentatonic`,
            notes: Scale.get(`${primaryChord.root} minor pentatonic`).notes,
            description: "Tu base de Blues/Rock. Rompe la caja haciendo slides entre posiciones."
          },
          {
            id: 'relative-major-penta',
            name: `Penta Relativa (${relativeMajorRoot})`,
            scaleName: `${relativeMajorRoot} major pentatonic`,
            notes: Scale.get(`${relativeMajorRoot} major pentatonic`).notes,
            description: "Mismas notas, distinto enfoque. Piensa en melodías alegres sobre fondo oscuro."
          },
          {
            id: 'minor-scale',
            name: `Menor Natural (Eólica)`,
            scaleName: `${primaryChord.root} minor`,
            notes: Scale.get(`${primaryChord.root} minor`).notes,
            description: "Escala completa. Esas dos notas extra te permiten hacer melodías dramáticas."
          },
          {
            id: 'dorian-mode',
            name: `Modo Dórico (Disruptiva)`,
            scaleName: `${primaryChord.root} dorian`,
            notes: Scale.get(`${primaryChord.root} dorian`).notes,
            description: "Sabor Jazz/Funk oscuro. Sube la 6ta. Perfecto para grooves largos."
          },
          {
            id: 'phrygian-mode',
            name: `Modo Frigio (Disruptiva)`,
            scaleName: `${primaryChord.root} phrygian`,
            notes: Scale.get(`${primaryChord.root} phrygian`).notes,
            description: "Metal oscuro o Flamenco. Baja la 2da. Muy tensa y agresiva."
          },
          {
            id: 'minor-blues',
            name: `Blues Menor (Rock/Metal)`,
            scaleName: `${primaryChord.root} minor blues`,
            notes: Scale.get(`${primaryChord.root} minor blues`).notes,
            description: "Añade la nota \"Blue\" (b5) a la pentatónica. Tensión sucia ideal para rock clásico."
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
