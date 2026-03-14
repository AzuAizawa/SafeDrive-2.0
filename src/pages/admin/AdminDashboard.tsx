import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Users, Car, CalendarDays, CreditCard, ShieldCheck, Clock, ArrowUpRight, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

interface Stats {
  totalUsers: number
  pendingVerifications: number
  activeListings: number
  pendingVehicles: number
  activeBookings: number
  pendingPayouts: number
}

interface ActivityLog {
  id: string
  action: string
  details: string
  timestamp: string
  profiles: { full_name: string } | null
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchStats()
    fetchRecentActivity()
  }, [])

  const fetchStats = async () => {
    const [usersRes, pendingVerifRes, listingsRes, pendingCarsRes, bookingsRes, payoutsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('verified_status', 'pending'),
      supabase.from('cars').select('id', { count: 'exact', head: true }).in('status', ['approved', 'active']),
      supabase.from('cars').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).in('status', ['active', 'downpayment_paid', 'pending_owner']),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    ])

    setStats({
      totalUsers: usersRes.count || 0,
      pendingVerifications: pendingVerifRes.count || 0,
      activeListings: listingsRes.count || 0,
      pendingVehicles: pendingCarsRes.count || 0,
      activeBookings: bookingsRes.count || 0,
      pendingPayouts: payoutsRes.count || 0,
    })
  }

  const fetchRecentActivity = async () => {
    const { data } = await supabase
      .from('audit_log')
      .select('*, profiles(full_name)')
      .order('timestamp', { ascending: false })
      .limit(5)
    
    if (data) setActivities(data as any)
    setLoading(false)
  }

  const cards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', onClick: () => navigate('/admin/users') },
    { label: 'Pending Verif.', value: stats.pendingVerifications, icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-500/10', onClick: () => navigate('/admin/users') },
    { label: 'Active Listings', value: stats.activeListings, icon: Car, color: 'text-green-500', bg: 'bg-green-500/10', onClick: () => navigate('/admin/vehicle-approval') },
    { label: 'Pending Vehicles', value: stats.pendingVehicles, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10', onClick: () => navigate('/admin/vehicle-approval') },
    { label: 'Active Bookings', value: stats.activeBookings, icon: CalendarDays, color: 'text-purple-500', bg: 'bg-purple-500/10', onClick: () => navigate('/admin/audit-trail') },
    { label: 'Ready for Payout', value: stats.pendingPayouts, icon: CreditCard, color: 'text-red-500', bg: 'bg-red-500/10', onClick: () => navigate('/admin/payouts') },
  ] : []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1 text-lg">Real-time status of the SafeDrive platform.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-border/40">
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-7 w-12" />
                </CardContent>
              </Card>
            ))
          : cards.map((card) => (
              <Card
                key={card.label}
                className="group cursor-pointer hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 bg-card/50 backdrop-blur-sm border-border/40 overflow-hidden relative"
                onClick={card.onClick}
              >
                <div className={`absolute top-0 right-0 w-16 h-16 ${card.bg} rounded-bl-[4rem] group-hover:scale-110 transition-transform duration-500`} />
                <CardContent className="p-5 relative">
                  <div className="flex flex-col gap-3">
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{card.label}</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-2xl font-black">{card.value}</p>
                        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/40 bg-card/30 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" />
                Recent Activity
              </CardTitle>
              <p className="text-sm text-muted-foreground">Latest events across the platform.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/audit-trail')} className="text-red-500 hover:text-red-600">
              View Audit Trail
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-border/40 last:border-0">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))
              ) : activities.length > 0 ? (
                activities.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 py-4 border-b border-border/40 last:border-0 group">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                      <Activity className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold truncate uppercase tracking-tight">
                          {log.action.replace(/_/g, ' ')}
                        </p>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase whitespace-nowrap">
                          {format(new Date(log.timestamp), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{log.details}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        By: <span className="font-medium">{log.profiles?.full_name || 'System'}</span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Platform Status</CardTitle>
            <p className="text-sm text-muted-foreground">Infrastructure health.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { label: 'Supabase DB', status: 'Healthy', color: 'bg-green-500' },
              { label: 'Storage Buckets', status: 'Active', color: 'bg-green-500' },
              { label: 'PayMongo API', status: 'Test Mode', color: 'bg-amber-500' },
              { label: 'Edge Functions', status: 'Operational', color: 'bg-green-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">{item.status}</span>
                  <div className={`h-2 w-2 rounded-full ${item.color} shadow-[0_0_8px_currentColor]`} />
                </div>
              </div>
            ))}
            <div className="pt-4 mt-4 border-t border-border/40">
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">System Warning</p>
                <p className="text-xs text-muted-foreground">
                  Manual payouts are required for completed bookings. Check the 'Send Payments' tab regularly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
