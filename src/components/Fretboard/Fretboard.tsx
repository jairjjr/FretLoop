import { useMemo } from 'react';
import { Note, Interval } from 'tonal';
import { TUNINGS, TuningName } from '../../core/types';
import { Settings2 } from 'lucide-react';

interface FretboardProps {
  tuningName: TuningName;
  onTuningChange: (t: TuningName) => void;
  scaleRoot: string | null;
  scaleNotes: string[];
}

const FRET_COUNT = 22;
const STRING_COUNT = 6;

export const Fretboard: React.FC<FretboardProps> = ({ tuningName, onTuningChange, scaleRoot, scaleNotes }) => {
  const tuning = TUNINGS[tuningName];
  
  const width = 1000;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  const fretPositions = useMemo(() => {
    const positions = [];
    const scaleLength = width - paddingX * 2;
    const magicConstant = 17.817; 
    let remainingLength = scaleLength;
    let currentPos = paddingX;

    for (let i = 1; i <= FRET_COUNT; i++) {
      const fretDist = remainingLength / magicConstant;
      currentPos += fretDist;
      positions.push(currentPos);
      remainingLength -= fretDist;
    }
    return positions;
  }, [width, paddingX]);

  const cleanNote = (n: string) => Note.pitchClass(n);
  const scaleClasses = scaleNotes.map(cleanNote);
  const rootClass = scaleRoot ? cleanNote(scaleRoot) : null;

  const fretboardMatrix = useMemo(() => {
    const matrix = [];
    const stringsUI = [...tuning.strings].reverse();

    for (let s = 0; s < STRING_COUNT; s++) {
      const openNote = stringsUI[s];
      const stringData = [];

      for (let f = 0; f <= FRET_COUNT; f++) {
        const noteName = Note.transpose(openNote, Interval.fromSemitones(f));
        const pc = cleanNote(noteName);
        
        const isScale = scaleClasses.includes(pc);
        const isRoot = rootClass === pc;

        if (!isScale) {
          stringData.push({ noteName, pc, show: false });
        } else {
          stringData.push({ noteName, pc, show: true, isRoot, isScale: true });
        }
      }
      matrix.push(stringData);
    }
    return matrix;
  }, [tuning, rootClass, scaleClasses]);

  const inlays = [3, 5, 7, 9, 12, 15, 17, 19, 21];

  return (
    <div className="w-full bg-dark-800/80 p-4 rounded-xl border border-white/5 shadow-inner">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings2 size={20} className="text-primary-main" />
          Fretboard Estático
        </h2>
        
        <select 
          value={tuningName}
          onChange={(e) => onTuningChange(e.target.value as TuningName)}
          className="bg-dark-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-primary-main"
        >
          {Object.keys(TUNINGS).map(t => (
            <option key={t} value={t}>{t} ({TUNINGS[t as TuningName].name})</option>
          ))}
        </select>
      </div>

      <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-[800px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-2xl rounded-sm">
            {/* Madera del mástil */}
            <rect x={paddingX} y={paddingY - 10} width={fretPositions[FRET_COUNT - 1] - paddingX + 20} height={height - 2 * paddingY + 20} fill="#1e1e24" rx="4" />
            
            {/* Cejilla (Nut) */}
            <rect x={paddingX - 6} y={paddingY - 10} width="6" height={height - 2 * paddingY + 20} fill="#d1d5db" />

            {/* Inlays (Puntos) */}
            {fretPositions.map((pos, i) => {
              const fretNum = i + 1;
              if (inlays.includes(fretNum)) {
                const prevPos = i === 0 ? paddingX : fretPositions[i - 1];
                const cx = (prevPos + pos) / 2;
                
                if (fretNum === 12) {
                  return (
                    <g key={`inlay-${fretNum}`}>
                      <circle cx={cx} cy={height / 2 - 20} r="4" fill="#3f3f46" />
                      <circle cx={cx} cy={height / 2 + 20} r="4" fill="#3f3f46" />
                    </g>
                  );
                }
                return <circle key={`inlay-${fretNum}`} cx={cx} cy={height / 2} r="4" fill="#3f3f46" />;
              }
              return null;
            })}

            {/* Trastes */}
            {fretPositions.map((pos, i) => (
              <line 
                key={`fret-${i}`}
                x1={pos} y1={paddingY - 10} 
                x2={pos} y2={height - paddingY + 10} 
                stroke="#52525b" strokeWidth="2" 
              />
            ))}

            {/* Cuerdas */}
            {Array.from({ length: STRING_COUNT }).map((_, i) => {
              const stringSpacing = (height - 2 * paddingY) / (STRING_COUNT - 1);
              const y = paddingY + i * stringSpacing;
              // Las cuerdas graves (abajo visualmente, índices mayores) son más gruesas
              const thickness = 1 + (i * 0.5); 
              return (
                <line 
                  key={`string-${i}`}
                  x1={0} y1={y} 
                  x2={width} y2={y} 
                  stroke="#a1a1aa" 
                  strokeWidth={thickness}
                  opacity="0.7"
                />
              );
            })}

            {/* Notas */}
            {fretboardMatrix.map((stringData, s) => {
              const stringSpacing = (height - 2 * paddingY) / (STRING_COUNT - 1);
              const y = paddingY + s * stringSpacing;

              return stringData.map((data, f) => {
                if (!data.show) return null;
                const cx = f === 0 ? paddingX / 2 : (fretPositions[f - 1] + fretPositions[f]) / 2;
                
                const fill = data.isRoot ? "#ef4444" : "#13131a"; // Rojo para tónica, Oscuro para el resto
                const stroke = "#eab308"; // Siempre amarillo
                const strokeWidth = "2";
                const textColor = data.isRoot ? "white" : "#eab308"; // Letra blanca en roja, letra amarilla en negra
                const radius = data.isRoot ? 14 : 12; // Radio más grande para la tónica, evita usar CSS scale
                
                return (
                  <g key={`note-${s}-${f}`} className="transition-colors duration-300">
                    <circle cx={cx} cy={y} r={radius} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                    <text x={cx} y={y + 4} fontSize="11" textAnchor="middle" fill={textColor} fontWeight="bold">{data.pc}</text>
                  </g>
                );
              });
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
