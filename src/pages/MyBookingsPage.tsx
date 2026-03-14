import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, CreditCard, Download } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface BookingRow {
  id: string
  car_id: string
  start_date: string
  end_date: string
  total_days: number
  total_price: number
  base_price: number
  commission: number
  downpayment_amount: number
  balance_amount: number
  status: string
  renter_completed: boolean
  owner_completed: boolean
  payment_deadline: string | null
  owner_response_deadline: string | null
  created_at: string
  cars: {
    plate_number: string
    location: string | null
    car_models: {
      name: string
      car_brands: { name: string }
    }
    car_documents: { document_type: string; storage_path: string }[]
  }
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending_owner: { label: 'Awaiting Owner', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30', icon: Clock },
  owner_accepted: { label: 'Owner Accepted', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30', icon: CheckCircle2 },
  owner_rejected: { label: 'Rejected', color: 'text-red-600 bg-red-50 dark:bg-red-950/30', icon: XCircle },
  pending_payment: { label: 'Pay Downpayment', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30', icon: AlertCircle },
  downpayment_paid: { label: 'Downpayment Paid', color: 'text-green-600 bg-green-50 dark:bg-green-950/30', icon: CheckCircle2 },
  active: { label: 'Active Rental', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30', icon: Calendar },
  pending_balance: { label: 'Pay Balance', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30', icon: AlertCircle },
  fully_paid: { label: 'Fully Paid', color: 'text-green-600 bg-green-50 dark:bg-green-950/30', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'text-green-700 bg-green-50 dark:bg-green-950/30', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'text-muted-foreground bg-muted', icon: XCircle },
  expired: { label: 'Expired', color: 'text-muted-foreground bg-muted', icon: XCircle },
}

export default function MyBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [payingFor, setPayingFor] = useState<string | null>(null)

  useEffect(() => {
    if (user) fetchBookings()
  }, [user])

  const fetchBookings = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        cars (
          plate_number, location,
          car_models (name, car_brands (name)),
          car_documents (document_type, storage_path)
        )
      `)
      .eq('renter_id', user!.id)
      .order('created_at', { ascending: false })

    if (data) setBookings(data as unknown as BookingRow[])
    setLoading(false)
  }

  const handlePayDownpayment = async (booking: BookingRow) => {
    setPayingFor(booking.id)
    // In test mode, we simulate payment by updating status directly
    // In production, this would create a PayMongo checkout session
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'downpayment_paid' })
      .eq('id', booking.id)

    if (!error) {
      await supabase.from('payments').insert({
        booking_id: booking.id,
        amount: Number(booking.downpayment_amount),
        payment_type: 'downpayment',
        status: 'completed',
        payment_method: 'paymongo_test',
        notes: 'Downpayment via PayMongo (test mode)',
      })
      await supabase.from('audit_log').insert({
        user_id: user!.id,
        action: 'downpayment_paid',
        entity_type: 'booking',
        entity_id: booking.id,
        details: { amount: Number(booking.downpayment_amount) },
      })
      toast.success('Downpayment processed!', { description: 'Your booking is now confirmed.' })
      fetchBookings()
    } else {
      toast.error('Payment failed')
    }
    setPayingFor(null)
  }

  const handlePayBalance = async (booking: BookingRow) => {
    setPayingFor(booking.id)
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'fully_paid' })
      .eq('id', booking.id)

    if (!error) {
      await supabase.from('payments').insert({
        booking_id: booking.id,
        amount: Number(booking.balance_amount),
        payment_type: 'balance',
        status: 'completed',
        payment_method: 'paymongo_test',
        notes: 'Balance payment via PayMongo (test mode)',
      })
      await supabase.from('audit_log').insert({
        user_id: user!.id,
        action: 'balance_paid',
        entity_type: 'booking',
        entity_id: booking.id,
        details: { amount: Number(booking.balance_amount) },
      })
      toast.success('Balance paid!', { description: 'Your rental is now fully paid.' })
      fetchBookings()
    }
    setPayingFor(null)
  }

  const handleComplete = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ renter_completed: true })
      .eq('id', bookingId)

    if (error) {
      toast.error('Failed to mark as complete')
    } else {
      toast.success('Marked as completed from your side!')
      fetchBookings()
    }
  }

  const getDocUrl = (path: string) => {
    const { data } = supabase.storage.from('vehicle-documents').getPublicUrl(path)
    return data.publicUrl
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
            <Card key={i}><CardContent className="p-5"><div className="flex gap-4"><Skeleton className="h-16 w-16 rounded-lg" /><div className="space-y-2 flex-1"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-full" /></div></div></CardContent></Card>
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
            const rentalAgreement = booking.cars.car_documents?.find((d) => d.document_type === 'rental_agreement')

            return (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
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
                        {booking.cars.location && <p>Pickup/Dropoff: {booking.cars.location}</p>}
                      </div>

                      {/* Rental Agreement Download */}
                      {rentalAgreement && (booking.status === 'downpayment_paid' || booking.status === 'active' || booking.status === 'fully_paid' || booking.status === 'completed') && (
                        <a
                          href={getDocUrl(rentalAgreement.storage_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Rental Agreement
                        </a>
                      )}
                    </div>

                    <div className="text-right space-y-2 shrink-0">
                      <p className="text-lg font-bold">₱{Number(booking.total_price).toLocaleString()}</p>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>Base: ₱{Number(booking.base_price).toLocaleString()}</p>
                        <p>Commission: ₱{Number(booking.commission).toLocaleString()}</p>
                        <p>Down: ₱{Number(booking.downpayment_amount).toLocaleString()}</p>
                        <p>Balance: ₱{Number(booking.balance_amount).toLocaleString()}</p>
                      </div>

                      {/* Pay Downpayment */}
                      {(booking.status === 'owner_accepted' || booking.status === 'pending_payment') && (
                        <Button
                          size="sm"
                          onClick={() => handlePayDownpayment(booking)}
                          disabled={payingFor === booking.id}
                          className="gap-1 mt-2 shadow-lg shadow-primary/20"
                        >
                          {payingFor === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                          Pay ₱{Number(booking.downpayment_amount).toLocaleString()}
                        </Button>
                      )}

                      {/* Pay Balance */}
                      {(booking.status === 'active' || booking.status === 'downpayment_paid' || booking.status === 'pending_balance') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePayBalance(booking)}
                          disabled={payingFor === booking.id}
                          className="gap-1 mt-2"
                        >
                          {payingFor === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                          Pay Balance ₱{Number(booking.balance_amount).toLocaleString()}
                        </Button>
                      )}

                      {/* Mark Complete */}
                      {(booking.status === 'active' || booking.status === 'fully_paid') && !booking.renter_completed && (
                        <Button size="sm" variant="outline" onClick={() => handleComplete(booking.id)} className="gap-1 mt-2">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Complete
                        </Button>
                      )}

                      {booking.renter_completed && !booking.owner_completed && booking.status !== 'completed' && (
                        <p className="text-xs text-amber-600 mt-1">Waiting for owner to mark complete</p>
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
