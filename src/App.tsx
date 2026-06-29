import { useState, useEffect } from 'react';
import { Sequencer } from './components/Sequencer/Sequencer';
import { Fretboard } from './components/Fretboard/Fretboard';
import { TheoryEngine } from './core/TheoryEngine';
import { AudioEngine } from './audio/AudioEngine';
import { TimeBlock, TUNINGS, TuningName, TimeSignature } from './core/types';
import { Settings } from 'lucide-react';

function App() {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  
  // States para ajustes (Settings)
  const [tuningName, setTuningName] = useState<TuningName>("Standard");
  const [timeSignature, setTimeSignature] = useState<TimeSignature>("4/4");
  const [bpm, setBpm] = useState(120);

  // Análisis y Fretboard State
  const [currentChordName, setCurrentChordName] = useState<string | null>(null);
  
  // Análisis en tiempo real de toda la progresión
  const progression = TheoryEngine.analyzeProgression(blocks.map(b => b.chord?.name || ""));
  // Acorde sonando en este momento exacto
  const currentChordData = currentChordName ? TheoryEngine.parseChord(currentChordName) : null;

  // Sincronización con el motor de audio
  useEffect(() => {
    AudioEngine.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    AudioEngine.setTimeSignature(timeSignature);
  }, [timeSignature]);

  const handlePlay = async () => {
    if (blocks.length === 0) return;
    
    await AudioEngine.init();
    setIsPlaying(true);
    
    AudioEngine.playSequence(blocks, (chordName, blockId) => {
      setCurrentChordName(chordName);
      setActiveBlockId(blockId);
    });
  };

  const handleStop = () => {
    AudioEngine.stop();
    setIsPlaying(false);
    setCurrentChordName(null);
    setActiveBlockId(null);
  };

  const handleAddBlock = (block: TimeBlock) => {
    setBlocks([...blocks, block]);
  };

  const handleRemoveBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (activeBlockId === id) {
      handleStop();
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-glow/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-blue/10 rounded-full blur-[150px] pointer-events-none" />
      
      <main className="max-w-6xl w-full relative z-10 flex flex-col gap-8">
        
        {/* Header y Settings */}
        <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              FretLoop
            </h1>
            <p className="text-sm text-white/50 mt-1">
              Motor Analítico: {progression.globalKey !== "Unknown" ? progression.globalKey : "Esperando acordes..."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 bg-dark-800/80 p-3 px-6 rounded-xl border border-white/5 shadow-inner">
            <Settings size={20} className="text-gray-400" />
            
            <div className="flex flex-col">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Afinación</label>
              <select 
                value={tuningName} 
                onChange={e => setTuningName(e.target.value as TuningName)}
                className="bg-transparent text-white font-semibold outline-none cursor-pointer"
              >
                {Object.keys(TUNINGS).map(t => <option key={t} value={t} className="bg-dark-800">{t}</option>)}
              </select>
            </div>

            <div className="w-px h-8 bg-white/10"></div>

            <div className="flex flex-col">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Compás</label>
              <select 
                value={timeSignature} 
                onChange={e => setTimeSignature(e.target.value as TimeSignature)}
                className="bg-transparent text-white font-semibold outline-none cursor-pointer"
              >
                <option value="3/4" className="bg-dark-800">3/4</option>
                <option value="4/4" className="bg-dark-800">4/4</option>
                <option value="5/4" className="bg-dark-800">5/4</option>
                <option value="6/8" className="bg-dark-800">6/8</option>
              </select>
            </div>

            <div className="w-px h-8 bg-white/10"></div>

            <div className="flex flex-col min-w-[100px]">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tempo ({bpm} BPM)</label>
              <input 
                type="range" min="60" max="200" value={bpm} 
                onChange={e => setBpm(Number(e.target.value))}
                className="accent-primary-main cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Diapasón */}
        <Fretboard 
          tuning={TUNINGS[tuningName]}
          rootNote={currentChordData ? currentChordData.root : null}
          activeNotes={currentChordData ? currentChordData.notes : []}
          scaleNotes={progression.shortcut && currentChordData ? progression.shortcut.scaleNotes : []}
        />

        {/* Atajo Pedagógico (Feedback UI) */}
        {progression.shortcut && (
          <div className="bg-gradient-to-r from-accent-yellow/10 to-transparent border border-accent-yellow/20 p-4 rounded-xl -mt-4">
            <h4 className="text-accent-yellow font-bold text-sm flex items-center gap-2">
              💡 Atajo Mental: {progression.shortcut.conceptName}
            </h4>
            <p className="text-gray-400 text-sm mt-1">{progression.shortcut.explanation}</p>
          </div>
        )}

        {/* Constructor de Loops */}
        <Sequencer 
          blocks={blocks}
          onAddBlock={handleAddBlock}
          onRemoveBlock={handleRemoveBlock}
          onPlay={handlePlay}
          onStop={handleStop}
          isPlaying={isPlaying}
          activeBlockId={activeBlockId}
        />

      </main>
    </div>
  );
}

export default App;
