import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, Users, Car, CarFront, ClipboardList, CreditCard,
  LogOut, Sun, Moon, Shield, ExternalLink,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/car-catalog', label: 'Car Catalog', icon: CarFront },
  { to: '/admin/vehicle-approval', label: 'Vehicle Approval', icon: Car },
  { to: '/admin/audit-trail', label: 'Audit Trail', icon: ClipboardList },
  { to: '/admin/payouts', label: 'Send Payments', icon: CreditCard },
]

export default function AdminLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(239,68,68,0.03),transparent_50%)] pointer-events-none" />
      
      {/* Sidebar */}
      <aside className="w-66 border-r border-border/40 glass flex flex-col sticky top-0 h-screen z-20">
        <div className="p-6 border-b border-border/40 bg-background/20">
          <NavLink to="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-all duration-300">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block leading-tight">SafeDrive</span>
              <span className="text-[10px] text-red-500/80 font-bold uppercase tracking-[0.2em]">Admin Portal</span>
            </div>
          </NavLink>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Management</p>
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-red-500/10 text-red-500 shadow-[inset_0_1px_1px_rgba(239,68,68,0.1)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`
              }
            >
              <item.icon className={`w-4 h-4 ${navItems.indexOf(item) === 0 ? '' : 'opacity-80'}`} />
              {item.label}
            </NavLink>
          ))}

          <div className="pt-8 px-3 mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Shortcuts</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40"
            onClick={() => navigate('/browse')}
          >
            <ExternalLink className="w-4 h-4 opacity-80" />
            View Live Site
          </Button>
        </nav>

        <div className="p-4 border-t border-border/40 bg-muted/20 space-y-1.5">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 opacity-80" /> : <Moon className="w-4 h-4 opacity-80" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-500/5 transition-colors"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <header className="h-16 border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-20 flex items-center px-8 justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">System Live</span>
          </div>
          <div className="flex items-center gap-4">
             {/* Admin notifications or profile could go here */}
          </div>
        </header>
        <div className="p-8">
          <div className="max-w-6xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
