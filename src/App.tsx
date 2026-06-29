import React from 'react';

function App() {
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-glow/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-[120px] pointer-events-none" />
      
      <main className="glass-panel p-12 max-w-4xl w-full relative z-10 text-center">
        <h1 className="text-5xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          FretLoop
        </h1>
        <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
          Sistema de análisis armónico y práctica de guitarra. <br/>
          (Fase 1: Infraestructura Core establecida)
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="bg-dark-800/50 border border-white/5 p-6 rounded-xl text-left">
            <h3 className="text-xl font-bold mb-2 text-accent-red">Motor Teórico</h3>
            <p className="text-sm text-white/50">Tonal.js integrado. Listo para detectar atajos mentales e intervalos.</p>
          </div>
          <div className="bg-dark-800/50 border border-white/5 p-6 rounded-xl text-left">
            <h3 className="text-xl font-bold mb-2 text-accent-blue">Motor de Audio</h3>
            <p className="text-sm text-white/50">Tone.js configurado. Secuenciador y síntesis a la espera.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
