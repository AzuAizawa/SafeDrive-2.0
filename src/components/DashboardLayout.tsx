import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
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
  ShieldCheck,
  LayoutDashboard,
  CalendarDays,
  CarFront,
  Sun,
  Moon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

export default function DashboardLayout() {
  const { profile, signOut } = useAuth()
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

  const navItems = [
    { to: '/browse', label: 'Browse Cars', icon: CarFront },
    { to: '/my-bookings', label: 'My Bookings', icon: CalendarDays },
    ...(isLister
      ? [
          { to: '/my-vehicles', label: 'My Vehicles', icon: Car },
          { to: '/lister-bookings', label: 'Bookings Received', icon: LayoutDashboard },
        ]
      : []),
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/browse" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                <Car className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                SafeDrive
              </span>
            </NavLink>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center cursor-pointer hover:shadow-lg hover:shadow-primary/20 transition-all">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold">{profile?.full_name || profile?.email}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                      <span className={`text-xs font-medium inline-flex items-center gap-1 mt-0.5 ${
                        profile?.verified_status === 'verified' ? 'text-green-600 dark:text-green-400' :
                        profile?.verified_status === 'pending' ? 'text-amber-600 dark:text-amber-400' :
                        'text-muted-foreground'
                      }`}>
                        <ShieldCheck className="w-3 h-3" />
                        {profile?.verified_status === 'verified' ? 'Verified' :
                         profile?.verified_status === 'pending' ? 'Pending Verification' :
                         'Not Verified'}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    {!isVerified && profile?.verified_status !== 'pending' && (
                      <DropdownMenuItem onClick={() => navigate('/verify')}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Get Verified
                      </DropdownMenuItem>
                    )}
                    {isVerified && (
                      <DropdownMenuItem onClick={async () => {
                        const { error } = await (await import('@/lib/supabase')).supabase
                          .from('profiles')
                          .update({ is_lister: !isLister })
                          .eq('id', profile.id)
                        if (!error) {
                          const { refreshProfile } = await import('@/contexts/AuthContext').then(m => {
                            // We need to call refreshProfile from context
                            return { refreshProfile: () => window.location.reload() }
                          })
                          refreshProfile()
                          toast.success(isLister ? 'Switched to Renter mode' : 'Switched to Lister mode')
                        }
                      }}>
                        <Car className="mr-2 h-4 w-4" />
                        {isLister ? 'Switch to Renter' : 'Switch to Lister'}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 animate-fade-in">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
