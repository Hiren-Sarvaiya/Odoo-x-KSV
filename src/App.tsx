import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, RequireAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import AppLayout from './components/layout/AppLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import Users from './pages/Users';
import RFQs from './pages/RFQs';
import RFQCreate from './pages/RFQCreate';
import RFQDetail from './pages/RFQDetail';
import QuotationSubmit from './pages/QuotationSubmit';
import QuotationComparison from './pages/QuotationComparison';
import Quotations from './pages/Quotations';
import MyQuotations from './pages/MyQuotations';
import Approvals from './pages/Approvals';
import PurchaseOrders from './pages/PurchaseOrders';
import PODetail from './pages/PODetail';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import ActivityLogs from './pages/ActivityLogs';
import Reports from './pages/Reports';

function Protected() {
  return (
    <RequireAuth>
      <DataProvider>
        <AppLayout />
      </DataProvider>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="users" element={<Users />} />
            <Route path="rfqs" element={<RFQs />} />
            <Route path="rfqs/new" element={<RFQCreate />} />
            <Route path="rfqs/:id" element={<RFQDetail />} />
            <Route path="rfqs/:id/quote" element={<QuotationSubmit />} />
            <Route path="rfqs/:id/compare" element={<QuotationComparison />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="my-quotations" element={<MyQuotations />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="purchase-orders" element={<PurchaseOrders />} />
            <Route path="purchase-orders/:id" element={<PODetail />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="activity-logs" element={<ActivityLogs />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
