import { Chord, Key, Scale, Note } from "tonal";
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

    const detection = this.detectTonalCenter(chords);
    const primaryRoot = detection.root;
    const isMinor = detection.isMinor;
    
    let globalKey = `${primaryRoot} ${isMinor ? 'Menor' : 'Mayor'}`;
    let lesson: TheoryLesson | null = null;

    let borrowedWarning = "";
    if (detection.borrowedChords.length > 0) {
      const names = Array.from(new Set(detection.borrowedChords.map(c => c.name))).join(", ");
      borrowedWarning = `\n\n⚠️ Préstamo Modal: Los acordes [${names}] contienen notas fuera de ${globalKey}. Generarán una tensión deliciosa si los respetas. Durante esos acordes, evita tocar notas a ciegas en la escala y enfócate en sus "puntos rojos y azules" (arpegio).`;
    }

    if (!isMinor) {
      const keyInfo = Key.majorKey(primaryRoot);
      const relativeMinorRoot = keyInfo.minorRelative;
      
      lesson = {
        tonalCenter: globalKey,
        explanation: `Tu centro tonal es ${primaryRoot} Mayor. Para expandir tu vocabulario horizontal y romper la clásica "caja" vertical, visualiza la carretera de notas a lo largo de una sola cuerda en lugar de cruzar seis. Conecta la Tónica, la 3ra y la 5ta deslizando (slides) el dedo índice o anular por el mástil. Al cambiar el acorde, las notas en rojo (Raíz) y azul (3ra y 5ta) te indicarán exactamente dónde puedes "descansar" (resolver) tu fraseo con total seguridad.${borrowedWarning}`,
        scaleSuggestions: [
          {
            id: 'major-penta',
            name: `Penta Mayor (${primaryRoot})`,
            scaleName: `${primaryRoot} major pentatonic`,
            notes: Scale.get(`${primaryRoot} major pentatonic`).notes,
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
            scaleName: `${primaryRoot} major`,
            notes: Scale.get(`${primaryRoot} major`).notes,
            description: "Las 7 notas. Usa los semitonos como puentes de paso rápidos."
          },
          {
            id: 'mixolydian-mode',
            name: `Modo Mixolidio (Disruptiva)`,
            scaleName: `${primaryRoot} mixolydian`,
            notes: Scale.get(`${primaryRoot} mixolydian`).notes,
            description: "Sonido Blues/Funk. Tiene la 7ma menor. Úsala para un groove más sucio."
          },
          {
            id: 'lydian-mode',
            name: `Modo Lidio (Disruptiva)`,
            scaleName: `${primaryRoot} lydian`,
            notes: Scale.get(`${primaryRoot} lydian`).notes,
            description: "Sonido onírico/Jazz. Tiene la 4ta aumentada. Muy mística y flotante."
          },
          {
            id: 'major-blues',
            name: `Blues Mayor (Country/Rock)`,
            scaleName: `${primaryRoot} major blues`,
            notes: Scale.get(`${primaryRoot} major blues`).notes,
            description: "Añade la \"Blue note\" (b3) a la penta mayor. El secreto del country y el rock sureño."
          }
        ]
      };
    } else {
      const keyInfo = Key.minorKey(primaryRoot);
      const relativeMajorRoot = keyInfo.relativeMajor;

      lesson = {
        tonalCenter: globalKey,
        explanation: `Tu centro es ${primaryRoot} Menor. No te quedes atrapado en la posición 1 de la pentatónica. Oblígate a tocar un solo usando únicamente las cuerdas Sol (G) y Si (B), moviéndote horizontalmente por los trastes. Fíjate en los puntos rojos y azules: son las notas fuertes del acorde que suena en este instante. Terminar una línea melódica en una nota azul (la tercera del acorde) justo en el tiempo fuerte del compás te dará un sonido inmensamente profesional.${borrowedWarning}`,
        scaleSuggestions: [
          {
            id: 'minor-penta',
            name: `Penta Menor (${primaryRoot}m)`,
            scaleName: `${primaryRoot} minor pentatonic`,
            notes: Scale.get(`${primaryRoot} minor pentatonic`).notes,
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
            scaleName: `${primaryRoot} minor`,
            notes: Scale.get(`${primaryRoot} minor`).notes,
            description: "Escala completa. Esas dos notas extra te permiten hacer melodías dramáticas."
          },
          {
            id: 'dorian-mode',
            name: `Modo Dórico (Disruptiva)`,
            scaleName: `${primaryRoot} dorian`,
            notes: Scale.get(`${primaryRoot} dorian`).notes,
            description: "Sabor Jazz/Funk oscuro. Sube la 6ta. Perfecto para grooves largos."
          },
          {
            id: 'phrygian-mode',
            name: `Modo Frigio (Disruptiva)`,
            scaleName: `${primaryRoot} phrygian`,
            notes: Scale.get(`${primaryRoot} phrygian`).notes,
            description: "Metal oscuro o Flamenco. Baja la 2da. Muy tensa y agresiva."
          },
          {
            id: 'minor-blues',
            name: `Blues Menor (Rock/Metal)`,
            scaleName: `${primaryRoot} minor blues`,
            notes: Scale.get(`${primaryRoot} minor blues`).notes,
            description: "Añade la \"Blue note\" (b5) a la pentatónica. Tensión sucia ideal para rock clásico."
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
