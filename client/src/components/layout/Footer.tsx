import React from 'react';
import { Layers, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-base tracking-tight">ResourceLoop</span>
                <span className="bg-teal-900/60 text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-teal-700/50">
                  Apex Campus Edition
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                AI-Powered College Resource Sharing, Event Permission & Equipment Management
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-slate-200 font-medium">Core Scheduling Engine Operational</span>
            </span>
            <span className="text-slate-500 font-mono text-[11px]">v1.0.0</span>
          </div>
        </div>

        <div className="border-t border-slate-800/80 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 ResourceLoop. All institutional rights reserved.</p>
          <div className="flex items-center space-x-6 text-[11px] text-slate-400">
            <span className="hover:text-slate-300 transition-colors cursor-default">Privacy by Default</span>
            <span className="hover:text-slate-300 transition-colors cursor-default">Audit-Verified Workflows</span>
            <span className="hover:text-slate-300 transition-colors cursor-default">Fair Allocation System</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
