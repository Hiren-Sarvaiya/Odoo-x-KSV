import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

export default function QuotationComparison() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { rfqs, quotations, vendors, upsertQuotation, upsertRFQ, addLog } = useData();
  const { user } = useAuth();
  const rfq = rfqs.find((r) => r.id === id);
  const rfqQuotes = quotations.filter((q) => q.rfqId === id && q.status !== 'Rejected');
  if (!rfq) return <div className="text-center py-20">RFQ not found</div>;
  const vById = (vid: string) => vendors.find((v) => v.id === vid);
  const fmtC = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const getPrice = (q: typeof rfqQuotes[0], liId: string) => q.lineItems.find((l) => l.rfqItemId === liId)?.unitPrice ?? 0;
  const lowestP = (liId: string) => Math.min(...rfqQuotes.map((q) => getPrice(q, liId)));
  const lowestD = Math.min(...rfqQuotes.map((q) => q.deliveryDays));
  const lowestT = Math.min(...rfqQuotes.map((q) => q.totalAmount));

  const selectWinner = (qid: string) => {
    rfqQuotes.forEach((q) => upsertQuotation({ ...q, status: q.id === qid ? 'Selected' : 'Under Review' }));
    upsertRFQ({ ...rfq, status: 'Under Review' });
    const w = rfqQuotes.find((q) => q.id === qid);
    addLog(`${vById(w?.vendorId ?? '')?.name ?? 'Vendor'} selected as winner for RFQ "${rfq.title}"`, 'approval', rfq.id);
    toast.success('Winner selected! Sent for approval.');
    navigate(`/rfqs/${id}`);
  };

  if (rfqQuotes.length === 0) return <div className="text-center py-20 text-gray-400"><p>No quotations to compare.</p><button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Go back</button></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
        <div><h1 className="text-2xl font-bold text-gray-900">Quotation Comparison</h1><p className="text-gray-500 text-sm">{rfq.title}</p></div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 font-semibold text-gray-600 w-48">Line Item</th>
                {rfqQuotes.map((q) => {
                  const v = vById(q.vendorId);
                  return (
                    <th key={q.id} className="text-center px-6 py-4 font-semibold text-gray-700 min-w-40">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">{v?.name?.[0] ?? 'V'}</div>
                        <span>{v?.name ?? q.vendorId}</span>
                        <span className="text-amber-500 text-xs">{'★'.repeat(Math.round(v?.rating ?? 0))}<span className="text-gray-300">{'★'.repeat(5 - Math.round(v?.rating ?? 0))}</span> {v?.rating?.toFixed(1)}</span>
                        {q.status === 'Selected' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Trophy className="w-3 h-3" />Selected</span>}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rfq.lineItems.map((item) => {
                const lp = lowestP(item.id);
                return (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-slate-50/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-800">{item.product}<span className="text-xs text-gray-400 block font-normal mt-0.5">Quantity: {item.quantity} {item.unit}</span></td>
                    {rfqQuotes.map((q) => {
                      const price = getPrice(q, item.id);
                      const isLow = price === lp && price > 0;
                      return (
                        <td key={q.id} className={cn('px-6 py-4 text-center transition-colors duration-200', isLow && 'bg-emerald-50/50')}>
                          <div className="font-bold text-gray-900">{fmtC(price)}<span className="text-xs text-gray-400 font-normal">/unit</span></div>
                          <div className="mt-1">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                                <Trophy className="w-2.5 h-2.5 flex-shrink-0" /> {fmtC(price * item.quantity)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500 font-medium">{fmtC(price * item.quantity)} total</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr className="border-b border-gray-100 bg-slate-50/30">
                <td className="px-6 py-4.5 font-bold text-gray-700">Delivery Timeline</td>
                {rfqQuotes.map((q) => {
                  const isFast = q.deliveryDays === lowestD;
                  return (
                    <td key={q.id} className={cn('px-6 py-4.5 text-center transition-colors duration-200', isFast && 'bg-emerald-50/50')}>
                      <span className={cn('font-bold block text-sm', isFast ? 'text-emerald-700' : 'text-gray-800')}>{q.deliveryDays} days</span>
                      {isFast && <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md mt-1">⚡ Fastest</span>}
                    </td>
                  );
                })}
              </tr>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td className="px-6 py-5 font-bold text-gray-800">Grand Total</td>
                {rfqQuotes.map((q) => {
                  const isLowestTotal = q.totalAmount === lowestT;
                  return (
                    <td key={q.id} className={cn('px-6 py-5 text-center transition-all duration-300', isLowestTotal && 'bg-emerald-100/50')}>
                      <span className={cn('text-xl font-black block', isLowestTotal ? 'text-emerald-850' : 'text-gray-900')}>{fmtC(q.totalAmount)}</span>
                      {isLowestTotal && <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-850 bg-emerald-200/50 px-3 py-1 rounded-full mt-1.5 uppercase tracking-wide border border-emerald-300/40">★ Best Bid</span>}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-3">Vendor Notes</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rfqQuotes.map((q) => <div key={q.id} className="bg-gray-50 rounded-lg p-3"><p className="text-xs font-semibold text-gray-600 mb-1">{vById(q.vendorId)?.name}</p><p className="text-xs text-gray-500 italic">{q.notes || 'No notes provided'}</p></div>)}
          </div>
        </div>
        {(user?.role === 'Procurement Officer' || user?.role === 'Admin') && rfq.status !== 'Closed' && rfq.status !== 'Under Review' && (
          <div className="border-t border-gray-100 p-6 bg-gray-50/50">
            <h3 className="font-semibold text-gray-700 mb-3">Select Winner</h3>
            <div className="flex flex-wrap gap-3">
              {rfqQuotes.map((q) => {
                const v = vById(q.vendorId);
                return <Button key={q.id} onClick={() => selectWinner(q.id)} disabled={q.status === 'Selected'} className={cn('gap-2', q.status === 'Selected' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white')}><Trophy className="w-4 h-4" />{q.status === 'Selected' ? `${v?.name} (Selected)` : `Select ${v?.name}`}</Button>;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
