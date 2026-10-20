import { useState, useEffect, useMemo } from 'react';
import { Scale } from 'tonal';
import { Sequencer } from './components/Sequencer/Sequencer';
import { TheoryPanel } from './components/TheoryPanel/TheoryPanel';
import { Fretboard } from './components/Fretboard/Fretboard';
import { TheoryEngine, PROGRESSION_PRESETS } from './core/TheoryEngine';
import { AudioEngine } from './audio/AudioEngine';
import { 
  TimeBlock, 
  TuningName, 
  TimeSignature, 
  ScaleSuggestion, 
  FretboardDisplayMode, 
  ProgressionPreset 
} from './core/types';
import { Music, Activity } from 'lucide-react';

function App() {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  
  const [timeSignature, setTimeSignature] = useState<TimeSignature>("4/4");
  const [bpm, setBpm] = useState(110);

  const [tuningName, setTuningName] = useState<TuningName>("Standard");
  const [displayMode, setDisplayMode] = useState<FretboardDisplayMode>("notes");

  const [isDrumsMuted, setIsDrumsMuted] = useState(false);
  const [isBassMuted, setIsBassMuted] = useState(false);
  const [isKeysMuted, setIsKeysMuted] = useState(false);

  const [selectedScale, setSelectedScale] = useState<ScaleSuggestion | null>(null);
  
  const progression = useMemo(() => {
    return TheoryEngine.analyzeProgression(blocks.map(b => b.chord?.name || ""));
  }, [blocks]);

  // Extraer las notas del acorde actualmente activo durante la reproducción
  const activeChordNotes = useMemo(() => {
    if (!activeBlockId) return [];
    const activeBlock = blocks.find(b => b.id === activeBlockId);
    return activeBlock?.chord?.notes || [];
  }, [activeBlockId, blocks]);

  const scaleIntervals = useMemo(() => {
    if (!selectedScale) return [];
    return Scale.get(selectedScale.scaleName).intervals || [];
  }, [selectedScale]);

  // Selección automática de la escala principal al cambiar el análisis
  useEffect(() => {
    if (progression.lesson && progression.lesson.scaleSuggestions.length > 0) {
      setSelectedScale(progression.lesson.scaleSuggestions[0]);
    } else {
      setSelectedScale(null);
    }
  }, [progression.lesson]);

  useEffect(() => {
    if (isPlaying) {
      AudioEngine.updateSequence(blocks);
    }
  }, [blocks, isPlaying]);

  useEffect(() => {
    AudioEngine.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    AudioEngine.setTimeSignature(timeSignature);
  }, [timeSignature]);

  useEffect(() => {
    AudioEngine.setMutes(isDrumsMuted, isBassMuted, isKeysMuted);
  }, [isDrumsMuted, isBassMuted, isKeysMuted]);

  const handlePlay = async () => {
    if (blocks.length === 0) return;
    setIsPlaying(true);
    AudioEngine.playSequence(blocks, (_chordName, blockId) => {
      setActiveBlockId(blockId);
    });
  };

  const handleStop = () => {
    AudioEngine.stop();
    setIsPlaying(false);
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

  const handleMoveBlock = (id: string, direction: "left" | "right") => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx === -1) return;
    const targetIdx = direction === "left" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const copy = [...blocks];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    setBlocks(copy);
  };

  const handleDuplicateBlock = (id: string) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx === -1) return;
    const target = blocks[idx];
    const cloned: TimeBlock = {
      ...target,
      id: Math.random().toString(36).substring(7)
    };
    const copy = [...blocks];
    copy.splice(idx + 1, 0, cloned);
    setBlocks(copy);
  };

  const handleLoadPreset = (preset: ProgressionPreset) => {
    handleStop();
    setBpm(preset.bpm);
    setTimeSignature(preset.timeSignature);
    const beatsPerBar = parseInt(preset.timeSignature.split('/')[0]);
    const newBlocks: TimeBlock[] = preset.chords.map(c => ({
      id: Math.random().toString(36).substring(7),
      chord: TheoryEngine.parseChord(c.chordName),
      durationInBeats: beatsPerBar * c.bars
    }));
    setBlocks(newBlocks);
  };

  const handleNoteClick = (noteName: string) => {
    AudioEngine.playNote(noteName);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 flex flex-col items-center bg-[#07080c] text-white">
      <main className="max-w-6xl w-full flex flex-col gap-6 sm:gap-8">
        
        {/* Cabecera Editorial Luthier */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-black font-black text-lg shadow-lg shadow-amber-500/20">
              <Music size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  FretLoop
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Luthier Edition
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Suite de análisis armónico, entrenamiento auditivo y visualización del diapasón
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
              <Activity size={13} className="text-amber-500" />
              <span>{blocks.length} {blocks.length === 1 ? 'acorde' : 'acordes'} configurados</span>
            </span>
          </div>
        </header>

        {/* 1. SECCIÓN SUPERIOR: SEQUENCER */}
        <Sequencer 
          blocks={blocks}
          onAddBlock={handleAddBlock}
          onRemoveBlock={handleRemoveBlock}
          onMoveBlock={handleMoveBlock}
          onDuplicateBlock={handleDuplicateBlock}
          onLoadPreset={handleLoadPreset}
          onPlay={handlePlay}
          onStop={handleStop}
          isPlaying={isPlaying}
          activeBlockId={activeBlockId}
          bpm={bpm}
          onBpmChange={setBpm}
          timeSignature={timeSignature}
          onTimeSignatureChange={setTimeSignature}
          isDrumsMuted={isDrumsMuted}
          onDrumsMuteChange={setIsDrumsMuted}
          isBassMuted={isBassMuted}
          onBassMuteChange={setIsBassMuted}
          isKeysMuted={isKeysMuted}
          onKeysMuteChange={setIsKeysMuted}
        />

        {/* 2. SECCIÓN MEDIA: TEORÍA Y ESCALAS */}
        <TheoryPanel 
          lesson={progression.lesson}
          selectedScaleId={selectedScale?.id || null}
          onSelectScale={setSelectedScale}
          onLoadSample={() => handleLoadPreset(PROGRESSION_PRESETS[0])}
        />

        {/* 3. SECCIÓN INFERIOR: DIAPASÓN INTERACTIVO */}
        <Fretboard 
          tuningName={tuningName}
          onTuningChange={setTuningName}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          scaleRoot={selectedScale ? selectedScale.scaleName.split(" ")[0] : null}
          scaleNotes={selectedScale ? selectedScale.notes : []}
          scaleIntervals={scaleIntervals}
          activeChordNotes={activeChordNotes}
          onNoteClick={handleNoteClick}
        />

      </main>
    </div>
  );
}

export default App;

