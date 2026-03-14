import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, CheckCircle2, XCircle, LayoutDashboard, Loader2, User, MapPin, Phone, X } from 'lucide-react'
import { toast } from 'sonner'
import { format, addDays } from 'date-fns'

interface ListerBooking {
  id: string
  start_date: string; end_date: string; total_days: number
  total_price: number; base_price: number; commission: number
  downpayment_amount: number; balance_amount: number
  status: string; owner_completed: boolean; renter_completed: boolean
  owner_response_deadline: string | null; created_at: string
  renter: {
    full_name: string | null; email: string; phone: string | null
    address: string | null; birthday: string | null
    verification_images: { image_type: string; storage_path: string }[]
  }
  cars: {
    plate_number: string; location: string | null
    car_models: { name: string; car_brands: { name: string } }
  }
}

export default function ListerBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<ListerBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedRenter, setSelectedRenter] = useState<ListerBooking | null>(null)

  useEffect(() => { if (user) fetchBookings() }, [user])

  const fetchBookings = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        renter:profiles!bookings_renter_id_fkey(full_name, email, phone, address, birthday, verification_images(image_type, storage_path)),
        cars(plate_number, location, car_models(name, car_brands(name)))
      `)
      .eq('owner_id', user!.id)
      .order('created_at', { ascending: false })

    if (data) setBookings(data as unknown as ListerBooking[])
    setLoading(false)
  }

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from('user-verification').getPublicUrl(path)
    return data.publicUrl
  }

  const handleAccept = async (bookingId: string) => {
    setActionLoading(bookingId)
    const deadline = addDays(new Date(), 1).toISOString()
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'pending_payment', payment_deadline: deadline })
      .eq('id', bookingId)

    if (!error) {
      const booking = bookings.find((b) => b.id === bookingId)
      if (booking) {
        await supabase.from('notifications').insert({
          user_id: booking.renter.email, // We need renter_id from the booking
          title: 'Booking Accepted!',
          message: `Your booking for ${booking.cars.car_models.car_brands.name} ${booking.cars.car_models.name} has been accepted. Pay the downpayment within 24 hours.`,
          type: 'success',
          link: '/my-bookings',
        })
      }
      await supabase.from('audit_log').insert({
        user_id: user!.id,
        action: 'owner_accepted_booking',
        entity_type: 'booking',
        entity_id: bookingId,
      })
      toast.success('Booking accepted! Renter has 24 hrs to pay downpayment.')
      fetchBookings()
    }
    setActionLoading(null)
  }

  const handleReject = async (bookingId: string) => {
    setActionLoading(bookingId)
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'owner_rejected' })
      .eq('id', bookingId)

    if (!error) {
      await supabase.from('audit_log').insert({
        user_id: user!.id,
        action: 'owner_rejected_booking',
        entity_type: 'booking',
        entity_id: bookingId,
      })
      toast.success('Booking rejected')
      fetchBookings()
    }
    setActionLoading(null)
  }

  const handleComplete = async (bookingId: string) => {
    setActionLoading(bookingId)
    const { error } = await supabase
      .from('bookings')
      .update({ owner_completed: true })
      .eq('id', bookingId)

    if (!error) {
      toast.success('Marked as complete from your side!')
      fetchBookings()
    }
    setActionLoading(null)
  }

  const statusBadge = (status: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      pending_owner: { label: 'Pending Your Response', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
      pending_payment: { label: 'Awaiting Payment', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
      downpayment_paid: { label: 'Downpayment Paid', color: 'text-green-600 bg-green-50 dark:bg-green-950/30' },
      active: { label: 'Active Rental', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
      fully_paid: { label: 'Fully Paid', color: 'text-green-600 bg-green-50 dark:bg-green-950/30' },
      completed: { label: 'Completed', color: 'text-green-700 bg-green-50 dark:bg-green-950/30' },
      owner_accepted: { label: 'Accepted', color: 'text-green-600 bg-green-50 dark:bg-green-950/30' },
      owner_rejected: { label: 'Rejected', color: 'text-red-600 bg-red-50 dark:bg-red-950/30' },
      cancelled: { label: 'Cancelled', color: 'text-muted-foreground bg-muted' },
      expired: { label: 'Expired', color: 'text-muted-foreground bg-muted' },
    }
    return configs[status] || { label: status, color: 'text-muted-foreground bg-muted' }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings Received</h1>
        <p className="text-muted-foreground mt-1">Manage incoming rental requests for your vehicles</p>
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="p-5 space-y-3"><Skeleton className="h-5 w-64" /><Skeleton className="h-4 w-48" /><Skeleton className="h-4 w-full" /></CardContent></Card>)}</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20">
          <LayoutDashboard className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No bookings received yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Bookings for your vehicles will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const badge = statusBadge(b.status)
            return (
              <Card key={b.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold">
                          {b.cars.car_models.car_brands.name} {b.cars.car_models.name}
                          <span className="text-muted-foreground font-normal ml-2 text-sm">({b.cars.plate_number})</span>
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Renter info */}
                      <div className="flex items-center gap-3 text-sm">
                        <button
                          onClick={() => setSelectedRenter(b)}
                          className="flex items-center gap-1.5 text-primary hover:underline"
                        >
                          <User className="w-3.5 h-3.5" />
                          {b.renter.full_name || b.renter.email}
                        </button>
                        {b.renter.phone && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-3 h-3" /> {b.renter.phone}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(b.start_date), 'MMM d, yyyy')} – {format(new Date(b.end_date), 'MMM d, yyyy')}
                        <span className="font-medium text-foreground ml-1">({b.total_days} days)</span>
                      </p>
                      {b.cars.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {b.cars.location}
                        </p>
                      )}
                    </div>

                    <div className="text-right space-y-2 shrink-0">
                      <p className="text-lg font-bold">₱{Number(b.total_price).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        You receive: <span className="text-green-600 font-semibold">₱{Number(b.base_price).toLocaleString()}</span>
                      </p>

                      {b.status === 'pending_owner' && (
                        <div className="flex gap-2 mt-2 justify-end">
                          <Button size="sm" onClick={() => handleAccept(b.id)} disabled={actionLoading === b.id} className="gap-1">
                            {actionLoading === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Accept
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(b.id)} disabled={actionLoading === b.id} className="gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </Button>
                        </div>
                      )}

                      {(b.status === 'active' || b.status === 'fully_paid') && !b.owner_completed && (
                        <Button size="sm" variant="outline" onClick={() => handleComplete(b.id)} disabled={actionLoading === b.id} className="gap-1 mt-2">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
                        </Button>
                      )}

                      {b.owner_completed && !b.renter_completed && b.status !== 'completed' && (
                        <p className="text-xs text-amber-600 mt-1">Waiting for renter to complete</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Renter Detail Modal */}
      {selectedRenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedRenter(null)}>
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold">Renter Information</h2>
              <Button size="icon" variant="ghost" onClick={() => setSelectedRenter(null)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Name:</span><p className="font-medium">{selectedRenter.renter.full_name || '—'}</p></div>
                <div><span className="text-muted-foreground">Email:</span><p className="font-medium">{selectedRenter.renter.email}</p></div>
                <div><span className="text-muted-foreground">Phone:</span><p className="font-medium">{selectedRenter.renter.phone || '—'}</p></div>
                <div><span className="text-muted-foreground">Birthday:</span><p className="font-medium">{selectedRenter.renter.birthday ? format(new Date(selectedRenter.renter.birthday), 'MMM d, yyyy') : '—'}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground">Address:</span><p className="font-medium">{selectedRenter.renter.address || '—'}</p></div>
              </div>

              {/* Renter selfie for meetup verification */}
              {selectedRenter.renter.verification_images?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Verification Images</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedRenter.renter.verification_images
                      .filter((img) => img.image_type === 'selfie' || img.image_type === 'selfie_with_id')
                      .map((img, i) => (
                        <div key={i}>
                          <p className="text-xs text-muted-foreground capitalize mb-1">{img.image_type.replace(/_/g, ' ')}</p>
                          <a href={getImageUrl(img.storage_path)} target="_blank" rel="noopener noreferrer">
                            <img src={getImageUrl(img.storage_path)} alt={img.image_type} className="w-full h-28 object-cover rounded-lg border hover:ring-2 hover:ring-primary cursor-pointer" />
                          </a>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
