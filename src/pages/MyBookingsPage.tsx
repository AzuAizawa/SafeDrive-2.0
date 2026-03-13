import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface BookingRow {
  id: string
  car_id: string
  start_date: string
  end_date: string
  total_days: number
  total_price: number
  downpayment_amount: number
  balance_amount: number
  status: string
  renter_completed: boolean
  owner_completed: boolean
  created_at: string
  cars: {
    plate_number: string
    car_models: {
      name: string
      car_brands: { name: string }
    }
  }
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending_owner: { label: 'Awaiting Owner', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30', icon: Clock },
  owner_accepted: { label: 'Owner Accepted', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30', icon: CheckCircle2 },
  owner_rejected: { label: 'Rejected', color: 'text-red-600 bg-red-50 dark:bg-red-950/30', icon: XCircle },
  pending_payment: { label: 'Pay Downpayment', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30', icon: AlertCircle },
  downpayment_paid: { label: 'Downpayment Paid', color: 'text-green-600 bg-green-50 dark:bg-green-950/30', icon: CheckCircle2 },
  active: { label: 'Active Rental', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30', icon: Calendar },
  fully_paid: { label: 'Fully Paid', color: 'text-green-600 bg-green-50 dark:bg-green-950/30', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'text-green-700 bg-green-50 dark:bg-green-950/30', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'text-muted-foreground bg-muted', icon: XCircle },
  expired: { label: 'Expired', color: 'text-muted-foreground bg-muted', icon: XCircle },
}

export default function MyBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchBookings()
  }, [user])

  const fetchBookings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        cars (
          plate_number,
          car_models (
            name,
            car_brands (name)
          )
        )
      `)
      .eq('renter_id', user!.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setBookings(data as unknown as BookingRow[])
    }
    setLoading(false)
  }

  const handleComplete = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ renter_completed: true })
      .eq('id', bookingId)

    if (error) {
      toast.error('Failed to mark as complete')
    } else {
      toast.success('Marked as completed!')
      fetchBookings()
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground mt-1">Track your rental requests and active bookings</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No bookings yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Browse available cars and make your first booking!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const status = statusConfig[booking.status] || statusConfig.pending_owner
            const StatusIcon = status.icon
            return (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-base">
                          {booking.cars.car_models.car_brands.name} {booking.cars.car_models.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        <p>Plate: {booking.cars.plate_number}</p>
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(booking.start_date), 'MMM d, yyyy')} – {format(new Date(booking.end_date), 'MMM d, yyyy')}
                          <span className="font-medium text-foreground ml-1">({booking.total_days} days)</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-lg font-bold">₱{Number(booking.total_price).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        Down: ₱{Number(booking.downpayment_amount).toLocaleString()} · Balance: ₱{Number(booking.balance_amount).toLocaleString()}
                      </p>
                      {(booking.status === 'active' || booking.status === 'fully_paid') && !booking.renter_completed && (
                        <Button size="sm" onClick={() => handleComplete(booking.id)} className="mt-2">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
