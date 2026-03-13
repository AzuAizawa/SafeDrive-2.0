import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, CheckCircle2, XCircle, Clock, LayoutDashboard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ListerBooking {
  id: string
  start_date: string
  end_date: string
  total_days: number
  total_price: number
  status: string
  owner_completed: boolean
  renter_completed: boolean
  created_at: string
  profiles: { full_name: string | null; email: string; phone: string | null }
  cars: {
    plate_number: string
    car_models: { name: string; car_brands: { name: string } }
  }
}

export default function ListerBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<ListerBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (user) fetchBookings()
  }, [user])

  const fetchBookings = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles!bookings_renter_id_fkey (full_name, email, phone),
        cars (plate_number, car_models (name, car_brands (name)))
      `)
      .eq('owner_id', user!.id)
      .order('created_at', { ascending: false })

    if (data) setBookings(data as unknown as ListerBooking[])
    setLoading(false)
  }

  const handleAction = async (bookingId: string, action: 'accept' | 'reject' | 'complete') => {
    setActionLoading(bookingId)
    let update: Record<string, unknown> = {}

    if (action === 'accept') update = { status: 'owner_accepted' }
    else if (action === 'reject') update = { status: 'owner_rejected' }
    else if (action === 'complete') update = { owner_completed: true }

    const { error } = await supabase.from('bookings').update(update).eq('id', bookingId)

    if (error) {
      toast.error('Action failed')
    } else {
      toast.success(
        action === 'accept' ? 'Booking accepted!' :
        action === 'reject' ? 'Booking rejected' :
        'Marked as complete'
      )
      fetchBookings()
    }
    setActionLoading(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings Received</h1>
        <p className="text-muted-foreground mt-1">Manage incoming rental requests for your vehicles</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20">
          <LayoutDashboard className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No bookings received yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Bookings for your vehicles will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Card key={b.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">
                      {b.cars.car_models.car_brands.name} {b.cars.car_models.name}
                      <span className="text-muted-foreground font-normal ml-2 text-sm">({b.cars.plate_number})</span>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Renter: <span className="text-foreground font-medium">{b.profiles.full_name || b.profiles.email}</span>
                      {b.profiles.phone && ` · ${b.profiles.phone}`}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(b.start_date), 'MMM d, yyyy')} – {format(new Date(b.end_date), 'MMM d, yyyy')}
                      <span className="font-medium text-foreground ml-1">({b.total_days} days)</span>
                    </p>
                    <p className="text-lg font-bold">₱{Number(b.total_price).toLocaleString()}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {b.status === 'pending_owner' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAction(b.id, 'accept')}
                          disabled={actionLoading === b.id}
                          className="gap-1"
                        >
                          {actionLoading === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(b.id, 'reject')}
                          disabled={actionLoading === b.id}
                          className="gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </Button>
                      </>
                    )}
                    {(b.status === 'active' || b.status === 'fully_paid') && !b.owner_completed && (
                      <Button
                        size="sm"
                        onClick={() => handleAction(b.id, 'complete')}
                        disabled={actionLoading === b.id}
                        className="gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Complete
                      </Button>
                    )}
                    {b.status !== 'pending_owner' && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        b.status === 'owner_accepted' || b.status === 'completed' ? 'text-green-600 bg-green-50 dark:bg-green-950/30' :
                        b.status === 'owner_rejected' || b.status === 'cancelled' ? 'text-red-600 bg-red-50 dark:bg-red-950/30' :
                        'text-amber-600 bg-amber-50 dark:bg-amber-950/30'
                      }`}>
                        {b.status === 'owner_accepted' ? <CheckCircle2 className="w-3 h-3" /> :
                         b.status === 'owner_rejected' ? <XCircle className="w-3 h-3" /> :
                         b.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> :
                         <Clock className="w-3 h-3" />}
                        {b.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
