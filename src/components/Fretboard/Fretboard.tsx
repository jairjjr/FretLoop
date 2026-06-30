import { useMemo } from 'react';
import { Note, Interval } from 'tonal';
import { TUNINGS, TuningName, ChordData } from '../../core/types';
import { Settings2 } from 'lucide-react';

interface FretboardProps {
  tuningName: TuningName;
  onTuningChange: (t: TuningName) => void;
  chordData: ChordData | null;
  scaleNotes: string[];
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
  const scaleClasses = scaleNotes.map(cleanNote);

  const fretboardMatrix = useMemo(() => {
    const matrix = [];
    const stringsUI = [...tuning.strings].reverse();
    const STRING_COUNT = tuning.strings.length;

    for (let s = 0; s < STRING_COUNT; s++) {
      const openNote = stringsUI[s];
      const stringData = [];

      for (let f = 0; f <= FRET_COUNT; f++) {
        const noteName = Note.transpose(openNote, Interval.fromSemitones(f));
        const pc = cleanNote(noteName);
        
        const isScale = scaleClasses.includes(pc);
        let isRoot = false;
        let isChordTone = false;
        
        if (chordData && isScale) {
          const noteIndex = chordData.notes.map(cleanNote).indexOf(pc);
          if (noteIndex !== -1) {
            const interval = chordData.intervals[noteIndex];
            if (interval === "1P") isRoot = true;
            else if (interval.includes("3") || interval.includes("5")) isChordTone = true;
          }
        }

        if (!isScale) {
          stringData.push({ noteName, pc, show: false });
        } else {
          stringData.push({ noteName, pc, show: true, isRoot, isChord: isChordTone, isScale: true });
        }
      }
      matrix.push(stringData);
    }
    return matrix;
  }, [tuning, chordData, scaleClasses]);

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
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[800px] h-auto drop-shadow-2xl">
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
              if (!data.show) return null;
              const cx = f === 0 ? paddingX / 2 : (fretPositions[f - 1] + fretPositions[f]) / 2;
              
              let fill = "#13131a";
              if (data.isRoot) fill = "#ef4444";
              else if (data.isChord) fill = "#3b82f6";
              
              const stroke = "#eab308"; 
              const strokeWidth = "2";
              const textColor = (!data.isChord && !data.isRoot) ? "#eab308" : "white";
              
              return (
                <g key={`note-${s}-${f}`} className="transition-all duration-300">
                  <circle cx={cx} cy={y} r="12" fill={fill} stroke={stroke} strokeWidth={strokeWidth} className={data.isRoot || data.isChord ? "drop-shadow-md scale-[1.15]" : ""} />
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
