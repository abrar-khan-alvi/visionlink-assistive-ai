
import React from 'react';
import { Obstacle, DangerLevel } from '../types';

interface AccessibilityOverlayProps {
  obstacles: Obstacle[];
  summary: string | null;
  isProcessing: boolean;
}

const AccessibilityOverlay: React.FC<AccessibilityOverlayProps> = ({ obstacles, summary, isProcessing }) => {
  const getDangerColor = (level: DangerLevel) => {
    switch (level) {
      case DangerLevel.CRITICAL: return 'bg-red-600 text-white border-white';
      case DangerLevel.HIGH: return 'bg-orange-600 text-white border-white';
      case DangerLevel.MEDIUM: return 'bg-yellow-400 text-black border-black';
      case DangerLevel.LOW: return 'bg-green-600 text-white border-white';
      default: return 'bg-zinc-800 text-white';
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col pointer-events-none p-4">
      {/* Header Status */}
      <div className="flex justify-between items-start mb-4">
        <div className="bg-black/80 border-2 border-yellow-400 px-4 py-2 rounded-lg">
          <h1 className="text-yellow-400 font-bold text-xl uppercase tracking-tighter">VisionLink AI</h1>
          <p className="text-white text-xs uppercase opacity-80">LiDAR Mode: Simulation Active</p>
        </div>
        {isProcessing && (
          <div className="bg-yellow-400 text-black px-3 py-1 rounded-full font-bold text-sm animate-pulse">
            ANALYZING...
          </div>
        )}
      </div>

      {/* Main Content Area: Centered Obstacles */}
      <div className="flex-1 flex flex-col justify-center items-center space-y-4">
        {obstacles.length > 0 ? (
          obstacles.map((obs) => (
            <div 
              key={obs.id}
              className={`p-4 rounded-xl border-4 shadow-2xl transform transition-all ${getDangerColor(obs.dangerLevel)} 
                         ${obs.dangerLevel === DangerLevel.CRITICAL ? 'scale-110 animate-bounce' : 'scale-100'}`}
              style={{ width: '80%', maxWidth: '400px' }}
            >
              <div className="flex justify-between items-center">
                <span className="text-2xl font-black uppercase italic">{obs.label}</span>
                <span className="text-3xl font-black">{obs.distance.toFixed(1)}m</span>
              </div>
              <div className="text-sm font-bold opacity-80 mt-1 uppercase">
                Position: {obs.position}
              </div>
            </div>
          ))
        ) : (
          !isProcessing && (
            <div className="bg-green-600/20 border-2 border-green-500 px-6 py-4 rounded-xl text-green-400 font-bold text-xl uppercase">
              Path Clear
            </div>
          )
        )}
      </div>

      {/* Footer Summary */}
      {summary && (
        <div className="mt-auto bg-black/90 border-t-4 border-yellow-400 p-4 -mx-4">
          <p className="text-white text-lg font-medium leading-tight">
            {summary}
          </p>
        </div>
      )}
    </div>
  );
};

export default AccessibilityOverlay;
