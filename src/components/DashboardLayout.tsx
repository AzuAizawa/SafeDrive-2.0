import { useState, useCallback } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Car,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  CalendarDays,
  CarFront,
  Sun,
  Moon,
  Bell,
  ArrowLeftRight,
  ShieldAlert,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

export default function DashboardLayout() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isVerified = profile?.verified_status === 'verified'
  const isLister = profile?.is_lister

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  const handleToggleMode = useCallback(async () => {
    if (!user || !profile) return
    
    // Safety check: Prevent unverified users from switching to lister mode
    if (!isVerified && !isLister) {
      toast.error('Identity Verification Required', {
        description: 'Please complete your verification to unlock Lister features.'
      })
      navigate('/verify')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ is_lister: !isLister })
      .eq('id', user.id)
    if (!error) {
      await refreshProfile()
      toast.success(isLister ? 'Switched to Renter mode' : 'Switched to Lister mode')
    }
  }, [user, profile, isLister, isVerified, refreshProfile, navigate])

  const navItems = [
    { to: '/browse', label: 'Browse Cars', icon: CarFront },
    { to: '/my-bookings', label: 'My Bookings', icon: CalendarDays },
    ...(isLister
      ? [
          { to: '/my-vehicles', label: 'My Vehicles', icon: Car },
          { to: '/lister-bookings', label: 'Dashboard', icon: LayoutDashboard },
        ]
      : []),
  ]

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      {/* Dynamic Background Glow */}
      <div className={`fixed inset-0 pointer-events-none opacity-40 transition-colors duration-1000 ${
        isLister 
          ? 'bg-[radial-gradient(circle_at_100%_0%,rgba(139,92,246,0.08),transparent_50%)]' 
          : 'bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.08),transparent_50%)]'
      }`} />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <NavLink to="/browse" className="flex items-center gap-2.5 group">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${isLister ? 'from-primary to-primary/70' : 'from-blue-500 to-blue-600'} flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-105`}>
                  <Car className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-black tracking-tight hidden sm:block">
                  SafeDrive
                </span>
              </NavLink>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1 ml-4 p-1 bg-muted/30 rounded-xl border border-border/20">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => {
                      const baseClass = "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                      const activeColor = isLister ? 'text-primary' : 'text-blue-500'
                      return isActive 
                        ? `${baseClass} bg-background ${activeColor} shadow-sm`
                        : `${baseClass} text-muted-foreground hover:text-foreground hover:bg-muted/50`
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Mode indicator */}
              <div className="hidden lg:flex items-center mr-2">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-500 ${
                  isLister 
                    ? 'bg-primary/10 text-primary border-primary/20' 
                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                }`}>
                  {isLister ? 'Lister Mode' : 'Renter Mode'}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-xl hover:bg-muted/50"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/notifications')}
                className="rounded-xl hover:bg-muted/50 relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${isLister ? 'from-primary/80 to-primary' : 'from-blue-500/80 to-blue-500'} flex items-center justify-center cursor-pointer hover:shadow-lg transition-all border border-white/10`}>
                    <User className="w-4 h-4 text-white" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-border/40 bg-background/95 backdrop-blur-md">
                  <div className="font-normal p-3">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-sm font-bold truncate">{profile?.full_name || profile?.email || user?.email}</p>
                      <div className="flex items-center gap-2">
                         <span className={`text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-md ${
                          profile?.verified_status === 'verified' ? 'bg-green-500/10 text-green-500' :
                          profile?.verified_status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {profile?.verified_status || 'Unverified'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="opacity-50" />
                  <DropdownMenuGroup className="space-y-1">
                    <DropdownMenuItem onClick={() => navigate('/verify')} className="rounded-xl p-2.5">
                      <User className="mr-2 h-4 w-4 opacity-70" />
                      {profile?.verified_status === 'verified' ? 'Account & Identity' : 'Get Verified'}
                    </DropdownMenuItem>

                    {isVerified && (
                      <DropdownMenuItem onClick={handleToggleMode} className="rounded-xl p-2.5 bg-primary/5 text-primary focus:text-primary">
                        <ArrowLeftRight className="mr-2 h-4 w-4" />
                        {isLister ? 'Switch to Renter' : 'Switch to Lister'}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="opacity-50" />
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-xl p-2.5 text-red-500 focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-xl"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/50 backdrop-blur-xl animate-scale-in">
            <nav className="p-4 space-y-2">
              <div className="px-2 mb-2">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Navigation</p>
              </div>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => {
                    const baseClass = "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                    const activeStyle = isLister ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'
                    return isActive
                      ? `${baseClass} ${activeStyle}`
                      : `${baseClass} text-muted-foreground hover:text-foreground hover:bg-muted/50`
                  }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
              {isVerified && (
                <div className="pt-4 px-2 border-t border-border/40 mt-4">
                  <Button 
                    className="w-full justify-start gap-3 rounded-xl bg-primary/5 text-primary" 
                    variant="ghost" 
                    onClick={() => {
                      handleToggleMode()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    {isLister ? 'Switch to Renter' : 'Switch to Lister'}
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10 transition-all duration-500">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Footer (Simplified for Dashboards) */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-8 border-t border-border/40 text-center opacity-50">
        <p className="text-[10px] uppercase tracking-widest font-bold">SafeDrive — Peer-to-Peer Car Rental Platform</p>
      </footer>
    </div>
  )
}
