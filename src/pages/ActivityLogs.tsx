import { useState } from 'react';
import { FileText, ShoppingCart, Receipt, Store, CheckCircle, LogIn } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { cn } from '../lib/utils';
import type { ActivityLog } from '../types';

const CFG: Record<ActivityLog['type'], { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  rfq: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  quotation: { icon: ShoppingCart, color: 'text-amber-600', bg: 'bg-amber-100' },
  po: { icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  invoice: { icon: Receipt, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  vendor: { icon: Store, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  approval: { icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100' },
  auth: { icon: LogIn, color: 'text-gray-600', bg: 'bg-gray-100' },
};

const LABELS: Record<ActivityLog['type'], string> = { rfq: 'RFQ', quotation: 'Quotation', po: 'Purchase Order', invoice: 'Invoice', vendor: 'Vendor', approval: 'Approval', auth: 'Auth' };
const PAGE_SIZE = 15;

export default function ActivityLogs() {
  const { logs } = useData();
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const filtered = logs.filter((l) => filterType === 'all' || l.type === filterType);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const fmtTime = (ts: string) => { const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000); if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; };
  const fmtFull = (ts: string) => new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1><p className="text-gray-500 text-sm mt-0.5">{logs.length} total events</p></div>
      <div className="flex items-center gap-3">
        <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Activity</SelectItem>{(Object.keys(LABELS) as ActivityLog['type'][]).map((t) => <SelectItem key={t} value={t}>{LABELS[t]}</SelectItem>)}</SelectContent>
        </Select>
        <span className="text-sm text-gray-400">{filtered.length} events</span>
      </div>
      {paged.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center"><FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">No activity logs</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {paged.map((log) => {
              const cfg = CFG[log.type] ?? CFG.auth;
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg)}><Icon className={cn('w-4 h-4', cfg.color)} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium">{log.action}</p>
                    <div className="flex items-center gap-2 mt-0.5"><span className="text-xs text-gray-400">by {log.actorName}</span><span className="text-gray-300">·</span><span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>{LABELS[log.type]}</span></div>
                  </div>
                  <div className="text-right flex-shrink-0"><p className="text-xs text-gray-400" title={fmtFull(log.timestamp)}>{fmtTime(log.timestamp)}</p><p className="text-xs text-gray-300 mt-0.5">{fmtFull(log.timestamp)}</p></div>
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
