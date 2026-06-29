import { useMemo } from 'react';
import { Note, Interval } from 'tonal';
import { TuningDef, TUNINGS, TuningName } from '../../core/types';
import { Settings2 } from 'lucide-react';

interface FretboardProps {
  tuningName: TuningName;
  onTuningChange: (t: TuningName) => void;
  rootNote: string | null;
  activeNotes: string[]; // Chord tones (Azul)
  scaleNotes: string[];  // Passing notes (Amarillo)
}

const FRET_COUNT = 22;
const STRING_COUNT = 6;

export const Fretboard: React.FC<FretboardProps> = ({ tuningName, onTuningChange, rootNote, activeNotes, scaleNotes }) => {
  const tuning = TUNINGS[tuningName];
  
  const width = 1000;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;
  const stringSpacing = (height - 2 * paddingY) / (STRING_COUNT - 1);
  
  const fretPositions = useMemo(() => {
    const scaleLength = 1000; 
    const positions = [0];
    let currentPos = 0;
    for (let i = 1; i <= FRET_COUNT; i++) {
      const dist = (scaleLength - currentPos) / 17.817;
      currentPos += dist;
      positions.push(currentPos);
    }
    const maxPos = positions[FRET_COUNT];
    const widthDisponible = width - 2 * paddingX;
    return positions.map(p => paddingX + (p / maxPos) * widthDisponible);
  }, [width, paddingX]);

  const cleanNote = (n: string) => Note.pitchClass(n);
  const rootClass = rootNote ? cleanNote(rootNote) : null;
  const activeClasses = activeNotes.map(cleanNote);
  const scaleClasses = scaleNotes.map(cleanNote);

  const fretboardMatrix = useMemo(() => {
    const matrix: any[][] = [];
    const stringsUI = [...tuning.strings].reverse();

    for (let s = 0; s < STRING_COUNT; s++) {
      const openNote = stringsUI[s];
      const stringData = [];
      for (let f = 0; f <= FRET_COUNT; f++) {
        const noteName = Note.transpose(openNote, Interval.fromSemitones(f));
        const pc = cleanNote(noteName);
        
        let status = 'none';
        if (rootClass === pc) status = 'root';
        else if (activeClasses.includes(pc)) status = 'chord';
        else if (scaleClasses.includes(pc)) status = 'scale';

        stringData.push({ noteName, pc, status });
      }
      matrix.push(stringData);
    }
    return matrix;
  }, [tuning, rootClass, activeClasses, scaleClasses]);

  const inlays = [3, 5, 7, 9, 12, 15, 17, 19, 21];

  return (
    <div className="w-full flex flex-col gap-4 mt-8">
      {/* Selector de Afinación Pegado al Diapasón */}
      <div className="flex justify-between items-center bg-dark-900/40 p-4 rounded-t-2xl border border-white/5 border-b-0 backdrop-blur-md">
        <h3 className="text-xl font-bold text-white/90 flex items-center gap-2">
           Diapasón Interactivo
        </h3>
        
        <div className="flex items-center gap-3 bg-dark-800/80 px-4 py-2 rounded-lg border border-white/5 shadow-inner">
          <Settings2 size={16} className="text-gray-400" />
          <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Afinación</label>
            <select 
              value={tuningName} 
              onChange={e => onTuningChange(e.target.value as TuningName)}
              className="bg-transparent text-sm text-white font-bold outline-none cursor-pointer"
            >
              {Object.keys(TUNINGS).map(t => <option key={t} value={t} className="bg-dark-800">{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* SVG del Mástil */}
      <div className="w-full overflow-x-auto glass-panel p-4 -mt-4 rounded-tl-none border-t border-white/10 shadow-2xl">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-2xl">
          <rect x={paddingX} y={paddingY} width={width - 2 * paddingX} height={height - 2 * paddingY} fill="#1c1c26" rx="5" />
          
          {fretPositions.map((pos, i) => (
            <g key={`fret-${i}`}>
              {i > 0 && <line x1={pos} y1={paddingY} x2={pos} y2={height - paddingY} stroke="#cbd5e1" strokeWidth="2" opacity="0.6" />}
              {inlays.includes(i) && (
                <circle cx={(fretPositions[i - 1] + pos) / 2} cy={i === 12 ? height / 2 - stringSpacing : height / 2} r="6" fill="#475569" opacity="0.5" />
              )}
              {i === 12 && (
                 <circle cx={(fretPositions[i - 1] + pos) / 2} cy={height / 2 + stringSpacing} r="6" fill="#475569" opacity="0.5" />
              )}
            </g>
          ))}
          <line x1={paddingX} y1={paddingY} x2={paddingX} y2={height - paddingY} stroke="#f8fafc" strokeWidth="6" />

          {fretboardMatrix.map((_, s) => (
            <line key={`string-${s}`} x1={0} y1={paddingY + s * stringSpacing} x2={width} y2={paddingY + s * stringSpacing} stroke="#94a3b8" strokeWidth={1 + (s * 0.4)} opacity="0.8" />
          ))}

          {fretboardMatrix.map((stringData, s) => {
            const y = paddingY + s * stringSpacing;
            return stringData.map((data, f) => {
              if (data.status === 'none') return null;
              const cx = f === 0 ? paddingX / 2 : (fretPositions[f - 1] + fretPositions[f]) / 2;
              
              let fill = "#1e293b", stroke = "none", textColor = "white";
              if (data.status === 'root') fill = "#ef4444";
              else if (data.status === 'chord') fill = "#3b82f6";
              else if (data.status === 'scale') { fill = "#13131a"; stroke = "#eab308"; textColor = "#eab308"; }
              
              return (
                <g key={`note-${s}-${f}`} className="transition-all duration-300">
                  <circle cx={cx} cy={y} r="12" fill={fill} stroke={stroke} strokeWidth="2" className={data.status !== 'scale' ? "drop-shadow-md" : ""} />
                  <text x={cx} y={y + 4} fontSize="11" textAnchor="middle" fill={textColor} fontWeight="bold">{data.pc}</text>
                </g>
              );
            });
          })}
        </svg>
      </div>
    </div>
  );
};
