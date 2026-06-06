'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getUserByEmail } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { Mail, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate email
      if (!email || !password) {
        toast.error('Please fill in all fields')
        setLoading(false)
        return
      }

      // Find user by email
      const user = getUserByEmail(email)

      if (!user) {
        toast.error('User not found. Try one of the demo accounts.')
        setLoading(false)
        return
      }

      // Check password
      if (user.password !== password) {
        toast.error('Invalid password')
        setLoading(false)
        return
      }

      // Login
      login(user)
      toast.success(`Welcome back, ${user.name}!`)
      router.push('/dashboard')
    } catch (error) {
      toast.error('Login failed. Please try again.')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Demo credentials for testing
  const demoAccounts = [
    { email: 'admin@vendorbridge.com', password: 'admin123', role: 'Admin' },
    {
      email: 'procurement@vendorbridge.com',
      password: 'procurement123',
      role: 'Procurement Officer',
    },
    { email: 'manager@vendorbridge.com', password: 'manager123', role: 'Manager' },
    { email: 'vendor@acmecorp.com', password: 'vendor123', role: 'Vendor' },
  ]

  const fillDemoCredentials = (email: string, password: string) => {
    setEmail(email)
    setPassword(password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">VendorBridge</h1>
            <p className="text-gray-600 text-sm">Procurement & Vendor Management ERP</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => toast.error('Password reset not implemented')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Logging in...' : 'Login'}
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Demo Credentials</span>
            </div>
          </div>

          {/* Demo Accounts */}
          <div className="space-y-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemoCredentials(account.email, account.password)}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <p className="font-medium text-gray-700">{account.role}</p>
                <p className="text-xs text-gray-500 mt-1">{account.email}</p>
              </button>
            ))}
          </div>

          {/* Signup Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-white text-xs opacity-75">
          <p>Demo accounts are available for testing all features</p>
        </div>
      </div>
    </div>
  )
}
