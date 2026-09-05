"use client";

import { Minus, Square, X } from "lucide-react";

interface DesktopTitleBarProps {
  appName?: string;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
}

export function DesktopTitleBar({
  appName = "Hotel Management",
  onMinimize,
  onMaximize,
  onClose,
}: DesktopTitleBarProps) {
  // These will be replaced with actual Tauri API calls later
  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    } else {
      // Placeholder for Tauri minimize command
      console.log("Minimize window");
    }
  };

  const handleMaximize = () => {
    if (onMaximize) {
      onMaximize();
    } else {
      // Placeholder for Tauri maximize command
      console.log("Maximize window");
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Placeholder for Tauri close command
      console.log("Close window");
    }
  };

  return (
    <div className="flex items-center justify-between h-12 bg-slate-900 text-white select-none" data-tauri-drag-region>
      {/* App Name / Logo Area */}
      <div className="flex items-center px-4 gap-3" data-tauri-drag-region>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">H</span>
        </div>
        <span className="font-semibold text-sm">{appName}</span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center">
        <button
          onClick={handleMinimize}
          className="h-12 w-12 flex items-center justify-center hover:bg-slate-800 transition-colors"
          aria-label="Minimize"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-12 w-12 flex items-center justify-center hover:bg-slate-800 transition-colors"
          aria-label="Maximize"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleClose}
          className="h-12 w-12 flex items-center justify-center hover:bg-red-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
