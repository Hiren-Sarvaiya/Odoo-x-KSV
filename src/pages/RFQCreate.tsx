import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronLeft, Paperclip, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { genId } from '../lib/api';
import type { RFQ, RFQLineItem } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';

const newLine = (): RFQLineItem => ({ id: genId(), product: '', quantity: 1, unit: 'units' });

interface AttachmentMeta {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

export default function RFQCreate() {
  const { vendors, upsertRFQ, addLog } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [lineItems, setLineItems] = useState<RFQLineItem[]>([newLine()]);
  const [assignedVendors, setAssignedVendors] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const activeVendors = vendors.filter((v) => v.status === 'Active');

  const updLine = (id: string, f: keyof RFQLineItem, val: string | number) =>
    setLineItems(lineItems.map((l) => (l.id === id ? { ...l, [f]: val } : l)));

  const toggleVendor = (id: string) =>
    setAssignedVendors((p) => (p.includes(id) ? p.filter((v) => v !== id) : [...p, id]));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachments((prev) => [
          ...prev,
          { name: file.name, size: file.size, type: file.type, dataUrl: ev.target?.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeAttachment = (idx: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const fmtSize = (bytes: number) =>
    bytes < 1024 ? `${bytes}B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)}KB` : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!deadline) e.deadline = 'Deadline is required';
    if (lineItems.some((l) => !l.product.trim())) e.lineItems = 'All items need a product name';
    if (assignedVendors.length === 0) e.vendors = 'Select at least one vendor';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const rfq: RFQ = {
      id: genId(),
      title,
      description,
      deadline: new Date(deadline).toISOString(),
      lineItems,
      assignedVendors,
      status: 'Open',
      createdBy: user?.id ?? 'system',
      createdAt: new Date().toISOString(),
    };
    try {
      await upsertRFQ(rfq);
      await addLog(`RFQ "${title}" created${attachments.length ? ` with ${attachments.length} attachment(s)` : ''}`, 'rfq', rfq.id);
      toast.success('RFQ created successfully!');
      navigate('/rfqs');
    } catch {
      toast.error('Failed to create RFQ');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/rfqs')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create RFQ</h1>
          <p className="text-gray-500 text-sm">Request for Quotation</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <Label>RFQ Title *</Label>
          <Input className="mt-1" placeholder="e.g. Laptop Procurement Q4" value={title} onChange={(e) => setTitle(e.target.value)} />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>
        <div>
          <Label>Description</Label>
          <Textarea className="mt-1" placeholder="Describe the procurement requirement..." rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="w-60">
          <Label>Deadline *</Label>
          <Input type="date" className="mt-1" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={new Date().toISOString().split('T')[0]} />
          {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Line Items</h2>
          <Button onClick={() => setLineItems([...lineItems, newLine()])} variant="outline" size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />Add Item
          </Button>
        </div>
        {errors.lineItems && <p className="text-xs text-red-500 mb-3">{errors.lineItems}</p>}
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase px-1">
            <div className="col-span-6">Product / Service</div>
            <div className="col-span-3">Quantity</div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-1" />
          </div>
          {lineItems.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-6">
                <Input placeholder={`Item ${idx + 1}`} value={item.product} onChange={(e) => updLine(item.id, 'product', e.target.value)} />
              </div>
              <div className="col-span-3">
                <Input type="number" min={1} value={item.quantity} onChange={(e) => updLine(item.id, 'quantity', parseInt(e.target.value) || 1)} />
              </div>
              <div className="col-span-2">
                <Input placeholder="units" value={item.unit} onChange={(e) => updLine(item.id, 'unit', e.target.value)} />
              </div>
              <div className="col-span-1 flex justify-center">
                {lineItems.length > 1 && (
                  <button onClick={() => setLineItems(lineItems.filter((l) => l.id !== item.id))} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attachments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-800">Attachments</h2>
            <p className="text-xs text-gray-500 mt-0.5">Upload specs, drawings, or relevant documents (max 5MB each)</p>
          </div>
          <label className="cursor-pointer">
            <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" className="hidden" onChange={handleFileChange} />
            <span className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />Upload Files
            </span>
          </label>
        </div>
        {attachments.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-lg py-8 text-center">
            <Paperclip className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No attachments yet</p>
            <p className="text-xs text-gray-300 mt-1">PDF, Word, Excel, Images supported</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((att, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <Paperclip className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{att.name}</p>
                  <p className="text-xs text-gray-400">{fmtSize(att.size)} · {att.type || 'file'}</p>
                </div>
                <button onClick={() => removeAttachment(idx)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vendor Assignment */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-1">Assign Vendors</h2>
        <p className="text-gray-500 text-sm mb-4">Select vendors to invite for this RFQ</p>
        {errors.vendors && <p className="text-xs text-red-500 mb-3">{errors.vendors}</p>}
        {activeVendors.length === 0 ? (
          <p className="text-gray-400 text-sm">No active vendors. <button className="text-blue-600 hover:underline" onClick={() => navigate('/vendors')}>Add vendors</button> first.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeVendors.map((v) => (
              <label key={v.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${assignedVendors.includes(v.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <Checkbox checked={assignedVendors.includes(v.id)} onCheckedChange={() => toggleVendor(v.id)} />
                <div>
                  <p className="text-sm font-medium text-gray-800">{v.name}</p>
                  <p className="text-xs text-gray-500">{v.category}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/rfqs')}>Cancel</Button>
        <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8">Create RFQ</Button>
      </div>
    </div>
  );
}
