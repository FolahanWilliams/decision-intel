"use client";

import { Loader2, Terminal } from 'lucide-react';

export default function RootLoading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
            {/* Scanline effect wrapper */}
            <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                        background: 'linear-gradient(rgba(255, 159, 10, 0.1) 50%, transparent 50%)',
                        backgroundSize: '100% 4px',
                        zIndex: 1
                    }}
                />

                {/* Animated Scanline */}
                <div className="absolute top-0 left-0 w-full h-1 bg-accent-primary opacity-30 shadow-[0_0_15px_rgba(255,159,10,0.8)]"
                    style={{
                        animation: 'scanline 3s linear infinite',
                        zIndex: 2
                    }}
                />

                <div className="flex flex-col items-center gap-6 z-10">
                    <div className="relative">
                        <Loader2 size={64} className="animate-spin text-accent-primary" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Terminal size={24} className="text-accent-primary opacity-80" />
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <h2 className="text-xl font-bold tracking-[0.2em] text-accent-primary animate-pulse">
                            SYSTEM_BOOTING
                        </h2>
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-accent-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-2 h-2 bg-accent-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" />
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-muted mt-2 font-mono">
                            Synchronizing data structures...
                        </p>
                    </div>
                </div>

                {/* Backdrop Glow */}
                <div className="absolute w-[300px] h-[300px] bg-accent-primary rounded-full blur-[120px] opacity-10" />
            </div>

            <style jsx global>{`
        @keyframes scanline {
          0% { top: -5%; }
          100% { top: 105%; }
        }
      `}</style>
        </div>
    );
}
