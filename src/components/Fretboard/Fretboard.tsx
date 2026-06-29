import React, { useMemo } from 'react';
import { Note, Interval } from 'tonal';
import { TuningDef } from '../../core/types';

interface FretboardProps {
  tuning: TuningDef;
  rootNote: string | null;
  activeNotes: string[]; // Chord tones (Azul)
  scaleNotes: string[];  // Passing notes (Amarillo)
}

const FRET_COUNT = 22;
const STRING_COUNT = 6;

export const Fretboard: React.FC<FretboardProps> = ({ tuning, rootNote, activeNotes, scaleNotes }) => {
  // Configuración visual
  const width = 1000;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;
  
  const stringSpacing = (height - 2 * paddingY) / (STRING_COUNT - 1);
  
  // Distancias de trastes logarítmicas aproximadas
  const fretPositions = useMemo(() => {
    const scaleLength = 1000; 
    const positions = [0];
    let currentPos = 0;
    for (let i = 1; i <= FRET_COUNT; i++) {
      const dist = (scaleLength - currentPos) / 17.817;
      currentPos += dist;
      positions.push(currentPos);
    }
    // Normalizar a nuestro ancho visual
    const maxPos = positions[FRET_COUNT];
    const widthDisponible = width - 2 * paddingX;
    return positions.map(p => paddingX + (p / maxPos) * widthDisponible);
  }, [width, paddingX]);

  // Función utilitaria para limpiar octavas y comparar "clase de pitch" (ej. "C#4" -> "C#")
  const cleanNote = (n: string) => Note.pitchClass(n);
  const rootClass = rootNote ? cleanNote(rootNote) : null;
  const activeClasses = activeNotes.map(cleanNote);
  const scaleClasses = scaleNotes.map(cleanNote);

  // Mapear cada posición en la matriz a un dato de nota
  const fretboardMatrix = useMemo(() => {
    const matrix: any[][] = [];
    // Las cuerdas en TuningDef vienen de grave a aguda (E2, A2...).
    // Invertimos para UI visual estándar de tablatura (1ra cuerda aguda arriba).
    const stringsUI = [...tuning.strings].reverse();

    for (let s = 0; s < STRING_COUNT; s++) {
      const openNote = stringsUI[s];
      const stringData = [];
      for (let f = 0; f <= FRET_COUNT; f++) {
        // Transposición precisa con Tonal.js
        const noteName = Note.transpose(openNote, Interval.fromSemitones(f));
        const pc = cleanNote(noteName);
        
        let status = 'none'; // none, root, chord, scale
        if (rootClass === pc) status = 'root';
        else if (activeClasses.includes(pc)) status = 'chord';
        else if (scaleClasses.includes(pc)) status = 'scale';

        stringData.push({ noteName, pc, status });
      }
      matrix.push(stringData);
    }
    return matrix;
  }, [tuning, rootClass, activeClasses, scaleClasses]);

  // Marcadores de inlays (3, 5, 7, 9, 12(doble), 15, 17, 19, 21)
  const inlays = [3, 5, 7, 9, 12, 15, 17, 19, 21];

  return (
    <div className="w-full overflow-x-auto glass-panel p-4 my-6">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-2xl">
        {/* Fondo Madera Oscura / Mástil */}
        <rect x={paddingX} y={paddingY} width={width - 2 * paddingX} height={height - 2 * paddingY} fill="#1c1c26" rx="5" />
        
        {/* Trastes Verticales */}
        {fretPositions.map((pos, i) => (
          <g key={`fret-${i}`}>
            {i > 0 && (
              <line x1={pos} y1={paddingY} x2={pos} y2={height - paddingY} stroke="#cbd5e1" strokeWidth="2" opacity="0.6" />
            )}
            
            {/* Inlays (Puntos Guía) */}
            {inlays.includes(i) && (
              <circle 
                cx={(fretPositions[i - 1] + pos) / 2} 
                cy={i === 12 ? height / 2 - stringSpacing : height / 2} 
                r="6" fill="#475569" opacity="0.5" 
              />
            )}
            {/* Doble punto en el traste 12 */}
            {i === 12 && (
               <circle 
                 cx={(fretPositions[i - 1] + pos) / 2} 
                 cy={height / 2 + stringSpacing} 
                 r="6" fill="#475569" opacity="0.5" 
               />
            )}
          </g>
        ))}
        {/* Nut (Cejuela gruesa) */}
        <line x1={paddingX} y1={paddingY} x2={paddingX} y2={height - paddingY} stroke="#f8fafc" strokeWidth="6" />

        {/* Cuerdas Horizontales */}
        {fretboardMatrix.map((_, s) => {
          const y = paddingY + s * stringSpacing;
          const thickness = 1 + (s * 0.4); // Cuerdas graves más gruesas visualmente
          return (
            <line key={`string-${s}`} x1={0} y1={y} x2={width} y2={y} stroke="#94a3b8" strokeWidth={thickness} opacity="0.8" />
          );
        })}

        {/* Círculos de Notas Iluminadas */}
        {fretboardMatrix.map((stringData, s) => {
          const y = paddingY + s * stringSpacing;
          return stringData.map((data, f) => {
            if (data.status === 'none') return null;

            const cx = f === 0 ? paddingX / 2 : (fretPositions[f - 1] + fretPositions[f]) / 2;
            
            // Sistema de Colores (Estética Premium UX)
            let fill = "#1e293b";
            let stroke = "none";
            let textColor = "white";

            if (data.status === 'root') {
              fill = "#ef4444"; // Rojo (Tono Raíz)
            } else if (data.status === 'chord') {
              fill = "#3b82f6"; // Azul (Notas Objetivo del acorde sonando)
            } else if (data.status === 'scale') {
              fill = "#13131a"; // Fondo oscuro
              stroke = "#eab308"; // Borde amarillo (Escala/Atajo)
              textColor = "#eab308";
            }
            
            return (
              <g key={`note-${s}-${f}`} className="transition-all duration-300">
                <circle 
                  cx={cx} 
                  cy={y} 
                  r="12" 
                  fill={fill}
                  stroke={stroke}
                  strokeWidth="2"
                  className={data.status !== 'scale' ? "drop-shadow-md" : ""}
                />
                <text 
                  x={cx} 
                  y={y + 4} 
                  fontSize="11" 
                  textAnchor="middle" 
                  fill={textColor}
                  fontWeight="bold"
                >
                  {data.pc}
                </text>
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
};
