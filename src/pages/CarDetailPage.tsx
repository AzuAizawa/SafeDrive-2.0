import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CarFront, MapPin, Fuel, Users, Gauge, Calendar, ArrowLeft,
  ChevronLeft, ChevronRight, ShieldCheck, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { differenceInDays, format, addDays } from 'date-fns'
import type { CarWithDetails } from '@/types/database'

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [car, setCar] = useState<CarWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) fetchCar()
  }, [id])

  const fetchCar = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cars')
      .select(`
        *,
        car_models!inner (
          *,
          car_brands!inner (*)
        ),
        car_images (*),
        profiles!cars_owner_id_fkey (full_name, phone, email)
      `)
      .eq('id', id!)
      .single()

    if (!error && data) {
      setCar(data as unknown as CarWithDetails)
    }
    setLoading(false)
  }

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from('vehicle-documents').getPublicUrl(path)
    return data.publicUrl
  }

  const images = car?.car_images || []
  const currentImage = images[currentImageIndex]

  const handleBooking = async () => {
    if (!user || !car || !profile) return

    if (profile.verified_status !== 'verified') {
      toast.error('Verification required', { description: 'Complete identity verification before booking.' })
      navigate('/verify')
      return
    }

    if (car.owner_id === user.id) {
      toast.error("You can't book your own car")
      return
    }

    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates')
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (start < today) {
      toast.error('Start date must be in the future')
      return
    }

    if (end <= start) {
      toast.error('End date must be after start date')
      return
    }

    const totalDays = differenceInDays(end, start)
    const pricePerDay = Number(car.price_per_day)
    const basePrice = pricePerDay * totalDays
    const commission = pricePerDay * 0.1 * totalDays
    const totalPrice = basePrice + commission
    const downpayment = Math.ceil(totalPrice * 0.5)
    const balance = totalPrice - downpayment

    setSubmitting(true)
    const { error } = await supabase.from('bookings').insert({
      car_id: car.id,
      renter_id: user.id,
      owner_id: car.owner_id,
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      base_price: basePrice,
      commission: commission,
      total_price: totalPrice,
      downpayment_amount: downpayment,
      balance_amount: balance,
      status: 'pending_owner',
      owner_response_deadline: addDays(new Date(), 1).toISOString(),
      renter_completed: false,
      owner_completed: false,
    })

    if (error) {
      toast.error('Booking failed', { description: error.message })
    } else {
      // Log audit
      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'booking_created',
        entity_type: 'booking',
        details: { car_id: car.id, total_price: totalPrice },
      })
      toast.success('Booking request sent!', { description: 'Waiting for owner approval.' })
      navigate('/my-bookings')
    }
    setSubmitting(false)
  }

  // Price calculations for preview
  const totalDays = startDate && endDate ? Math.max(differenceInDays(new Date(endDate), new Date(startDate)), 0) : 0
  const pricePerDay = car ? Number(car.price_per_day) : 0
  const basePrice = pricePerDay * totalDays
  const commissionAmount = pricePerDay * 0.1 * totalDays
  const totalPrice = basePrice + commissionAmount

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!car) {
    return (
      <div className="text-center py-20">
        <CarFront className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold">Car not found</h3>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/browse')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Browse
        </Button>
      </div>
    )
  }

  const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/browse')} className="gap-2 -ml-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Browse
      </Button>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Images & Details */}
        <div className="lg:col-span-3 space-y-5">
          {/* Image Gallery */}
          <div className="relative rounded-xl overflow-hidden bg-muted aspect-[16/10]">
            {currentImage ? (
              <img
                src={getImageUrl(currentImage.storage_path)}
                alt="Car"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <CarFront className="w-24 h-24 text-muted-foreground/15" />
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors shadow"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors shadow"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentImageIndex ? 'bg-white w-5' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Car Info */}
          <div>
            <h1 className="text-2xl font-bold">
              {car.car_models.car_brands.name} {car.car_models.name}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Listed by {car.profiles?.full_name || 'Owner'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: CarFront, label: 'Type', value: car.car_models.body_type },
              { icon: Users, label: 'Seats', value: `${car.car_models.seats} seats` },
              { icon: Fuel, label: 'Fuel', value: car.car_models.fuel_type },
              { icon: Gauge, label: 'Mileage', value: car.mileage ? `${car.mileage.toLocaleString()} km` : 'N/A' },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <item.icon className="w-4 h-4 text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium capitalize">{item.value}</p>
              </div>
            ))}
          </div>

          {car.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              Pickup/Dropoff: {car.location}
            </div>
          )}

          {car.additional_info && (
            <div>
              <h3 className="font-semibold mb-1">Additional Info</h3>
              <p className="text-sm text-muted-foreground">{car.additional_info}</p>
            </div>
          )}
        </div>

        {/* Right: Booking Card */}
        <div className="lg:col-span-2">
          <Card className="sticky top-24 shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Book this car</span>
                <span className="text-primary">₱{pricePerDay.toLocaleString()}<span className="text-sm text-muted-foreground font-normal">/day</span></span>
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                Verified owner · Insured rental
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={minDate}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || minDate}
                  className="h-10"
                />
              </div>

              {totalDays > 0 && (
                <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">₱{pricePerDay.toLocaleString()} × {totalDays} day{totalDays > 1 ? 's' : ''}</span>
                    <span>₱{basePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service fee (10%)</span>
                    <span>₱{commissionAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-border pt-2 mt-2">
                    <span>Total</span>
                    <span>₱{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Downpayment (50%)</span>
                    <span>₱{Math.ceil(totalPrice * 0.5).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleBooking}
                disabled={submitting || !startDate || !endDate || totalDays <= 0}
                className="w-full h-11 shadow-lg shadow-primary/20 text-base"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Request to Book
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                You won't be charged until the owner accepts your request.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
