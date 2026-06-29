import React, { useState } from 'react';
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
  bpm, onBpmChange, timeSignature, onTimeSignatureChange
}) => {
  const [selectedRoot, setSelectedRoot] = useState("C");
  const [selectedType, setSelectedType] = useState("maj");

  const handleAdd = () => {
    const chordStr = `${selectedRoot}${selectedType === "maj" ? "" : selectedType}`;
    const parsed = TheoryEngine.parseChord(chordStr);
    
    // Extraemos el numerador del compás para la duración base del bloque
    const beatsPerBar = parseInt(timeSignature.split('/')[0]);
    
    onAddBlock({
      id: Math.random().toString(36).substring(7),
      chord: parsed,
      durationInBeats: beatsPerBar 
    });
  };

  return (
    <div className="glass-panel w-full flex flex-col overflow-hidden shadow-2xl">
      {/* Cabecera del Sequencer con Controles Integrados */}
      <div className="bg-dark-900/60 p-4 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-white/90 flex items-center gap-2">
           Constructor de Secuencias
        </h2>

        <div className="flex items-center gap-6 bg-dark-800/80 px-4 py-2 rounded-lg border border-white/5">
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

          <div className="w-px h-6 bg-white/10"></div>

          {/* Slider de Tempo */}
          <div className="flex items-center gap-3 min-w-[150px]">
            <Activity size={16} className="text-gray-400" />
            <input 
              type="range" min="60" max="200" value={bpm} 
              onChange={e => onBpmChange(Number(e.target.value))}
              className="accent-primary-main w-24 cursor-pointer"
            />
            <span className="text-sm font-bold w-12 text-right">{bpm} BPM</span>
          </div>
        </div>

        <div className="flex gap-2">
          {!isPlaying ? (
            <button onClick={onPlay} className="bg-primary-main hover:bg-primary-glow text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-semibold shadow-lg shadow-indigo-500/20">
              <Play size={16} fill="currentColor" /> Reproducir
            </button>
          ) : (
            <button onClick={onStop} className="bg-accent-red hover:bg-red-400 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-semibold shadow-lg shadow-red-500/20">
              <Square size={16} fill="currentColor" /> Detener
            </button>
          )}
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* Controles de Ingreso (Botones) */}
        <div className="bg-dark-800/80 p-5 rounded-xl border border-white/5 flex flex-col xl:flex-row gap-6 items-center shadow-inner">
          <div className="flex flex-wrap gap-2 justify-center">
            {ROOTS.map(root => (
              <button 
                key={root}
                onClick={() => setSelectedRoot(root)}
                className={`w-11 h-11 rounded-full font-bold text-lg transition-all 
                  ${selectedRoot === root ? 'bg-primary-main text-white drop-shadow-[0_0_10px_rgba(99,102,241,0.6)] scale-110' : 'bg-dark-700 text-gray-400 hover:bg-dark-700/80 hover:text-white'}`}
              >
                {root}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {TYPES.map(type => (
              <button 
                key={type.val}
                onClick={() => setSelectedType(type.val)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all 
                  ${selectedType === type.val ? 'bg-accent-blue text-white shadow-lg shadow-blue-500/30' : 'bg-dark-700 text-gray-400 hover:bg-dark-700/80 hover:text-white'}`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <button 
            onClick={handleAdd}
            className="xl:ml-auto bg-dark-700 hover:bg-white/10 text-white px-5 py-3 rounded-xl flex items-center gap-2 transition-all border border-white/10 font-bold w-full xl:w-auto justify-center"
          >
            <Plus size={20} /> Insertar al Loop
          </button>
        </div>

        {/* Timeline Visual */}
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[120px] items-center p-2 snap-x">
          {blocks.length === 0 ? (
            <div className="flex-1 flex justify-center border-2 border-dashed border-white/10 rounded-xl p-8">
              <p className="text-gray-500 font-medium">Línea de tiempo vacía. Combina un Tono Raíz y un Modificador arriba, luego insértalo.</p>
            </div>
          ) : (
            blocks.map(block => (
              <div 
                key={block.id}
                className={`relative flex-shrink-0 w-28 h-28 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-300 group snap-center
                  ${activeBlockId === block.id 
                    ? 'border-primary-main bg-indigo-900/40 scale-105 drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]' 
                    : 'border-white/10 bg-dark-800 hover:border-white/20'
                  }
                `}
              >
                <span className="text-3xl font-extrabold text-white/90">{block.chord?.name || "Silencio"}</span>
                
                <button 
                  onClick={() => onRemoveBlock(block.id)}
                  className="absolute -top-3 -right-3 bg-dark-900 border border-accent-red p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-accent-red hover:scale-110"
                >
                  <Trash2 size={14} color="white" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
