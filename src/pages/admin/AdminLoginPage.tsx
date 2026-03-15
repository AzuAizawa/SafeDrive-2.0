import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, signOut, profile, user } = useAuth()
  const navigate = useNavigate()

  // If already logged in as admin, go to dashboard
  useEffect(() => {
    if (user && profile?.role === 'admin') {
      navigate('/admin')
    }
  }, [user, profile, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        toast.error('Authentication failed', { description: error.message })
        setIsLoading(false)
        return
      }

      // After sign in, check if the user is NOT an admin
      // The profile should be updated by the onAuthStateChange in AuthContext
      if (profile && profile.role !== 'admin') {
        // If non-admin tries to log in via admin login, sign them out and show error
        await signOut()
        toast.error('Regular users must use the user login page')
        navigate('/login')
        setIsLoading(false)
        return
      }

      // If we get here, the user is an admin
      toast.success('System Access Granted')
    } catch (err: any) {
      toast.error('Error', { description: err.message })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020202] relative overflow-hidden p-4">
      {/* Background decoration - Advanced Tech Feel */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.05),transparent_70%)]" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo Section */}
        <div className="flex items-center justify-center gap-3 mb-10 group">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)] group-hover:shadow-[0_0_50px_rgba(239,68,68,0.5)] transition-all duration-500 border border-white/10">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-black tracking-tighter text-white uppercase italic">SafeDrive</span>
            <span className="text-[10px] font-bold text-red-500 tracking-[0.4em] uppercase">Security Operations</span>
          </div>
        </div>

        <Card className="bg-[#0a0a0a]/80 backdrop-blur-xl border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />

          <CardHeader className="text-center pb-2 pt-8">
            <CardTitle className="text-2xl font-bold text-white tracking-tight">Admin Authentication</CardTitle>
            <CardDescription className="text-muted-foreground/60 text-xs uppercase tracking-widest font-semibold mt-1">
              restricted access area
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-400 text-xs font-bold uppercase tracking-wider">System Identifier</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@safedrive.sys"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-black/40 border-white/5 focus:border-red-500/50 focus:ring-red-500/20 h-12 rounded-xl text-white transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Security Key</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-black/40 border-white/5 focus:border-red-500/50 focus:ring-red-500/20 h-12 rounded-xl text-white pr-12 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-red-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {profile && profile.role !== 'admin' && user && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400 leading-relaxed font-medium">
                    Access Denied. Your account does not have sufficient clearance to access the Command Center.
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex-col gap-6 p-8 pt-2">
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-[0_10px_30px_rgba(220,38,38,0.2)] hover:shadow-[0_15px_40px_rgba(220,38,38,0.4)] transition-all duration-300 border-t border-white/10 uppercase tracking-widest text-xs"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  <span>Initialize System Entry</span>
                )}
              </Button>

              <div className="flex items-center justify-center gap-6 w-full opacity-40">
                <div className="h-px bg-white/20 flex-1" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Authorized Only</span>
                <div className="h-px bg-white/20 flex-1" />
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
