import React from 'react';
import { TheoryLesson, ScaleSuggestion } from '../../core/types';
import { Compass, CheckCircle2, Music2 } from 'lucide-react';

interface TheoryPanelProps {
  lesson: TheoryLesson | null;
  selectedScaleId: string | null;
  onSelectScale: (scale: ScaleSuggestion) => void;
  onLoadSample?: () => void;
}

export const TheoryPanel: React.FC<TheoryPanelProps> = ({ 
  lesson, 
  selectedScaleId, 
  onSelectScale,
  onLoadSample 
}) => {
  if (!lesson) {
    return (
      <div className="w-full bg-[#11131a] p-8 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-3">
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400">
          <Compass size={28} />
        </div>
        <h3 className="text-base font-bold text-gray-200">Laboratorio de Análisis Armónico</h3>
        <p className="text-xs text-gray-400 max-w-md">
          Inserta acordes en la línea de tiempo superior para detectar el centro tonal, modulaciones y escalas recomendadas para solear en el diapasón.
        </p>
        {onLoadSample && (
          <button
            onClick={onLoadSample}
            className="mt-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold transition-colors"
          >
            Cargar progresión de muestra
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-[#11131a] p-5 md:p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-5">
      {/* Cabecera del Centro Tonal */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex-shrink-0">
          <Compass size={24} />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-amber-500/90">Centro Tonal Detectado</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">{lesson.tonalCenter}</h2>
          <p className="text-xs md:text-sm text-gray-300 mt-1 leading-relaxed max-w-3xl whitespace-pre-line">
            {lesson.explanation}
          </p>
        </div>
      </div>

      {/* Selector de Escalas Sugeridas */}
      <div className="border-t border-white/5 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Music2 size={13} className="text-amber-500" />
            Escalas para iluminar en el diapasón
          </h3>
          <span className="text-[11px] text-gray-500">Selecciona una escala para mapear sus notas</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lesson.scaleSuggestions.map(scale => {
            const isSelected = selectedScaleId === scale.id;
            return (
              <button
                key={scale.id}
                onClick={() => onSelectScale(scale)}
                className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between gap-2
                  ${isSelected 
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40' 
                    : 'bg-[#0b0c10] border-white/5 hover:border-white/15 hover:bg-[#161822]'
                  }
                `}
              >
                <div className="flex items-center justify-between w-full">
                  <h4 className={`font-bold text-xs ${isSelected ? 'text-amber-400' : 'text-gray-200'}`}>
                    {scale.name}
                  </h4>
                  {isSelected && (
                    <CheckCircle2 size={14} className="text-amber-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-gray-400 leading-normal">{scale.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

