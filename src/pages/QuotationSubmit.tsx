import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { genId } from '../lib/storage';
import type { Quotation } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

export default function QuotationSubmit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { rfqs, quotations, vendors, upsertQuotation, upsertRFQ, addLog } = useData();
  const { user } = useAuth();
  const rfq = rfqs.find((r) => r.id === id);
  const myVendor = vendors.find((v) => v.email === user?.email);
  const existing = quotations.find((q) => q.rfqId === id && q.vendorId === myVendor?.id);
  const [prices, setPrices] = useState<Record<string, string>>(existing ? Object.fromEntries(existing.lineItems.map((li) => [li.rfqItemId, String(li.unitPrice)])) : {});
  const [delivery, setDelivery] = useState(existing?.deliveryDays?.toString() ?? '14');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!rfq) return <div className="text-center py-20 text-gray-400">RFQ not found. <button onClick={() => navigate('/rfqs')} className="text-blue-600">Go back</button></div>;
  if (!myVendor) return <div className="text-center py-20 text-gray-400">Vendor profile not found for your account.</div>;

  const total = rfq.lineItems.reduce((s, li) => s + li.quantity * (parseFloat(prices[li.id] ?? '0') || 0), 0);
  const fmtC = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const validate = () => {
    const e: Record<string, string> = {};
    rfq.lineItems.forEach((li) => { if (!prices[li.id] || parseFloat(prices[li.id]) <= 0) e[li.id] = 'Enter a valid price'; });
    if (!delivery || parseInt(delivery) <= 0) e.delivery = 'Enter delivery days';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const quot: Quotation = { id: existing?.id ?? genId(), rfqId: rfq.id, vendorId: myVendor.id, lineItems: rfq.lineItems.map((li) => ({ rfqItemId: li.id, unitPrice: parseFloat(prices[li.id]) })), deliveryDays: parseInt(delivery), notes, status: 'Submitted', submittedAt: new Date().toISOString(), submittedBy: user?.id ?? 'system', totalAmount: total };
    try {
      await upsertQuotation(quot);
      if (rfq.status === 'Open') await upsertRFQ({ ...rfq, status: 'Quoted' });
      await addLog(`Quotation submitted by ${myVendor.name} for "${rfq.title}"`, 'quotation', quot.id);
      toast.success('Quotation submitted successfully!');
      navigate('/rfqs');
    } catch {
      toast.error('Failed to submit quotation');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/rfqs')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
        <div><h1 className="text-2xl font-bold text-gray-900">Submit Quotation</h1><p className="text-gray-500 text-sm">{rfq.title}</p></div>
      </div>
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4"><p className="text-sm text-blue-800 font-medium">{rfq.description}</p><p className="text-xs text-blue-600 mt-1">Deadline: {new Date(rfq.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p></div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Price Your Items</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-gray-500 uppercase px-1"><div className="col-span-5">Product</div><div className="col-span-2 text-right">Qty</div><div className="col-span-2">Unit</div><div className="col-span-3">Unit Price *</div></div>
          {rfq.lineItems.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-5 text-sm font-medium text-gray-800">{item.product}</div>
              <div className="col-span-2 text-right text-sm text-gray-600">{item.quantity}</div>
              <div className="col-span-2 text-sm text-gray-500">{item.unit}</div>
              <div className="col-span-3">
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span><Input type="number" min={0} step={0.01} className="pl-7" value={prices[item.id] ?? ''} onChange={(e) => setPrices({ ...prices, [item.id]: e.target.value })} /></div>
                {errors[item.id] && <p className="text-xs text-red-500 mt-0.5">{errors[item.id]}</p>}
              </div>
            </div>
          ))}
          {total > 0 && <div className="border-t border-gray-100 pt-3 flex justify-between items-center"><span className="text-sm font-semibold text-gray-700">Estimated Total</span><span className="text-lg font-bold text-gray-900">{fmtC(total)}</span></div>}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="w-40"><Label>Delivery Timeline (days) *</Label><Input type="number" min={1} className="mt-1" value={delivery} onChange={(e) => setDelivery(e.target.value)} />{errors.delivery && <p className="text-xs text-red-500 mt-1">{errors.delivery}</p>}</div>
        <div><Label>Notes / Comments</Label><Textarea className="mt-1" rows={3} placeholder="Any additional notes, terms, or conditions..." value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      </div>
      <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => navigate('/rfqs')}>Cancel</Button><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8">{existing ? 'Update Quotation' : 'Submit Quotation'}</Button></div>
    </div>
  );
}
