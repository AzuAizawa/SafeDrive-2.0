import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { CreditCard, CheckCircle, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface PayoutBooking {
  id: string
  start_date: string; end_date: string; total_days: number
  base_price: number; commission: number; total_price: number; status: string
  cars: { plate_number: string; car_models: { name: string; car_brands: { name: string } } }
  renter: { full_name: string | null; email: string }
  owner: { id: string; full_name: string | null; email: string; phone: string | null }
  payments: { id: string; payment_type: string; status: string; amount: number }[]
}

export default function AdminPayoutsPage() {
  const { user: adminUser } = useAuth()
  const [bookings, setBookings] = useState<PayoutBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingPayoutFor, setSendingPayoutFor] = useState<string | null>(null)

  useEffect(() => { fetchPayouts() }, [])

  const fetchPayouts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        cars(plate_number, car_models(name, car_brands(name))),
        renter:profiles!bookings_renter_id_fkey(full_name, email),
        owner:profiles!bookings_owner_id_fkey(id, full_name, email, phone),
        payments(*)
      `)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })

    if (data) setBookings(data as unknown as PayoutBooking[])
    setLoading(false)
  }

  const hasPayout = (b: PayoutBooking) => b.payments.some((p) => p.payment_type === 'payout' && p.status === 'completed')

  const handleSendPayout = async (booking: PayoutBooking) => {
    if (!adminUser) return
    setSendingPayoutFor(booking.id)

    const payoutAmount = Number(booking.base_price) // Owner gets base price (without commission)

    const { error } = await supabase.from('payments').insert({
      booking_id: booking.id,
      amount: payoutAmount,
      payment_type: 'payout',
      status: 'completed',
      notes: `Payout to ${booking.owner.full_name || booking.owner.email} for booking`,
    })

    if (!error) {
      await supabase.from('notifications').insert({
        user_id: booking.owner.id,
        title: 'Payout Received!',
        message: `₱${payoutAmount.toLocaleString()} has been sent to you for the ${booking.cars.car_models.car_brands.name} ${booking.cars.car_models.name} rental.`,
        type: 'success',
        link: '/lister-bookings',
      })
      await supabase.from('audit_log').insert({
        user_id: adminUser.id,
        action: 'payout_sent',
        entity_type: 'booking',
        entity_id: booking.id,
        details: { amount: payoutAmount, owner_email: booking.owner.email },
      })
      toast.success(`Payout of ₱${payoutAmount.toLocaleString()} marked as sent!`)
      fetchPayouts()
    } else {
      toast.error('Failed to create payout record')
    }
    setSendingPayoutFor(null)
  }

  const unpaid = bookings.filter((b) => !hasPayout(b))
  const paid = bookings.filter((b) => hasPayout(b))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Send Payments</h1>
        <p className="text-muted-foreground mt-1">Manually process owner payouts for completed bookings</p>
      </div>

      {/* Pending Payouts */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Pending Payouts ({unpaid.length})</h2>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : unpaid.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CreditCard className="w-12 h-12 mx-auto opacity-30 mb-3" />
            <p>No pending payouts</p>
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Renter</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Owner Payout</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaid.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.cars.car_models.car_brands.name} {b.cars.car_models.name}</TableCell>
                    <TableCell>{b.owner.full_name || b.owner.email}</TableCell>
                    <TableCell>{b.renter.full_name || b.renter.email}</TableCell>
                    <TableCell className="text-xs">{format(new Date(b.start_date), 'MMM d')} – {format(new Date(b.end_date), 'MMM d')}</TableCell>
                    <TableCell>₱{Number(b.total_price).toLocaleString()}</TableCell>
                    <TableCell className="text-amber-600">₱{Number(b.commission).toLocaleString()}</TableCell>
                    <TableCell className="font-semibold text-green-600">₱{Number(b.base_price).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleSendPayout(b)}
                        disabled={sendingPayoutFor === b.id}
                        className="gap-1"
                      >
                        {sendingPayoutFor === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Mark as Sent
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Completed Payouts */}
      {paid.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Completed Payouts ({paid.length})</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paid.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.cars.car_models.car_brands.name} {b.cars.car_models.name}</TableCell>
                    <TableCell>{b.owner.full_name || b.owner.email}</TableCell>
                    <TableCell className="font-medium">₱{Number(b.base_price).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                        <CheckCircle className="w-3 h-3" /> Sent
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  )
}
