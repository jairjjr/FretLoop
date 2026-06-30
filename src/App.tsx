import { useState, useEffect, useMemo } from 'react';
import { Sequencer } from './components/Sequencer/Sequencer';
import { TheoryPanel } from './components/TheoryPanel/TheoryPanel';
import { Fretboard } from './components/Fretboard/Fretboard';
import { TheoryEngine } from './core/TheoryEngine';
import { AudioEngine } from './audio/AudioEngine';
import { TimeBlock, TuningName, TimeSignature, ScaleSuggestion } from './core/types';

function App() {
  // Estado Principal
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  
  // Ajustes de Sequencer
  const [timeSignature, setTimeSignature] = useState<TimeSignature>("4/4");
  const [bpm, setBpm] = useState(120);

  // Ajustes de Fretboard
  const [tuningName, setTuningName] = useState<TuningName>("Standard");

  // Análisis Teórico y Escalas
  const [currentChordName, setCurrentChordName] = useState<string | null>(null);
  const [selectedScale, setSelectedScale] = useState<ScaleSuggestion | null>(null);
  
  // Computar Análisis de la progresión global
  const progression = useMemo(() => {
    return TheoryEngine.analyzeProgression(blocks.map(b => b.chord?.name || ""));
  }, [blocks]);

  // Autoseleccionar la primera escala sugerida cuando cambia la lección
  useEffect(() => {
    if (progression.lesson && progression.lesson.scaleSuggestions.length > 0) {
      setSelectedScale(progression.lesson.scaleSuggestions[0]);
    } else {
      setSelectedScale(null);
    }
  }, [progression.lesson]);



  // Actualización dinámica: Si el usuario cambia los bloques mientras suena, actualiza la partitura
  useEffect(() => {
    if (isPlaying) {
      AudioEngine.updateSequence(blocks);
    }
  }, [blocks, isPlaying]);

  // Sincronización con el motor de audio
  useEffect(() => {
    AudioEngine.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    AudioEngine.setTimeSignature(timeSignature);
  }, [timeSignature]);

  const handlePlay = async () => {
    if (blocks.length === 0) return;
    
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
        
        {/* Cabecera Minimalista */}
        <div className="text-center md:text-left mb-4">
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
            FretLoop
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Sistema de análisis armónico y práctica de guitarra.</p>
        </div>

        {/* 1. SECCIÓN SUPERIOR: SEQUENCER */}
        <Sequencer 
          blocks={blocks}
          onAddBlock={handleAddBlock}
          onRemoveBlock={handleRemoveBlock}
          onPlay={handlePlay}
          onStop={handleStop}
          isPlaying={isPlaying}
          activeBlockId={activeBlockId}
          bpm={bpm}
          onBpmChange={setBpm}
          timeSignature={timeSignature}
          onTimeSignatureChange={setTimeSignature}
        />

        {/* 2. SECCIÓN MEDIA: TEORÍA Y ESCALAS */}
        <TheoryPanel 
          lesson={progression.lesson}
          selectedScaleId={selectedScale?.id || null}
          onSelectScale={setSelectedScale}
        />

        {/* 3. SECCIÓN INFERIOR: DIAPASÓN */}
        <Fretboard 
          tuningName={tuningName}
          onTuningChange={setTuningName}
          scaleRoot={selectedScale ? selectedScale.scaleName.split(" ")[0] : null}
          scaleNotes={selectedScale ? selectedScale.notes : []}
        />

      </main>
    </div>
  );
}

export default App;
