import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Search, Filter, Layers, Clock } from 'lucide-react';
import { api } from '../../api/client.js';
import { AuditLog } from '../../types/index.js';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    api.getAuditLogs({ limit: 50 })
      .then((res) => {
        if (res.success) setLogs(res.logs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <span className="bg-purple-50 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-purple-200/80">
          Institutional Compliance
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Campus Audit Trail & Event Ledger
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Every submission, approval transition, equipment checkout, return inspection, and incident recorded with cryptographic integrity.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden text-xs">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm">Chronological Audit Events ({logs.length})</h3>
          <span className="text-slate-400 text-[11px] font-mono">System of Record</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit history...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 italic">No audit events recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Actor</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Entity Type</th>
                  <th className="px-5 py-3.5">Entity ID</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{log.actorName}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-teal-800 text-[11px]">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{log.entityType}</td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400 truncate max-w-[120px]">
                      {log.entityId}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {log.details ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-teal-700 hover:text-teal-800 font-bold hover:underline cursor-pointer"
                        >
                          View Payload
                        </button>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-elevated border border-slate-200/90 w-full max-w-lg p-6 space-y-4 text-xs animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Audit Payload Details</h3>
                <span className="font-mono text-[10px] text-teal-700 font-bold">{selectedLog.action}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl overflow-x-auto text-[11px] font-mono shadow-inner max-h-80">
              {JSON.stringify(selectedLog.details, null, 2)}
            </pre>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
