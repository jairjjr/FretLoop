import { useMemo } from 'react';
import { Note, Interval } from 'tonal';
import { TUNINGS, TuningName, FretboardDisplayMode } from '../../core/types';
import { SlidersHorizontal, Volume2 } from 'lucide-react';

interface FretboardProps {
  tuningName: TuningName;
  onTuningChange: (t: TuningName) => void;
  scaleRoot: string | null;
  scaleNotes: string[];
  scaleIntervals: string[];
  displayMode: FretboardDisplayMode;
  onDisplayModeChange: (mode: FretboardDisplayMode) => void;
  activeChordNotes?: string[];
  onNoteClick?: (noteName: string) => void;
}

const FRET_COUNT = 22;
const STRING_COUNT = 6;

const formatIntervalLabel = (interval: string): string => {
  const map: Record<string, string> = {
    "1P": "R",
    "2m": "b2",
    "2M": "2",
    "3m": "b3",
    "3M": "3",
    "4P": "4",
    "4A": "#4",
    "5d": "b5",
    "5P": "5",
    "5A": "#5",
    "6m": "b6",
    "6M": "6",
    "7m": "b7",
    "7M": "7"
  };
  return map[interval] || interval;
};

export const Fretboard: React.FC<FretboardProps> = ({ 
  tuningName, 
  onTuningChange, 
  scaleRoot, 
  scaleNotes, 
  scaleIntervals,
  displayMode,
  onDisplayModeChange,
  activeChordNotes = [],
  onNoteClick
}) => {
  const tuning = TUNINGS[tuningName];
  
  const width = 1200;
  const height = 280;
  const paddingX = 54;
  const paddingY = 40;

  const fretPositions = useMemo(() => {
    const relativePositions = [0]; 
    for (let i = 1; i <= FRET_COUNT; i++) {
      const ratio = 1 - (1 / Math.pow(2, i / 12));
      relativePositions.push(ratio);
    }
    
    const maxRatio = relativePositions[FRET_COUNT];
    const availableWidth = width - (paddingX * 2);
    
    return relativePositions.map(ratio => paddingX + (ratio / maxRatio) * availableWidth);
  }, [width, paddingX]);

  const cleanNote = (n: string) => Note.pitchClass(n);
  const scaleClasses = scaleNotes.map(cleanNote);
  const rootClass = scaleRoot ? cleanNote(scaleRoot) : null;
  const activeChordClasses = activeChordNotes.map(cleanNote);

  const fretboardMatrix = useMemo(() => {
    const matrix = [];
    const stringsUI = [...tuning.strings].reverse();

    for (let s = 0; s < STRING_COUNT; s++) {
      const openNote = stringsUI[s];
      const stringData = [];

      for (let f = 0; f <= FRET_COUNT; f++) {
        const noteName = Note.transpose(openNote, Interval.fromSemitones(f));
        const pc = cleanNote(noteName);
        
        const noteIndexInScale = scaleClasses.indexOf(pc);
        const isScale = noteIndexInScale !== -1;
        const isRoot = rootClass === pc;
        let isFifth = false;
        let isThird = false;
        let intervalLabel = "";

        if (isScale && scaleIntervals && scaleIntervals.length > 0) {
          const rawInterval = scaleIntervals[noteIndexInScale];
          intervalLabel = formatIntervalLabel(rawInterval);
          if (rawInterval === "5P" || rawInterval === "5d" || rawInterval === "5A") {
            isFifth = true;
          } else if (rawInterval === "3M" || rawInterval === "3m") {
            isThird = true;
          }
        }

        const isChordTone = activeChordClasses.includes(pc);

        if (!isScale) {
          stringData.push({ noteName, pc, show: false });
        } else {
          stringData.push({ 
            noteName, 
            pc, 
            show: true, 
            isRoot, 
            isThird,
            isFifth, 
            isChordTone,
            intervalLabel,
            isScale: true 
          });
        }
      }
      matrix.push(stringData);
    }
    return matrix;
  }, [tuning, rootClass, scaleClasses, scaleIntervals, activeChordClasses]);

  const inlays = [3, 5, 7, 9, 12, 15, 17, 19, 21];

  return (
    <div className="w-full bg-[#11131a] p-5 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-4">
      {/* Barra de control superior del diapasón */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Diapasón Interactivo</h2>
            <p className="text-xs text-gray-400">Toca cualquier nota para escucharla en tiempo real</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Selector de modo: Notas vs Intervalos */}
          <div className="flex bg-[#0b0c10] p-1 rounded-xl border border-white/10 text-xs font-semibold">
            <button
              onClick={() => onDisplayModeChange("notes")}
              className={`px-3 py-1.5 rounded-lg transition-all ${displayMode === "notes" ? "bg-amber-500 text-black font-bold shadow-sm" : "text-gray-400 hover:text-white"}`}
            >
              Notas
            </button>
            <button
              onClick={() => onDisplayModeChange("intervals")}
              className={`px-3 py-1.5 rounded-lg transition-all ${displayMode === "intervals" ? "bg-amber-500 text-black font-bold shadow-sm" : "text-gray-400 hover:text-white"}`}
            >
              Intervalos
            </button>
          </div>

          {/* Selector de Afinación */}
          <select 
            value={tuningName}
            onChange={(e) => onTuningChange(e.target.value as TuningName)}
            className="bg-[#0b0c10] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-300 focus:outline-none focus:border-amber-500 transition-colors"
          >
            {Object.keys(TUNINGS).map(t => (
              <option key={t} value={t}>{t} ({TUNINGS[t as TuningName].name})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vista SVG del Diapasón */}
      <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
        <div className="min-w-[860px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-2xl select-none" role="img" aria-label="Diapasón de guitarra interactivo">
            {/* Madera de ébano con bisel sutil */}
            <rect x={paddingX} y={paddingY - 12} width={width - 2 * paddingX + 20} height={height - 2 * paddingY + 24} fill="#14161f" rx="6" />
            <rect x={paddingX} y={paddingY - 12} width={width - 2 * paddingX + 20} height="2" fill="#2d3142" />

            {/* Cejuela (Nut) de hueso sintetizado */}
            <rect x={paddingX - 7} y={paddingY - 12} width="7" height={height - 2 * paddingY + 24} fill="#e2e8f0" rx="1" />
            <rect x={paddingX - 7} y={paddingY - 12} width="2" height={height - 2 * paddingY + 24} fill="#94a3b8" />

            {/* Inlays (Marcadores nacarados) */}
            {fretPositions.map((pos, i) => {
              if (i === 0) return null;
              const fretNum = i;
              if (inlays.includes(fretNum)) {
                const prevPos = fretPositions[i - 1];
                const cx = (prevPos + pos) / 2;
                
                if (fretNum === 12) {
                  return (
                    <g key={`inlay-${fretNum}`}>
                      <circle cx={cx} cy={height / 2 - 32} r="4.5" fill="#3f4458" />
                      <circle cx={cx} cy={height / 2 + 32} r="4.5" fill="#3f4458" />
                    </g>
                  );
                }
                return <circle key={`inlay-${fretNum}`} cx={cx} cy={height / 2} r="4.5" fill="#3f4458" />;
              }
              return null;
            })}

            {/* Marcadores numéricos de traste */}
            {fretPositions.map((pos, i) => {
              if (i === 0) return null;
              if (inlays.includes(i)) {
                const cx = (fretPositions[i - 1] + pos) / 2;
                return (
                  <g key={`fretnum-${i}`}>
                    <text x={cx} y={20} fontSize="11" textAnchor="middle" fill="#64748b" fontWeight="700">{i}</text>
                    <text x={cx} y={270} fontSize="11" textAnchor="middle" fill="#64748b" fontWeight="700">{i}</text>
                  </g>
                );
              }
              return null;
            })}

            {/* Trastes de níquel */}
            {fretPositions.map((pos, i) => {
              if (i === 0) return null;
              return (
                <line 
                  key={`fret-${i}`}
                  x1={pos} y1={paddingY - 12} 
                  x2={pos} y2={height - paddingY + 12} 
                  stroke="#52586f" strokeWidth="2.5" 
                />
              );
            })}

            {/* Cuerdas físicas con calibre graduado */}
            {Array.from({ length: STRING_COUNT }).map((_, i) => {
              const stringSpacing = (height - 2 * paddingY) / (STRING_COUNT - 1);
              const y = paddingY + i * stringSpacing;
              const isWound = i >= 3;
              const thickness = 1.2 + (i * 0.55); 
              return (
                <g key={`string-${i}`}>
                  <line 
                    x1={0} y1={y} 
                    x2={width} y2={y} 
                    stroke={isWound ? "#94a3b8" : "#cbd5e1"} 
                    strokeWidth={thickness}
                    opacity="0.85"
                  />
                  {isWound && (
                    <line 
                      x1={0} y1={y + 0.5} 
                      x2={width} y2={y + 0.5} 
                      stroke="#475569" 
                      strokeWidth={thickness * 0.4}
                      opacity="0.6"
                    />
                  )}
                </g>
              );
            })}

            {/* Notas interactivas */}
            {fretboardMatrix.map((stringData, s) => {
              const stringSpacing = (height - 2 * paddingY) / (STRING_COUNT - 1);
              const y = paddingY + s * stringSpacing;

              return stringData.map((data, f) => {
                if (!data.show) return null;
                
                const cx = f === 0 ? paddingX / 2 : (fretPositions[f - 1] + fretPositions[f]) / 2;
                
                let fill = "#181a24";
                let stroke = "#f59e0b";
                let textColor = "#f59e0b";
                let radius = 13;

                if (data.isRoot) {
                  fill = "#ef4444";
                  stroke = "#fca5a5";
                  textColor = "#ffffff";
                  radius = 15;
                } else if (data.isThird) {
                  fill = "#10b981";
                  stroke = "#6ee7b7";
                  textColor = "#ffffff";
                  radius = 13.5;
                } else if (data.isFifth) {
                  fill = "#3b82f6";
                  stroke = "#93c5fd";
                  textColor = "#ffffff";
                  radius = 13.5;
                }

                const displayText = displayMode === "intervals" && data.intervalLabel ? data.intervalLabel : data.pc;

                return (
                  <g 
                    key={`note-${s}-${f}`} 
                    onClick={() => onNoteClick && onNoteClick(data.noteName)}
                    className="cursor-pointer transition-transform duration-150 hover:scale-110 active:scale-95"
                    style={{ transformOrigin: `${cx}px ${y}px` }}
                  >
                    {/* Anillo de acorde en curso */}
                    {data.isChordTone && (
                      <circle 
                        cx={cx} 
                        cy={y} 
                        r={radius + 4} 
                        fill="none" 
                        stroke="#f59e0b" 
                        strokeWidth="2.5" 
                        strokeDasharray="3 2"
                        opacity="0.9"
                      />
                    )}

                    <circle 
                      cx={cx} 
                      cy={y} 
                      r={radius} 
                      fill={fill} 
                      stroke={stroke} 
                      strokeWidth="1.8" 
                      className="drop-shadow-md"
                    />

                    <text 
                      x={cx} 
                      y={y + 4} 
                      fontSize={displayText.length > 2 ? "10.5" : "12"} 
                      textAnchor="middle" 
                      fill={textColor} 
                      fontWeight="700"
                    >
                      {displayText}
                    </text>
                  </g>
                );
              });
            })}
          </svg>
        </div>
      </div>

      {/* Leyenda Armónica de Navegación */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400 pt-2 border-t border-white/5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block border border-red-300"></span>
            <span className="text-gray-300 font-medium">Tónica (R)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-emerald-300"></span>
            <span className="text-gray-300 font-medium">Tercera (3 / b3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block border border-blue-300"></span>
            <span className="text-gray-300 font-medium">Quinta (5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#181a24] border border-amber-500 inline-block"></span>
            <span className="text-gray-300 font-medium">Escala</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-dashed border-amber-400 inline-block"></span>
            <span className="text-gray-300 font-medium">Acorde activo</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-gray-400">
          <Volume2 size={13} className="text-amber-500" />
          <span>Haz clic en un traste para audicionar</span>
        </div>
      </div>
    </div>
  );
};

