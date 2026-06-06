import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ChevronRight, Calendar, User, DollarSign, Truck, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';

export default function Approvals() {
  const { approvals, quotations, rfqs, pos, addLog, decideApproval } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const pending  = approvals.filter((a) => a.status === 'pending');
  const decided  = approvals.filter((a) => a.status !== 'pending');

  const getQuotation  = (qid: string) => quotations.find((q) => q.id === qid);
  const getRFQ        = (rid: string) => rfqs.find((r) => r.id === rid);
  const getPOForQuot  = (qid: string) => pos.find((p) => p.quotationId === qid);

  const fmtC = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const fmt = (ts: string) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleApprove = async (approvalId: string) => {
    setLoading((l) => ({ ...l, [approvalId]: true }));
    try {
      const po = await decideApproval(approvalId, 'approved', remarks[approvalId] ?? '');
      const appr = approvals.find((a) => a.id === approvalId)!;
      addLog(`Quotation approved for "${appr.rfqTitle}". PO ${po?.poNumber} generated.`, 'approval', approvalId);
      toast.success(`✅ Approved! PO ${po?.poNumber} generated.`);
    } catch {
      toast.error('Failed to approve');
    } finally {
      setLoading((l) => ({ ...l, [approvalId]: false }));
    }
  };

  const handleReject = async (approvalId: string) => {
    if (!remarks[approvalId]?.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    setLoading((l) => ({ ...l, [approvalId]: true }));
    try {
      await decideApproval(approvalId, 'rejected', remarks[approvalId]);
      const appr = approvals.find((a) => a.id === approvalId)!;
      addLog(`Quotation rejected for "${appr.rfqTitle}". Reason: ${remarks[approvalId]}`, 'approval', approvalId);
      toast.error('Quotation rejected. Officer notified.');
    } catch {
      toast.error('Failed to reject');
    } finally {
      setLoading((l) => ({ ...l, [approvalId]: false }));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approval Workflow</h1>
        <p className="text-gray-500 text-sm mt-0.5">{pending.length} pending review</p>
      </div>

      {/* Pending Approvals */}
      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <CheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">All caught up!</p>
          <p className="text-gray-400 text-sm mt-1">No quotations pending approval</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((appr) => {
            const quot    = getQuotation(appr.quotationId);
            const rfq     = getRFQ(appr.rfqId);
            const isLoading = loading[appr.id];

            return (
              <div key={appr.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                    <Clock className="w-3 h-3" />Pending Approval
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mt-2">{appr.rfqTitle}</h3>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Selected Vendor</p>
                      <p className="text-sm font-semibold text-gray-700 mt-0.5">{appr.vendorName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Total Amount</p>
                      <p className="text-sm font-semibold text-emerald-700 mt-0.5">{fmtC(appr.totalAmount)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Delivery</p>
                      <p className="text-sm font-semibold text-gray-700 mt-0.5">{quot?.deliveryDays ?? '—'} days</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Submitted By</p>
                      <p className="text-sm font-semibold text-gray-700 mt-0.5">{appr.submittedBy}</p>
                    </div>
                  </div>
                </div>

                {/* Approval Timeline */}
                <div className="mt-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Approval Timeline</p>
                  <ol className="relative border-l border-gray-200 ml-3 space-y-4">
                    <li className="ml-4">
                      <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-1.5 border-2 border-white mt-1" />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-blue-700">RFQ Created</span>
                        <span className="text-xs text-gray-400">{rfq ? fmt(rfq.createdAt) : '—'}</span>
                      </div>
                    </li>
                    <li className="ml-4">
                      <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-1.5 border-2 border-white mt-1" />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-emerald-700">Quotation Submitted by {appr.vendorName}</span>
                        <span className="text-xs text-gray-400">{quot ? fmt(quot.submittedAt) : '—'}</span>
                      </div>
                    </li>
                    <li className="ml-4">
                      <div className="absolute w-3 h-3 bg-amber-400 rounded-full -left-1.5 border-2 border-white mt-1 animate-pulse" />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-amber-700">⏳ Awaiting Approval</span>
                        <span className="text-xs text-gray-400">Action required by {user?.name}</span>
                      </div>
                    </li>
                  </ol>
                </div>

                {/* Vendor Notes */}
                {quot?.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Vendor Notes</p>
                    <p className="text-xs text-gray-600 italic">"{quot.notes}"</p>
                  </div>
                )}

                {/* Line Items */}
                {rfq && quot && (
                  <div className="mt-4 rounded-lg border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Line Items</div>
                    {rfq.lineItems.map((li) => {
                      const qi = quot.lineItems.find((ql) => ql.rfqItemId === li.id);
                      return (
                        <div key={li.id} className="px-4 py-2.5 flex justify-between border-t border-gray-50 text-sm">
                          <span className="text-gray-700">{li.product} ×{li.quantity}</span>
                          <span className="font-medium text-gray-800">{fmtC((qi?.unitPrice ?? 0) * li.quantity)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Remarks */}
                <div className="mt-4">
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Remarks <span className="text-red-500">(required for rejection)</span>
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="Add approval/rejection remarks..."
                    value={remarks[appr.id] ?? ''}
                    onChange={(e) => setRemarks({ ...remarks, [appr.id]: e.target.value })}
                    className="text-sm"
                  />
                </div>

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => rfq && navigate(`/rfqs/${rfq.id}`)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                  >
                    View RFQ <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleReject(appr.id)}
                      disabled={isLoading}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 gap-2"
                    >
                      <XCircle className="w-4 h-4" />Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(appr.id)}
                      disabled={isLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isLoading ? 'Processing…' : 'Approve & Generate PO'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approval History */}
      {decided.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            Approval History
          </h2>
          <ol className="relative border-l border-gray-200 ml-3 space-y-5">
            {[...decided]
              .sort((a, b) => new Date(b.decidedAt ?? 0).getTime() - new Date(a.decidedAt ?? 0).getTime())
              .map((appr) => {
                const po = getPOForQuot(appr.quotationId);
                const isApproved = appr.status === 'approved';
                return (
                  <li key={appr.id} className="ml-4">
                    <div className={`absolute w-3 h-3 rounded-full -left-1.5 border-2 border-white mt-1 ${isApproved ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {isApproved ? '✓ Approved' : '✗ Rejected'}
                        </span>
                        <p className="text-sm font-semibold text-gray-800 mt-1">{appr.rfqTitle}</p>
                        <p className="text-xs text-gray-500">Vendor: {appr.vendorName} · {fmtC(appr.totalAmount)}</p>
                        {appr.remarks && (
                          <p className="text-xs text-gray-400 italic mt-0.5">"{appr.remarks}"</p>
                        )}
                        {isApproved && po && (
                          <button
                            onClick={() => navigate(`/purchase-orders/${po.id}`)}
                            className="text-xs text-blue-600 hover:underline mt-0.5"
                          >
                            View PO: {po.poNumber}
                          </button>
                        )}
                        {isApproved && !po && (
                          <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-3 h-3" /> PO being generated…
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{appr.decidedAt ? fmt(appr.decidedAt) : '—'}</span>
                    </div>
                  </li>
                );
              })}
          </ol>
        </div>
      )}
    </div>
  );
}
