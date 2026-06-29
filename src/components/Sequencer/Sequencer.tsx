import React, { useState } from 'react';
import { TimeBlock } from '../../core/types';
import { TheoryEngine } from '../../core/TheoryEngine';
import { Play, Square, Plus, Trash2 } from 'lucide-react';

interface SequencerProps {
  blocks: TimeBlock[];
  onAddBlock: (block: TimeBlock) => void;
  onRemoveBlock: (id: string) => void;
  onPlay: () => void;
  onStop: () => void;
  isPlaying: boolean;
  activeBlockId: string | null;
}

const ROOTS = ["C", "D", "E", "F", "G", "A", "B"];
const TYPES = [
  { label: "May", val: "maj" },
  { label: "Men", val: "m" },
  { label: "7", val: "7" },
  { label: "m7", val: "m7" },
  { label: "maj7", val: "maj7" }
];

export const Sequencer: React.FC<SequencerProps> = ({ 
  blocks, onAddBlock, onRemoveBlock, onPlay, onStop, isPlaying, activeBlockId 
}) => {
  const [selectedRoot, setSelectedRoot] = useState("C");
  const [selectedType, setSelectedType] = useState("maj");

  const handleAdd = () => {
    // Si el tipo es "maj", Tonal.js lo entiende sin sufijo para la tríada mayor.
    const chordStr = `${selectedRoot}${selectedType === "maj" ? "" : selectedType}`;
    const parsed = TheoryEngine.parseChord(chordStr);
    
    onAddBlock({
      id: Math.random().toString(36).substring(7),
      chord: parsed,
      durationInBeats: 4 // Fijo a un compás entero por ahora
    });
  };

  return (
    <div className="glass-panel p-6 w-full flex flex-col gap-6 mt-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white/90">Constructor de Loops</h2>
        <div className="flex gap-2">
          {!isPlaying ? (
            <button onClick={onPlay} className="bg-primary-main hover:bg-primary-glow text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-semibold shadow-lg shadow-indigo-500/20">
              <Play size={18} fill="currentColor" /> Reproducir
            </button>
          ) : (
            <button onClick={onStop} className="bg-accent-red hover:bg-red-400 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-semibold shadow-lg shadow-red-500/20">
              <Square size={18} fill="currentColor" /> Detener
            </button>
          )}
        </div>
      </div>

      {/* Controles de Ingreso (Botones) */}
      <div className="bg-dark-800/80 p-5 rounded-xl border border-white/5 flex flex-col md:flex-row gap-6 items-center shadow-inner">
        
        {/* Tono Raíz */}
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

        {/* Modificador (Tipo de acorde) */}
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

        {/* Añadir */}
        <button 
          onClick={handleAdd}
          className="md:ml-auto bg-dark-700 hover:bg-white/10 text-white px-5 py-3 rounded-xl flex items-center gap-2 transition-all border border-white/10"
        >
          <Plus size={20} /> Añadir
        </button>
      </div>

      {/* Timeline Visual */}
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[120px] items-center p-2 snap-x">
        {blocks.length === 0 ? (
          <div className="flex-1 flex justify-center border-2 border-dashed border-white/10 rounded-xl p-8">
            <p className="text-gray-500 font-medium">La línea de tiempo está vacía. Selecciona un acorde arriba y presiona Añadir.</p>
          </div>
        ) : (
          blocks.map(block => (
            <div 
              key={block.id}
              className={`relative flex-shrink-0 w-28 h-28 rounded-xl flex items-center justify-center border-2 transition-all duration-300 group snap-center
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
  );
};
