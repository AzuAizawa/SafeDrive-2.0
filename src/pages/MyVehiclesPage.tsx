import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Car, Plus, Loader2, CheckCircle, Clock, XCircle, ImageIcon, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { CarBrand, CarModel } from '@/types/database'

interface VehicleRow {
  id: string
  plate_number: string
  mileage: number | null
  price_per_day: number
  location: string | null
  status: string
  car_models: { name: string; body_type: string; car_brands: { name: string } }
}

const statusBadge: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
  approved: { label: 'Approved', color: 'text-green-600 bg-green-50 dark:bg-green-950/30' },
  active: { label: 'Active', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
  rejected: { label: 'Rejected', color: 'text-red-600 bg-red-50 dark:bg-red-950/30' },
  inactive: { label: 'Inactive', color: 'text-muted-foreground bg-muted' },
}

export default function MyVehiclesPage() {
  const { user, profile } = useAuth()
  const [vehicles, setVehicles] = useState<VehicleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [brands, setBrands] = useState<CarBrand[]>([])
  const [models, setModels] = useState<CarModel[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    brand_id: '',
    model_id: '',
    plate_number: '',
    mileage: '',
    price_per_day: '',
    location: '',
    additional_info: '',
  })
  const [carImages, setCarImages] = useState<File[]>([])
  const [orcrFile, setOrcrFile] = useState<File | null>(null)

  useEffect(() => {
    if (user) {
      fetchVehicles()
      fetchBrands()
    }
  }, [user])

  const fetchVehicles = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('cars')
      .select('*, car_models(name, body_type, car_brands(name))')
      .eq('owner_id', user!.id)
      .order('created_at', { ascending: false })
    if (data) setVehicles(data as unknown as VehicleRow[])
    setLoading(false)
  }

  const fetchBrands = async () => {
    const { data } = await supabase.from('car_brands').select('*').order('name')
    if (data) setBrands(data)
  }

  const fetchModels = async (brandId: string) => {
    const { data } = await supabase.from('car_models').select('*').eq('brand_id', brandId).order('name')
    if (data) setModels(data)
  }

  const maxSlots = 5 + (profile?.is_lister ? 0 : 0) // Could be expanded with subscription
  const canAddMore = vehicles.length < maxSlots

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !form.model_id) return

    if (profile?.verified_status !== 'verified') {
      toast.error('Must be verified to list a vehicle')
      return
    }

    setSubmitting(true)
    try {
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .insert({
          owner_id: user.id,
          model_id: form.model_id,
          plate_number: form.plate_number,
          mileage: form.mileage ? parseInt(form.mileage) : null,
          price_per_day: parseFloat(form.price_per_day),
          location: form.location || null,
          additional_info: form.additional_info || null,
        })
        .select()
        .single()

      if (carError) throw carError

      // Upload car images
      for (let i = 0; i < carImages.length; i++) {
        const file = carImages[i]
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${carData.id}/image_${i}.${ext}`
        await supabase.storage.from('vehicle-documents').upload(path, file, { upsert: true })
        await supabase.from('car_images').insert({
          car_id: carData.id,
          storage_path: path,
          is_primary: i === 0,
        })
      }

      // Upload ORCR
      if (orcrFile) {
        const ext = orcrFile.name.split('.').pop()
        const path = `${user.id}/${carData.id}/orcr.${ext}`
        await supabase.storage.from('vehicle-documents').upload(path, orcrFile, { upsert: true })
        await supabase.from('car_documents').insert({
          car_id: carData.id,
          document_type: 'orcr',
          storage_path: path,
        })
      }

      // Audit log
      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'vehicle_submitted',
        entity_type: 'car',
        entity_id: carData.id,
      })

      toast.success('Vehicle submitted for approval!')
      setShowForm(false)
      setForm({ brand_id: '', model_id: '', plate_number: '', mileage: '', price_per_day: '', location: '', additional_info: '' })
      setCarImages([])
      setOrcrFile(null)
      fetchVehicles()
    } catch (err: unknown) {
      toast.error('Failed to submit', { description: (err as Error).message })
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Vehicles</h1>
          <p className="text-muted-foreground mt-1">
            {vehicles.length}/{maxSlots} slots used
          </p>
        </div>
        {canAddMore && !showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Vehicle
          </Button>
        )}
      </div>

      {/* Add Vehicle Form */}
      {showForm && (
        <Card className="animate-scale-in border-primary/20">
          <CardHeader>
            <CardTitle>List a New Vehicle</CardTitle>
            <CardDescription>Your vehicle will be reviewed by our team before going live.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand *</Label>
                  <Select
                    value={form.brand_id}
                    onValueChange={(val) => {
                      setForm({ ...form, brand_id: val, model_id: '' })
                      fetchModels(val)
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Model *</Label>
                  <Select value={form.model_id} onValueChange={(val) => setForm({ ...form, model_id: val })}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} ({m.body_type}, {m.seats} seats)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Plate Number *</Label>
                  <Input value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Mileage (km)</Label>
                  <Input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Price per Day (₱) *</Label>
                  <Input type="number" value={form.price_per_day} onChange={(e) => setForm({ ...form, price_per_day: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Pickup/Dropoff Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Additional Information</Label>
                  <Input value={form.additional_info} onChange={(e) => setForm({ ...form, additional_info: e.target.value })} placeholder="Any extra details about your car..." />
                </div>
              </div>

              {/* Image uploads */}
              <div className="space-y-2">
                <Label>Car Images (up to 4)</Label>
                <label className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                  <ImageIcon className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">
                    {carImages.length > 0 ? `${carImages.length} image(s) selected` : 'Click to upload'}
                  </span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, 4)
                    setCarImages(files)
                  }} />
                </label>
              </div>

              <div className="space-y-2">
                <Label>ORCR Document</Label>
                <label className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">
                    {orcrFile ? orcrFile.name : 'Upload ORCR image'}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setOrcrFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={submitting} className="gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Submit for Approval
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}

      {/* Vehicle list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 flex gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : vehicles.length === 0 && !showForm ? (
        <div className="text-center py-20">
          <Car className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No vehicles listed</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">Add your first vehicle to start earning.</p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Vehicle
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map((v) => {
            const badge = statusBadge[v.status] || statusBadge.pending
            return (
              <Card key={v.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Car className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {v.car_models.car_brands.name} {v.car_models.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {v.plate_number} · ₱{Number(v.price_per_day).toLocaleString()}/day
                        {v.location && ` · ${v.location}`}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                    {badge.label}
                  </span>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
