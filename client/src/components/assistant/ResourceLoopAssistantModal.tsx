import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  FileCheck,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../api/client.js';

interface AssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResourceForBooking?: (resourceId: string) => void;
}

export const ResourceLoopAssistantModal: React.FC<AssistantModalProps> = ({
  isOpen,
  onClose,
  onSelectResourceForBooking,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  if (!isOpen) return null;

  const quickPrompts = [
    'Plan a 150-person Hackathon next Friday with Seminar Hall, 2 Projectors and 2 Microphones',
    'Why is request REQ-2026-0001 pending?',
    'Summarize damage incident INC-2026-0001',
    'Find an available seminar hall or conference room for 40 attendees',
  ];

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await api.askAssistant({ query: text });
      if (res.success) {
        setResponse(res.data);
      }
    } catch (err: any) {
      console.error(err);
      setResponse({
        provider: 'RULE_BASED',
        summary: `Error processing query: ${err.message || 'Unable to connect to intelligence engine.'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-elevated border border-slate-200/90 w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm shadow-inner">
              <Sparkles className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base tracking-tight">ResourceLoop Intelligence</h3>
                <span className="bg-white/20 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider border border-white/20">
                  Campus AI Engine
                </span>
              </div>
              <p className="text-xs text-teal-100/90 mt-0.5">
                Natural-language discovery, workflow transparency, and conflict checks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-800">
          {/* Quick Prompts */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Suggested Questions & Demonstrations:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(prompt);
                    handleSend(prompt);
                  }}
                  className="text-left text-xs bg-slate-50 hover:bg-teal-50/80 border border-slate-200/80 hover:border-teal-300/80 p-3 rounded-2xl transition-all duration-150 text-slate-700 hover:text-teal-950 flex items-start space-x-2.5 shadow-subtle group cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="line-clamp-2 leading-relaxed font-medium">{prompt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Response Container */}
          {loading && (
            <div className="p-10 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Querying institutional database records and schedule engines...
              </p>
            </div>
          )}

          {response && !loading && (
            <div className="space-y-4 animate-slide-up">
              {/* Provider Info Banner */}
              <div className="flex items-center justify-between text-[11px] bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-subtle">
                <span className="text-slate-600 font-medium">
                  Engine:{' '}
                  <span className="font-semibold text-slate-900">
                    {response.provider === 'GEMINI'
                      ? 'Live Google Gemini LLM API'
                      : 'Deterministic Institutional Rule Engine (No External API required)'}
                  </span>
                </span>
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 font-bold px-2 py-0.5 rounded-full text-[10px]">
                  Database-Verified
                </span>
              </div>

              {/* Main Summary */}
              <div className="p-4 bg-teal-50/60 border border-teal-200/90 rounded-2xl text-teal-950 leading-relaxed font-medium text-xs sm:text-sm shadow-subtle">
                {response.summary}
              </div>

              {/* Matched Resources List */}
              {response.matchedResources && response.matchedResources.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Matched Resources ({response.matchedResources.length}):
                  </h4>
                  <div className="space-y-2">
                    {response.matchedResources.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between hover:border-teal-300 transition-all duration-150 shadow-subtle"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs">{item.name}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.isAvailable
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200/80'
                              }`}
                            >
                              {item.isAvailable ? 'AVAILABLE' : 'CAPACITY CONFLICT'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{item.matchReason}</p>
                        </div>
                        {onSelectResourceForBooking && (
                          <button
                            onClick={() => {
                              onSelectResourceForBooking(item.id);
                              onClose();
                            }}
                            className="text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 shrink-0 ml-3 flex items-center space-x-1 transition-all cursor-pointer"
                          >
                            <span>Book</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Checklist */}
              {response.checklistSuggestions && response.checklistSuggestions.length > 0 && (
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5 shadow-subtle">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <FileCheck className="w-4 h-4 text-teal-600" />
                    <span>Recommended Event Equipment Checklist</span>
                  </h4>
                  <ul className="space-y-2">
                    {response.checklistSuggestions.map((check: string, idx: number) => (
                      <li key={idx} className="flex items-start space-x-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span>{check}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Workflow Explanation details */}
              {response.workflowExplanation && (
                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2.5 shadow-subtle">
                  <h4 className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>Real-time Workflow Status Breakdown</span>
                  </h4>
                  <p className="text-xs text-amber-900 font-medium">
                    <strong>Pending Review With:</strong> {response.workflowExplanation.pendingWithRole}
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Next Steps:</p>
                    {response.workflowExplanation.nextSteps.map((step: string, i: number) => (
                      <p key={i} className="text-xs text-amber-900 flex items-start space-x-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{step}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Incident summary details */}
              {response.incidentSummary && (
                <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-2.5 text-xs shadow-subtle">
                  <h4 className="font-bold text-rose-800 uppercase tracking-wider text-[11px]">
                    Incident Chronology & Reviewer Digest:
                  </h4>
                  <div className="space-y-1.5">
                    {response.incidentSummary.timeline.map((item: string, i: number) => (
                      <p key={i} className="text-slate-700 leading-relaxed">
                        <span className="font-bold text-rose-700">{i + 1}.</span> {item}
                      </p>
                    ))}
                  </div>
                  <div className="mt-2.5 pt-2.5 border-t border-rose-200/80">
                    <p className="font-bold text-slate-800 mb-1">Open Discrepancy Inquiries:</p>
                    {response.incidentSummary.openQuestions.map((q: string, i: number) => (
                      <p key={i} className="text-slate-600 italic">
                        ? {q}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/70 flex items-center space-x-2.5">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(query)}
            placeholder="Ask about resources, event checklists, pending workflows..."
            className="flex-1 bg-white border border-slate-300/80 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-subtle"
          />
          <button
            onClick={() => handleSend(query)}
            disabled={loading || !query.trim()}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm shadow-teal-600/20 cursor-pointer shrink-0"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
