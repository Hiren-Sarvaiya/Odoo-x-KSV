import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import type { Role } from '../types';

const loginSchema = z.object({ email: z.string().email('Invalid email'), password: z.string().min(1, 'Password required') });
const signupSchema = z.object({ name: z.string().min(2, 'Name must be at least 2 characters'), email: z.string().email('Invalid email'), password: z.string().min(6, 'Password must be at least 6 characters'), role: z.string().min(1, 'Role required') });
type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

const ROLES: Role[] = ['Admin', 'Procurement Officer', 'Manager', 'Vendor'];
const ROLE_DESC: Record<Role, string> = { Admin: 'Full system access', 'Procurement Officer': 'Manage RFQs, POs & vendors', Manager: 'Approve quotations', Vendor: 'Submit & manage quotations' };
const DEMO = [
  { label: 'Admin', email: 'admin@demo.com', password: 'admin123', color: 'bg-rose-50 border-rose-200 text-rose-700' },
  { label: 'Officer', email: 'officer@demo.com', password: 'officer123', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { label: 'Manager', email: 'manager@demo.com', password: 'manager123', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { label: 'Vendor', email: 'vendor@demo.com', password: 'vendor123', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
];

export default function Login() {
  const { login, signup, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPass, setShowPass] = useState(false);
  const [signupRole, setSignupRole] = useState<Role>('Procurement Officer');
  const lf = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const sf = useForm<SignupForm>({ resolver: zodResolver(signupSchema), defaultValues: { role: 'Procurement Officer' } });

  const handleForgotPass = async () => {
    const email = lf.getValues('email');
    if (!email) {
      toast.error('Please enter your email in the field first.');
      return;
    }
    await forgotPassword(email);
    toast.success('Reset link sent to your email!');
  };

  const onLogin = async (data: LoginForm) => {
    if (await login(data.email, data.password)) { toast.success('Welcome back!'); navigate('/dashboard'); }
    else toast.error('Invalid email or password');
  };
  const onSignup = async (data: SignupForm) => {
    if (await signup(data.name, data.email, data.password, signupRole)) { toast.success('Account created!'); navigate('/dashboard'); }
    else toast.error('Email already in use');
  };
  const quickLogin = async (email: string, password: string) => {
    if (await login(email, password)) { toast.success('Logged in!'); navigate('/dashboard'); }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(rgba(99, 102, 241, 0.15) 1.5px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    >
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mb-4 shadow-[0_8px_30px_rgb(59,130,246,0.3)] animate-pulse"><Building2 className="w-8 h-8 text-white" /></div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">VendorBridge</h1>
          <p className="text-slate-400 text-sm mt-1">Procurement & Vendor Management ERP</p>
        </div>
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.12)] border border-slate-100 p-8 hover:shadow-[0_20px_55px_rgba(8,_112,_184,_0.16)] transition-all duration-300">
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button onClick={() => setMode('login')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${mode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Sign In</button>
            <button onClick={() => setMode('signup')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${mode === 'signup' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Create Account</button>
          </div>
          {mode === 'login' ? (
            <form onSubmit={lf.handleSubmit(onLogin)} className="space-y-4">
              <div><Label className="text-sm font-medium text-gray-700">Email</Label><Input type="email" placeholder="you@example.com" className="mt-1" {...lf.register('email')} />{lf.formState.errors.email && <p className="text-xs text-red-500 mt-1">{lf.formState.errors.email.message}</p>}</div>
              <div><Label className="text-sm font-medium text-gray-700">Password</Label>
                <div className="relative mt-1"><Input type={showPass ? 'text' : 'password'} placeholder="••••••••" {...lf.register('password')} /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
                {lf.formState.errors.password && <p className="text-xs text-red-500 mt-1">{lf.formState.errors.password.message}</p>}
              </div>
              <div className="flex justify-between items-center">
                <button type="button" onClick={handleForgotPass} className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline">Forgot password?</button>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all">Sign In</Button>
            </form>
          ) : (
            <form onSubmit={sf.handleSubmit(onSignup)} className="space-y-4">
              <div><Label className="text-sm font-medium text-gray-700">Full Name</Label><Input placeholder="John Doe" className="mt-1" {...sf.register('name')} />{sf.formState.errors.name && <p className="text-xs text-red-500 mt-1">{sf.formState.errors.name.message}</p>}</div>
              <div><Label className="text-sm font-medium text-gray-700">Email</Label><Input type="email" placeholder="you@example.com" className="mt-1" {...sf.register('email')} />{sf.formState.errors.email && <p className="text-xs text-red-500 mt-1">{sf.formState.errors.email.message}</p>}</div>
              <div><Label className="text-sm font-medium text-gray-700">Password</Label><Input type="password" placeholder="Min 6 characters" className="mt-1" {...sf.register('password')} />{sf.formState.errors.password && <p className="text-xs text-red-500 mt-1">{sf.formState.errors.password.message}</p>}</div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Role</Label>
                <Select value={signupRole} onValueChange={(v) => { setSignupRole(v as Role); sf.setValue('role', v); }}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}><div><p className="font-medium">{r}</p><p className="text-xs text-gray-500">{ROLE_DESC[r]}</p></div></SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all">Create Account</Button>
            </form>
          )}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 text-center mb-3">Quick Demo Login</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO.map((acc) => (<button key={acc.label} onClick={() => quickLogin(acc.email, acc.password)} className={`text-xs font-semibold py-2 px-3 rounded-lg border transition-colors hover:opacity-80 ${acc.color}`}>{acc.label}</button>))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
