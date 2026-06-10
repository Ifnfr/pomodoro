import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PictureInPicture } from 'lucide-react';

export function PipWrapper({ isPip, onClose, children }: { isPip: boolean, onClose: () => void, children: React.ReactNode }) {
  const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isPip) {
      if (pipContainer) setPipContainer(null);
      return;
    }

    let pipWindow: any = null;
    const startPip = async () => {
      try {
        if (!('documentPictureInPicture' in window)) {
          alert('Focus Popup (Always on Top) is not supported in this browser. Please use Chrome/Edge.');
          onClose();
          return;
        }

        pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 440,
          height: 600,
        });

        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
            const style = document.createElement('style');
            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
          } catch (e) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = styleSheet.type;
            link.media = styleSheet.media.mediaText;
            link.href = styleSheet.href;
            pipWindow.document.head.appendChild(link);
          }
        });

        const newContainer = pipWindow.document.createElement('div');
        newContainer.id = "pip-root";
        newContainer.className = "h-screen w-full bg-[#0a0a0a] text-white"; 
        pipWindow.document.body.appendChild(newContainer);
        setPipContainer(newContainer);

        pipWindow.addEventListener("pagehide", () => {
          onClose();
        });
      } catch (err) {
        console.error("PIP Error:", err);
        alert('Failed to enter Focus Popup mode. ' + (err as any)?.message);
        onClose();
      }
    };
    startPip();

    return () => {
      if (pipWindow) {
        pipWindow.close();
      }
    };
  }, [isPip]);

  if (isPip && pipContainer) {
    return (
      <>
        {createPortal(children, pipContainer)}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/40 backdrop-blur-sm z-50 relative h-full">
          <PictureInPicture size={48} className="text-white/50 mb-4" />
          <h2 className="text-xl font-bold mb-2">Focus Popup Active</h2>
          <p className="text-sm text-white/50 mb-6">Your app is running in an always-on-top window.</p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-full font-medium transition-colors"
          >
            Return to Main Window
          </button>
        </div>
      </>
    );
  }

  if (isPip && !pipContainer) {
    // Render a placeholder or nothing while opening
    return (
      <div className="flex-1 flex items-center justify-center relative z-50">
        <div className="animate-pulse">Opening Pop Out window...</div>
      </div>
    );
  }

  return <>{children}</>;
}
