// Dynamic Web Audio API Sound Generator
// Avoids requiring external file resources, ensuring 100% offline reliability.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playAlarm(theme: 'classic' | 'digital' | 'soft' | 'nature', volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume * 0.3, now); // scale to prevent clipping

    if (theme === 'classic') {
      // Retro Windows 95 dual beep
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.setValueAtTime(880, now + 0.1);
      osc1.frequency.setValueAtTime(1200, now + 0.15);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, now); // A4
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start(now);
      osc1.stop(now + 0.4);
      osc2.start(now);
      osc2.stop(now + 0.4);
    } else if (theme === 'digital') {
      // Triple retro futuristic digital chime
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(volume * 0.2, now + idx * 0.08 + 0.01);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
        
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } else if (theme === 'soft') {
      // Warm marimba/chime
      const baseFreqs = [329.63, 493.88, 659.25, 987.77]; // E4, B4, E5, B5
      baseFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(volume * 0.25, now + idx * 0.05 + 0.02);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.6);
        
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.7);
      });
    } else {
      // Nature-like calming organic click/bell
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
      
      oscGain.gain.setValueAtTime(volume * 0.3, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    console.warn("Failed to play synthesized sound:", e);
  }
}

export function playTick(volume: number = 0.2) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(3000, now); // brief click
    
    gainNode.gain.setValueAtTime(volume * 0.05, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.03);
  } catch (e) {
    // Ignore context warnings
  }
}
export function playBtnSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    
    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) {
    // Ignore
  }
}
