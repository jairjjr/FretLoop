import { TheoryLesson, ScaleSuggestion } from '../../core/types';
import { Lightbulb, Info } from 'lucide-react';

interface TheoryPanelProps {
  lesson: TheoryLesson | null;
  selectedScaleId: string | null;
  onSelectScale: (scale: ScaleSuggestion) => void;
}

export const TheoryPanel: React.FC<TheoryPanelProps> = ({ lesson, selectedScaleId, onSelectScale }) => {
  if (!lesson) {
    return (
      <div className="glass-panel p-8 w-full flex flex-col items-center justify-center text-center opacity-50 border-dashed border-2 border-white/20">
        <Lightbulb size={32} className="text-gray-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-400">Escuela de Improvisación</h3>
        <p className="text-sm text-gray-500 mt-2">Añade acordes en el constructor de arriba para recibir una clase teórica y escalas sugeridas.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 w-full flex flex-col gap-6 bg-gradient-to-br from-dark-800 to-indigo-900/10">
      
      {/* Cabecera Lección */}
      <div className="flex items-start gap-4">
        <div className="bg-primary-main/20 p-3 rounded-xl border border-primary-main/30">
          <Lightbulb size={24} className="text-primary-main" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white/90">Centro Tonal: {lesson.tonalCenter}</h2>
          <p className="text-gray-400 text-sm mt-1 leading-relaxed max-w-3xl">
            {lesson.explanation}
          </p>
        </div>
      </div>

      {/* Botones de Sugerencia de Escala */}
      <div className="mt-2 border-t border-white/10 pt-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Info size={14} /> Selecciona una escala para iluminar en el diapasón:
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {lesson.scaleSuggestions.map(scale => (
            <button
              key={scale.id}
              onClick={() => onSelectScale(scale)}
              className={`p-4 rounded-xl border text-left transition-all duration-300 group
                ${selectedScaleId === scale.id 
                  ? 'bg-accent-yellow/10 border-accent-yellow/50 drop-shadow-[0_0_15px_rgba(234,179,8,0.15)]' 
                  : 'bg-dark-900/50 border-white/5 hover:border-accent-yellow/30 hover:bg-dark-800'}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-bold text-sm ${selectedScaleId === scale.id ? 'text-accent-yellow' : 'text-gray-300 group-hover:text-white'}`}>
                  {scale.name}
                </h4>
                {selectedScaleId === scale.id && (
                  <span className="w-2 h-2 rounded-full bg-accent-yellow animate-pulse"></span>
                )}
              </div>
              <p className="text-xs text-gray-500">{scale.description}</p>
            </button>
          ))}
        </div>
      </div>
      
    </div>
  );
};
