import React, { useState, useEffect, useRef } from 'react';
import { TimeBlock, TimeSignature, ProgressionPreset } from '../../core/types';
import { TheoryEngine, PROGRESSION_PRESETS } from '../../core/TheoryEngine';
import { 
  Play, 
  Square, 
  Plus, 
  Trash2, 
  Clock, 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Sparkles, 
  BookOpen, 
  RotateCcw,
  Volume2
} from 'lucide-react';

interface SequencerProps {
  blocks: TimeBlock[];
  onAddBlock: (block: TimeBlock) => void;
  onRemoveBlock: (id: string) => void;
  onMoveBlock?: (id: string, direction: "left" | "right") => void;
  onDuplicateBlock?: (id: string) => void;
  onLoadPreset?: (preset: ProgressionPreset) => void;
  onClearBlocks?: () => void;
  onPlay: () => void;
  onStop: () => void;
  isPlaying: boolean;
  activeBlockId: string | null;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  timeSignature: TimeSignature;
  onTimeSignatureChange: (ts: TimeSignature) => void;
  isDrumsMuted: boolean;
  onDrumsMuteChange: (m: boolean) => void;
  isBassMuted: boolean;
  onBassMuteChange: (m: boolean) => void;
  isKeysMuted: boolean;
  onKeysMuteChange: (m: boolean) => void;
}

const ROOTS = ["C", "D", "E", "F", "G", "A", "B"];
const TYPES = [
  { label: "Mayor", val: "maj" },
  { label: "Menor", val: "m" },
  { label: "7ma Dominante", val: "7" },
  { label: "Menor 7ma", val: "m7" },
  { label: "Mayor 7ma", val: "maj7" }
];

export const Sequencer: React.FC<SequencerProps> = ({ 
  blocks, 
  onAddBlock, 
  onRemoveBlock, 
  onMoveBlock,
  onDuplicateBlock,
  onLoadPreset,
  onClearBlocks,
  onPlay, 
  onStop, 
  isPlaying, 
  activeBlockId,
  bpm, 
  onBpmChange, 
  timeSignature, 
  onTimeSignatureChange,
  isDrumsMuted, 
  onDrumsMuteChange, 
  isBassMuted, 
  onBassMuteChange, 
  isKeysMuted, 
  onKeysMuteChange
}) => {
  const [selectedRoot, setSelectedRoot] = useState("C");
  const [selectedAccidental, setSelectedAccidental] = useState("");
  const [selectedType, setSelectedType] = useState("maj");
  const [selectedBars, setSelectedBars] = useState(1);
  const [localBpm, setLocalBpm] = useState(bpm.toString());

  // Tap tempo: calcula el promedio de intervalos de los últimos toques
  const tapTimesRef = useRef<number[]>([]);
  const handleTapTempo = () => {
    const now = performance.now();
    const recentTaps = tapTimesRef.current.filter(t => now - t < 3000);
    recentTaps.push(now);
    tapTimesRef.current = recentTaps;

    if (recentTaps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < recentTaps.length; i++) {
        intervals.push(recentTaps[i] - recentTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((acc, val) => acc + val, 0) / intervals.length;
      const computedBpm = Math.min(200, Math.max(60, Math.round(60000 / avgInterval)));
      onBpmChange(computedBpm);
    }
  };

  useEffect(() => {
    setLocalBpm(bpm.toString());
  }, [bpm]);

  const handleBpmInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalBpm(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 60 && num <= 200) {
      onBpmChange(num);
    }
  };

  const handleBpmBlur = () => {
    let num = parseInt(localBpm, 10);
    if (isNaN(num) || num < 60) num = 60;
    if (num > 200) num = 200;
    setLocalBpm(num.toString());
    if (bpm !== num) {
      onBpmChange(num);
    }
  };

  const handleAdd = () => {
    const chordStr = `${selectedRoot}${selectedAccidental}${selectedType === "maj" ? "" : selectedType}`;
    const parsed = TheoryEngine.parseChord(chordStr);
    const beatsPerBar = parseInt(timeSignature.split('/')[0]);
    
    onAddBlock({
      id: Math.random().toString(36).substring(7),
      chord: parsed,
      durationInBeats: beatsPerBar * selectedBars
    });
  };

  return (
    <div className="w-full bg-[#11131a] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
      {/* Barra superior de transporte y controles globales */}
      <div className="bg-[#0b0c10] px-5 py-3.5 border-b border-white/5 flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
            <h2 className="text-base font-bold text-white tracking-tight">Constructor de Secuencias</h2>
          </div>

          {/* Menú de Presets Didácticos */}
          {onLoadPreset && (
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-gray-400" />
              <select
                onChange={(e) => {
                  const preset = PROGRESSION_PRESETS.find(p => p.id === e.target.value);
                  if (preset) onLoadPreset(preset);
                  e.target.value = "";
                }}
                defaultValue=""
                className="bg-[#171923] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-300 focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="" disabled>Cargar progresión...</option>
                {PROGRESSION_PRESETS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Parámetros de Tempo, Compás y Mezcla */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 w-full lg:w-auto">
          {/* Compás */}
          <div className="flex items-center gap-1.5 bg-[#171923] px-3 py-1.5 rounded-xl border border-white/5">
            <Clock size={14} className="text-gray-400" />
            <select 
              value={timeSignature} 
              onChange={e => onTimeSignatureChange(e.target.value as TimeSignature)}
              className="bg-transparent text-xs text-white font-semibold outline-none cursor-pointer"
            >
              <option value="3/4" className="bg-[#171923]">3/4 Vals</option>
              <option value="4/4" className="bg-[#171923]">4/4 Estándar</option>
              <option value="5/4" className="bg-[#171923]">5/4 Irregular</option>
              <option value="6/8" className="bg-[#171923]">6/8 Compuesto</option>
            </select>
          </div>

          {/* Tempo y Tap */}
          <div className="flex items-center gap-2 bg-[#171923] px-3 py-1.5 rounded-xl border border-white/5">
            <Activity size={14} className="text-gray-400" />
            <input 
              type="range" 
              min="60" max="200" 
              value={bpm}
              onChange={(e) => onBpmChange(Number(e.target.value))}
              className="w-16 accent-amber-500"
            />
            <input 
              type="number"
              min="60" max="200"
              value={localBpm}
              onChange={handleBpmInput}
              onBlur={handleBpmBlur}
              className="w-12 bg-[#0b0c10] text-white text-xs font-bold text-center rounded border border-white/10 px-1 py-0.5 focus:outline-none focus:border-amber-500"
            />
            <span className="text-[10px] text-gray-400 font-medium">BPM</span>
            <button
              onClick={handleTapTempo}
              title="Haz clic rítmicamente para ajustar el tempo"
              className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-amber-400 rounded transition-colors active:scale-95"
            >
              TAP
            </button>
          </div>

          {/* Mutes de Canales */}
          <div className="flex bg-[#0b0c10] p-1 rounded-xl border border-white/5 text-xs font-medium">
            <button 
              onClick={() => onKeysMuteChange(!isKeysMuted)}
              className={`px-2.5 py-1 rounded-lg transition-all ${!isKeysMuted ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-gray-500 hover:text-white'}`}
            >
              Teclado
            </button>
            <button 
              onClick={() => onBassMuteChange(!isBassMuted)}
              className={`px-2.5 py-1 rounded-lg transition-all ${!isBassMuted ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-gray-500 hover:text-white'}`}
            >
              Bajo
            </button>
            <button 
              onClick={() => onDrumsMuteChange(!isDrumsMuted)}
              className={`px-2.5 py-1 rounded-lg transition-all ${!isDrumsMuted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-gray-500 hover:text-white'}`}
            >
              Batería
            </button>
          </div>

          {/* Botón Maestro Reproducir / Detener */}
          <div>
            {!isPlaying ? (
              <button 
                onClick={onPlay} 
                className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 font-bold text-xs shadow-lg shadow-amber-500/20"
              >
                <Play size={14} fill="currentColor" /> Reproducir
              </button>
            ) : (
              <button 
                onClick={onStop} 
                className="bg-red-500 hover:bg-red-400 text-white px-4 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 font-bold text-xs shadow-lg shadow-red-500/20"
              >
                <Square size={14} fill="currentColor" /> Detener
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor y Paleta de Acordes */}
      <div className="p-5 flex flex-col gap-5">
        <div className="bg-[#0b0c10] p-4 rounded-xl border border-white/5 flex flex-wrap items-center justify-center gap-x-5 gap-y-4">
          {/* Tónica */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {ROOTS.map(root => (
              <button 
                key={root}
                onClick={() => setSelectedRoot(root)}
                className={`w-9 h-9 rounded-lg font-bold text-sm transition-all active:scale-95
                  ${selectedRoot === root 
                    ? 'bg-amber-500 text-black font-extrabold shadow-md scale-105' 
                    : 'bg-[#171923] text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                {root}
              </button>
            ))}
          </div>

          {/* Alteración */}
          <div className="flex gap-1 bg-[#171923] p-1 rounded-lg border border-white/5">
            {[{ label: "Natural", val: "" }, { label: "#", val: "#" }, { label: "b", val: "b" }].map(acc => (
              <button 
                key={acc.label}
                onClick={() => setSelectedAccidental(acc.val)}
                className={`px-2.5 h-7 rounded-md font-bold text-xs transition-all active:scale-95
                  ${selectedAccidental === acc.val ? 'bg-amber-500 text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                {acc.label}
              </button>
            ))}
          </div>

          {/* Calidad armónica */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {TYPES.map(type => (
              <button 
                key={type.val}
                onClick={() => setSelectedType(type.val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95
                  ${selectedType === type.val 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-[#171923] text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Duración en compases */}
          <div className="flex items-center gap-1 bg-[#171923] p-1 rounded-lg border border-white/5 text-xs">
            {[1, 2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => setSelectedBars(num)}
                className={`px-2.5 py-1 rounded-md font-bold transition-all active:scale-95
                  ${selectedBars === num ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
              >
                {num}c
              </button>
            ))}
          </div>

          {/* Botón de inserción */}
          <button 
            onClick={handleAdd}
            className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95 border border-white/10 text-xs font-bold"
          >
            <Plus size={15} /> Añadir acorde
          </button>
        </div>

        {/* Línea de Tiempo Armónica */}
        <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-2 min-h-[140px] items-center snap-x custom-scrollbar">
          {blocks.length === 0 ? (
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-between border border-dashed border-white/15 rounded-xl p-6 bg-[#0b0c10]/40 gap-4">
              <div className="text-center sm:text-left">
                <h3 className="text-sm font-semibold text-gray-300">Línea de tiempo vacía</h3>
                <p className="text-xs text-gray-500 mt-0.5">Configura un acorde arriba o carga una progresión de estudio para comenzar el análisis.</p>
              </div>
              <div className="flex gap-2">
                {onLoadPreset && (
                  <button
                    onClick={() => onLoadPreset(PROGRESSION_PRESETS[0])}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Probar Pop (I-V-vi-IV)
                  </button>
                )}
                {onLoadPreset && (
                  <button
                    onClick={() => onLoadPreset(PROGRESSION_PRESETS[1])}
                    className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Probar Jazz (ii-V-I-VI)
                  </button>
                )}
              </div>
            </div>
          ) : (
            blocks.map((block, index) => {
              const beatsPerBar = parseInt(timeSignature.split('/')[0]);
              const blockBars = block.durationInBeats / beatsPerBar;
              const blockWidthRem = Math.max(6.5, block.durationInBeats * 1.35);

              return (
                <div 
                  key={block.id}
                  style={{ width: `${blockWidthRem}rem`, maxWidth: '85vw' }}
                  className={`relative flex-shrink-0 h-28 rounded-xl flex flex-col items-center justify-center border transition-all duration-200 group snap-center select-none
                    ${activeBlockId === block.id 
                      ? 'border-amber-400 bg-amber-500/10 scale-105 shadow-[0_0_20px_rgba(245,158,11,0.25)]' 
                      : 'border-white/10 bg-[#0b0c10] hover:border-white/20'
                    }
                  `}
                >
                  <span className="text-2xl font-black text-white tracking-tight leading-none px-2">
                    {block.chord?.name || "Silencio"}
                  </span>

                  {/* Grado Romano y Función Armónica */}
                  {block.chord?.romanNumeral && (
                    <span className="text-[11px] font-bold text-amber-400 mt-1.5 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {block.chord.romanNumeral} {block.chord.harmonicFunction ? `· ${block.chord.harmonicFunction}` : ''}
                    </span>
                  )}
                  
                  {blockBars > 1 && (
                    <span className="text-[10px] text-gray-400 font-medium mt-1">
                      {blockBars} compases
                    </span>
                  )}

                  {/* Acciones del Bloque: Mover, Duplicar y Borrar */}
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onMoveBlock && index > 0 && (
                      <button 
                        onClick={() => onMoveBlock(block.id, "left")}
                        title="Mover a la izquierda"
                        className="bg-[#171923] hover:bg-white/10 p-1 rounded text-gray-400 hover:text-white transition-colors"
                      >
                        <ChevronLeft size={12} />
                      </button>
                    )}
                    {onMoveBlock && index < blocks.length - 1 && (
                      <button 
                        onClick={() => onMoveBlock(block.id, "right")}
                        title="Mover a la derecha"
                        className="bg-[#171923] hover:bg-white/10 p-1 rounded text-gray-400 hover:text-white transition-colors"
                      >
                        <ChevronRight size={12} />
                      </button>
                    )}
                    {onDuplicateBlock && (
                      <button 
                        onClick={() => onDuplicateBlock(block.id)}
                        title="Duplicar acorde"
                        className="bg-[#171923] hover:bg-white/10 p-1 rounded text-gray-400 hover:text-white transition-colors"
                      >
                        <Copy size={12} />
                      </button>
                    )}
                    <button 
                      onClick={() => onRemoveBlock(block.id)}
                      title="Eliminar de la secuencia"
                      className="bg-[#171923] hover:bg-red-500/20 p-1 rounded text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

