import React, { useState, useEffect } from 'react';
import { TimeBlock, TimeSignature } from '../../core/types';
import { TheoryEngine } from '../../core/TheoryEngine';
import { Play, Square, Plus, Trash2, Clock, Activity } from 'lucide-react';

interface SequencerProps {
  blocks: TimeBlock[];
  onAddBlock: (block: TimeBlock) => void;
  onRemoveBlock: (id: string) => void;
  onPlay: () => void;
  onStop: () => void;
  isPlaying: boolean;
  activeBlockId: string | null;
  
  // Controles inyectados
  bpm: number;
  onBpmChange: (bpm: number) => void;
  timeSignature: TimeSignature;
  onTimeSignatureChange: (ts: TimeSignature) => void;
  
  // Mutes
  isDrumsMuted: boolean;
  onDrumsMuteChange: (m: boolean) => void;
  isBassMuted: boolean;
  onBassMuteChange: (m: boolean) => void;
  isKeysMuted: boolean;
  onKeysMuteChange: (m: boolean) => void;
}

const ROOTS = ["C", "D", "E", "F", "G", "A", "B"];
const TYPES = [
  { label: "Maj", val: "maj" },
  { label: "min", val: "m" },
  { label: "7", val: "7" },
  { label: "m7", val: "m7" },
  { label: "maj7", val: "maj7" }
];

export const Sequencer: React.FC<SequencerProps> = ({ 
  blocks, onAddBlock, onRemoveBlock, onPlay, onStop, isPlaying, activeBlockId,
  bpm, onBpmChange, timeSignature, onTimeSignatureChange,
  isDrumsMuted, onDrumsMuteChange, isBassMuted, onBassMuteChange, isKeysMuted, onKeysMuteChange
}) => {
  const [selectedRoot, setSelectedRoot] = useState("C");
  const [selectedAccidental, setSelectedAccidental] = useState("");
  const [selectedType, setSelectedType] = useState("maj");
  const [selectedBars, setSelectedBars] = useState(1);

  // Estado Local de String para evitar el 'Cero Fantasma' al borrar
  const [localBpm, setLocalBpm] = useState(bpm.toString());

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
    // Validación de seguridad (Zero-Trust)
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
    
    // Extraemos el numerador del compás para la duración base del bloque
    const beatsPerBar = parseInt(timeSignature.split('/')[0]);
    
    onAddBlock({
      id: Math.random().toString(36).substring(7),
      chord: parsed,
      durationInBeats: beatsPerBar * selectedBars
    });
  };

  return (
    <div className="glass-panel w-full flex flex-col overflow-hidden shadow-2xl">
      {/* Cabecera del Sequencer con Controles Integrados */}
      <div className="bg-dark-900/60 p-4 border-b border-white/5 flex flex-col xl:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-white/90 flex items-center gap-2 w-full xl:w-auto justify-center xl:justify-start">
           Constructor de Secuencias
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 bg-dark-800/80 p-3 md:px-4 md:py-2 rounded-lg border border-white/5 w-full xl:w-auto">
          {/* Selector de Compás */}
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <select 
              value={timeSignature} 
              onChange={e => onTimeSignatureChange(e.target.value as TimeSignature)}
              className="bg-transparent text-sm text-white font-bold outline-none cursor-pointer"
            >
              <option value="3/4" className="bg-dark-800">3/4 (Vals)</option>
              <option value="4/4" className="bg-dark-800">4/4 (Rock/Pop)</option>
              <option value="5/4" className="bg-dark-800">5/4 (Odd Time)</option>
              <option value="6/8" className="bg-dark-800">6/8 (Blues/Balada)</option>
            </select>
          </div>

          <div className="w-px h-6 bg-white/10 hidden md:block"></div>

          {/* Slider de Tempo */}
          <div className="flex items-center gap-3 min-w-[150px]">
            <Activity size={16} className="text-gray-400" />
            <input 
              type="range" 
              min="60" max="200" 
              value={bpm}
              onChange={(e) => onBpmChange(Number(e.target.value))}
              className="w-24 accent-primary-main"
            />
            <div className="flex flex-col items-end justify-center">
              <input 
                type="number"
                min="60" max="200"
                value={localBpm}
                onChange={handleBpmInput}
                onBlur={handleBpmBlur}
                className="w-14 bg-dark-800 text-white text-sm font-bold text-center rounded border border-white/10 px-1 py-0.5 focus:outline-none focus:border-primary-main"
              />
              <span className="text-[10px] text-gray-400 font-normal mt-0.5">BPM</span>
            </div>
          </div>

          <div className="w-px h-6 bg-white/10 hidden md:block"></div>

          {/* Mute Toggles */}
          <div className="flex gap-1 bg-dark-900 p-1 rounded-lg border border-white/5">
            <button 
              onClick={() => onKeysMuteChange(!isKeysMuted)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all hover:scale-105 active:scale-95 ${!isKeysMuted ? 'bg-primary-main text-white drop-shadow-md' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
            >
              🎹 Keys
            </button>
            <button 
              onClick={() => onBassMuteChange(!isBassMuted)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all hover:scale-105 active:scale-95 ${!isBassMuted ? 'bg-accent-blue text-white drop-shadow-md' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
            >
              🎸 Bass
            </button>
            <button 
              onClick={() => onDrumsMuteChange(!isDrumsMuted)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all hover:scale-105 active:scale-95 ${!isDrumsMuted ? 'bg-accent-yellow text-dark-900 drop-shadow-md' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
            >
              🥁 Drums
            </button>
          </div>
        </div>

        <div className="flex gap-2 w-full xl:w-auto justify-center mt-2 xl:mt-0">
            {!isPlaying ? (
              <button onClick={onPlay} className="bg-primary-main hover:bg-primary-glow text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 font-semibold shadow-lg shadow-indigo-500/20">
                <Play size={16} fill="currentColor" /> Reproducir 🎶
              </button>
            ) : (
              <button onClick={onStop} className="bg-accent-red hover:bg-red-400 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 font-semibold shadow-lg shadow-red-500/20">
                <Square size={16} fill="currentColor" /> Detener 🛑
              </button>
            )}
          </div>
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* Controles de Ingreso (Botones) */}
        <div className="bg-dark-800/80 p-5 rounded-xl border border-white/5 flex flex-wrap items-center justify-center gap-x-6 gap-y-5 shadow-inner">
          
          {/* 1. Raíz */}
          <div className="flex flex-wrap gap-2 justify-center">
            {ROOTS.map(root => (
              <button 
                key={root}
                onClick={() => setSelectedRoot(root)}
                className={`w-11 h-11 rounded-full font-bold text-lg transition-all active:scale-95
                  ${selectedRoot === root ? 'bg-primary-main text-white drop-shadow-[0_0_10px_rgba(99,102,241,0.6)] scale-110' : 'bg-dark-700 text-gray-400 hover:bg-dark-700/80 hover:text-white'}`}
              >
                {root}
              </button>
            ))}
          </div>

          {/* 2. Alteración */}
          <div className="flex flex-wrap gap-1 justify-center bg-dark-900 p-1.5 rounded-xl border border-white/5">
            {[{ label: "♮", val: "" }, { label: "#", val: "#" }, { label: "b", val: "b" }].map(acc => (
              <button 
                key={acc.label}
                onClick={() => setSelectedAccidental(acc.val)}
                className={`w-10 h-10 rounded-lg font-bold text-lg transition-all active:scale-95
                  ${selectedAccidental === acc.val ? 'bg-primary-main text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                {acc.label}
              </button>
            ))}
          </div>

          {/* 3. Calidad / Tipo */}
          <div className="flex flex-wrap gap-2 justify-center">
            {TYPES.map(type => (
              <button 
                key={type.val}
                onClick={() => setSelectedType(type.val)}
                className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95
                  ${selectedType === type.val ? 'bg-accent-blue text-white shadow-lg shadow-blue-500/30' : 'bg-dark-700 text-gray-400 hover:bg-dark-700/80 hover:text-white'}`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* 4. Duración */}
          <div className="flex gap-1 bg-dark-900 p-1.5 rounded-xl border border-white/5">
            {[1, 2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => setSelectedBars(num)}
                className={`w-12 h-10 rounded-lg font-bold text-sm transition-all active:scale-95
                  ${selectedBars === num 
                    ? 'bg-accent-blue text-white shadow-lg shadow-blue-500/20' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                title={`${num} Compás${num > 1 ? 'es' : ''}`}
              >
                x{num}
              </button>
            ))}
          </div>

          {/* 5. Inserción */}
            <button 
              onClick={handleAdd}
              className="flex-1 sm:flex-none bg-dark-700 hover:bg-white/10 hover:scale-105 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10 font-bold hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              <Plus size={20} /> Insertar al Loop ✨
            </button>
        </div>

        {/* Timeline Visual */}
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[120px] items-center p-2 snap-x">
          {blocks.length === 0 ? (
            <div className="flex-1 flex justify-center border-2 border-dashed border-white/10 rounded-xl p-8 bg-dark-800/30">
              <p className="text-gray-500 font-medium">Línea de tiempo vacía. Combina un Tono Raíz y un Modificador arriba, luego insértalo. 🚀</p>
            </div>
          ) : (
            blocks.map(block => {
              // Calcular ancho base (1 compás en 4/4 = 4 beats = 7rem = 112px).
              // 1 beat = 1.75rem. Min-width base para legibilidad.
              const blockWidthRem = Math.max(7, block.durationInBeats * 1.75);
              const beatsPerBar = parseInt(timeSignature.split('/')[0]);
              const blockBars = block.durationInBeats / beatsPerBar;

              return (
                <div 
                  key={block.id}
                  style={{ width: `${blockWidthRem}rem` }}
                  className={`relative flex-shrink-0 h-28 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-300 group snap-center
                    ${activeBlockId === block.id 
                      ? 'border-primary-main bg-indigo-900/40 scale-105 drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]' 
                      : 'border-white/10 bg-dark-800 hover:border-white/20'
                    }
                  `}
                >
                  <span className="text-3xl font-extrabold text-white/90">{block.chord?.name || "Silencio"}</span>
                  
                  {blockBars > 1 && (
                    <span className="text-xs text-accent-blue font-bold mt-1 bg-accent-blue/10 px-2 py-0.5 rounded-full border border-accent-blue/20">
                      {blockBars} Compases
                    </span>
                  )}
                  
                  <button 
                    onClick={() => onRemoveBlock(block.id)}
                    className="absolute -top-3 -right-3 bg-dark-900 border border-accent-red p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-accent-red hover:scale-110"
                  >
                    <Trash2 size={14} color="white" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
