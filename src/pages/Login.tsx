import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import type { Role } from '../types';

const loginSchema = z.object({ email: z.string().email('Invalid email'), password: z.string().min(1, 'Password required') });
const signupSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6), role: z.string().min(1) });
type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

const ROLES: Role[] = ['Admin', 'Procurement Officer', 'Manager', 'Vendor'];
const ROLE_DESC: Record<Role, string> = {
  Admin: 'Full system access',
  'Procurement Officer': 'Manage RFQs, POs & vendors',
  Manager: 'Approve quotations',
  Vendor: 'Submit & manage quotations',
};

const DEMO = [
  { label: 'Admin', email: 'admin@demo.com', password: 'admin123', color: 'border-rose-200 text-rose-700 hover:bg-rose-50' },
  { label: 'Officer', email: 'officer@demo.com', password: 'officer123', color: 'border-blue-200 text-blue-700 hover:bg-blue-50' },
  { label: 'Manager', email: 'manager@demo.com', password: 'manager123', color: 'border-amber-200 text-amber-700 hover:bg-amber-50' },
  { label: 'Vendor', email: 'vendor@demo.com', password: 'vendor123', color: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' },
];

export default function Login() {
  const { login, signup, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPass, setShowPass] = useState(false);
  const [signupRole, setSignupRole] = useState<Role>('Procurement Officer');
  const lf = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const sf = useForm<SignupForm>({ resolver: zodResolver(signupSchema), defaultValues: { role: 'Procurement Officer' } });

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
  const handleForgotPass = async () => {
    const email = lf.getValues('email');
    if (!email) { toast.error('Enter your email first'); return; }
    await forgotPassword(email);
    toast.success('Reset link sent!');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4 shadow-lg shadow-blue-600/30">
            <span className="font-black text-white text-lg">VB</span>
          </div>
          <h1 className="text-2xl font-bold text-white">VendorBridge</h1>
          <p className="text-slate-400 text-sm mt-1">Procurement & Vendor ERP</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 p-7">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all duration-150 capitalize
                  ${mode === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {mode === 'login' ? (
            <form onSubmit={lf.handleSubmit(onLogin)} className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <Input type="email" placeholder="you@example.com" className="mt-1.5" {...lf.register('email')} />
                {lf.formState.errors.email && <p className="text-xs text-red-500 mt-1">{lf.formState.errors.email.message}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Password</Label>
                <div className="relative mt-1.5">
                  <Input type={showPass ? 'text' : 'password'} placeholder="••••••••" {...lf.register('password')} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {lf.formState.errors.password && <p className="text-xs text-red-500 mt-1">{lf.formState.errors.password.message}</p>}
              </div>
              <button type="button" onClick={handleForgotPass} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Forgot password?
              </button>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-9 mt-1">
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={sf.handleSubmit(onSignup)} className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                <Input placeholder="John Doe" className="mt-1.5" {...sf.register('name')} />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <Input type="email" placeholder="you@example.com" className="mt-1.5" {...sf.register('email')} />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Password</Label>
                <Input type="password" placeholder="Min 6 characters" className="mt-1.5" {...sf.register('password')} />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Role</Label>
                <Select value={signupRole} onValueChange={(v) => { setSignupRole(v as Role); sf.setValue('role', v); }}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        <div>
                          <p className="font-medium text-sm">{r}</p>
                          <p className="text-xs text-gray-400">{ROLE_DESC[r]}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-9">
                Create Account
              </Button>
            </form>
          )}

          {/* Quick Demo Login - hidden */}
        </div>
      </div>
    </div>
  );
}
