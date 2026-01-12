
import React, { useState, useEffect, useCallback, useRef } from 'react';
import CameraView from './components/CameraView';
import AccessibilityOverlay from './components/AccessibilityOverlay';
import { analyzeScene, getDetailedDescription } from './services/geminiService';
import { Obstacle, AppState, DangerLevel, SceneDescription } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isScanning: false,
    isDescribing: false,
    lastDescription: null,
    obstacles: [],
    error: null,
  });

  const [sceneData, setSceneData] = useState<SceneDescription | null>(null);
  const lastCaptureRef = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Speech
  useEffect(() => {
    if ('speechSynthesis' in window) {
      utteranceRef.current = new SpeechSynthesisUtterance();
      utteranceRef.current.rate = 1.1;
      utteranceRef.current.pitch = 1.0;
    }
  }, []);

  const speak = (text: string, interrupt = true) => {
    if (!utteranceRef.current || !window.speechSynthesis) return;
    if (interrupt) window.speechSynthesis.cancel();
    utteranceRef.current.text = text;
    window.speechSynthesis.speak(utteranceRef.current);
  };

  const handleFrame = useCallback(async (base64: string) => {
    lastCaptureRef.current = base64;
    
    // Auto-analysis loop
    if (state.isScanning) {
      try {
        const result = await analyzeScene(base64);
        setSceneData(result);
        
        // Critical alerts
        const critical = result.obstacles.find(o => o.dangerLevel === DangerLevel.CRITICAL);
        if (critical) {
          speak(`Danger: ${critical.label} at ${critical.distance} meters. ${result.navAdvice}`);
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        } else if (result.obstacles.length > 0) {
          // Normal proximity feedback
          const nearest = result.obstacles[0];
          speak(`${nearest.label}, ${nearest.distance} meters.`);
        }
      } catch (err) {
        console.error("Scan error", err);
      }
    }
  }, [state.isScanning]);

  const toggleScanning = () => {
    const nextState = !state.isScanning;
    setState(prev => ({ ...prev, isScanning: nextState }));
    speak(nextState ? "Obstacle detection activated. Scanning environment." : "Scanning paused.");
  };

  const describeCurrentScene = async () => {
    if (!lastCaptureRef.current) {
      speak("No camera image available yet.");
      return;
    }
    
    setState(prev => ({ ...prev, isDescribing: true }));
    speak("Analyzing scene...");

    try {
      const description = await getDetailedDescription(lastCaptureRef.current);
      setState(prev => ({ ...prev, isDescribing: false, lastDescription: description }));
      speak(description);
    } catch (err) {
      setState(prev => ({ ...prev, isDescribing: false, error: "Failed to analyze scene" }));
      speak("I encountered an error describing the scene.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col select-none overflow-hidden">
      {/* Visual Header for status */}
      <div className="h-1 bg-yellow-400" />
      
      {/* Camera / Interaction Area */}
      <div className="relative flex-1">
        <CameraView 
          onFrame={handleFrame} 
          isScanning={state.isScanning} 
          scanInterval={5000} // Scan every 5 seconds for balance
        />
        
        <AccessibilityOverlay 
          obstacles={sceneData?.obstacles || []}
          summary={state.lastDescription || sceneData?.summary || "System ready. Tap below to start."}
          isProcessing={state.isDescribing}
        />
      </div>

      {/* Massive Control Bar for Blind Users */}
      <div className="h-48 flex flex-row border-t-4 border-yellow-400">
        <button 
          onClick={toggleScanning}
          className={`flex-1 flex flex-col items-center justify-center transition-colors ${state.isScanning ? 'bg-red-700 active:bg-red-800' : 'bg-black active:bg-zinc-800'}`}
          aria-label={state.isScanning ? "Stop Scanning" : "Start Scanning"}
        >
          <div className={`w-12 h-12 rounded-full border-4 border-white mb-2 ${state.isScanning ? 'bg-white scale-75' : 'bg-red-600 animate-pulse'}`} />
          <span className="text-white font-black text-xl uppercase italic">
            {state.isScanning ? "STOP" : "SCAN"}
          </span>
          <span className="text-white text-[10px] opacity-60">LIDAR MODE</span>
        </button>

        <button 
          onClick={describeCurrentScene}
          disabled={state.isDescribing}
          className="flex-1 flex flex-col items-center justify-center bg-yellow-400 active:bg-yellow-500 text-black border-l-4 border-black"
          aria-label="Describe Scene"
        >
          <div className="mb-2">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 9a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5 5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5Z" />
            </svg>
          </div>
          <span className="font-black text-xl uppercase italic leading-none">DESCRIBE</span>
          <span className="text-[10px] font-bold opacity-70">SCENE AI</span>
        </button>
      </div>

      {/* Battery / Performance optimization note */}
      <div className="h-6 bg-zinc-900 text-[8px] flex items-center justify-center text-zinc-500 uppercase font-bold tracking-widest px-4">
        <span>VisionLink v1.0.4 • Optimized for Offline Haptics • Proactive LiDAR Simulation</span>
      </div>
    </div>
  );
};

export default App;
