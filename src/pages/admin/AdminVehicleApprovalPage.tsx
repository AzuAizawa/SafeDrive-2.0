import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Car, CheckCircle, XCircle, X, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface PendingCar {
  id: string; plate_number: string; mileage: number | null; price_per_day: number
  location: string | null; additional_info: string | null; status: string
  contact_number: string | null; created_at: string
  car_models: { name: string; body_type: string; seats: number; fuel_type: string; car_brands: { name: string } }
  car_images: { id: string; storage_path: string; is_primary: boolean }[]
  car_documents: { id: string; document_type: string; storage_path: string }[]
  profiles: { id: string; full_name: string | null; email: string; phone: string | null; first_name: string | null; last_name: string | null; driver_license: string | null; national_id: string | null; address: string | null }
}

export default function AdminVehicleApprovalPage() {
  const { user: adminUser } = useAuth()
  const [cars, setCars] = useState<PendingCar[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PendingCar | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => { fetchCars() }, [])

  const fetchCars = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('cars')
      .select('*, car_models(name, body_type, seats, fuel_type, car_brands(name)), car_images(*), car_documents(*), profiles!cars_owner_id_fkey(id, full_name, email, phone, first_name, last_name, driver_license, national_id, address)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (data) setCars(data as unknown as PendingCar[])
    setLoading(false)
  }

  const getUrl = (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  const handleApprove = async () => {
    if (!selected || !adminUser) return
    setActionLoading(true)
    const { error } = await supabase.from('cars').update({ status: 'approved', rejection_reason: null }).eq('id', selected.id)
    if (!error) {
      await supabase.from('notifications').insert({ user_id: selected.profiles.id, title: 'Vehicle Approved!', message: `Your ${selected.car_models.car_brands.name} ${selected.car_models.name} has been approved and is now listed.`, type: 'success', link: '/my-vehicles' })
      await supabase.from('audit_log').insert({ user_id: adminUser.id, action: 'admin_approved_vehicle', entity_type: 'car', entity_id: selected.id })
      toast.success('Vehicle approved and listed!')
      setSelected(null); fetchCars()
    }
    setActionLoading(false)
  }

  const handleReject = async () => {
    if (!selected || !adminUser || !rejectionReason.trim()) { toast.error('Provide a reason'); return }
    setActionLoading(true)
    const { error } = await supabase.from('cars').update({ status: 'rejected', rejection_reason: rejectionReason }).eq('id', selected.id)
    if (!error) {
      await supabase.from('notifications').insert({ user_id: selected.profiles.id, title: 'Vehicle Rejected', message: `Your ${selected.car_models.car_brands.name} ${selected.car_models.name} was rejected. Reason: ${rejectionReason}`, type: 'error', link: '/my-vehicles' })
      await supabase.from('audit_log').insert({ user_id: adminUser.id, action: 'admin_rejected_vehicle', entity_type: 'car', entity_id: selected.id, details: { reason: rejectionReason } })
      toast.success('Vehicle rejected')
      setSelected(null); setRejectionReason(''); setShowReject(false); fetchCars()
    }
    setActionLoading(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Approval</h1>
        <p className="text-muted-foreground mt-1">Review and approve vehicle listings</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : cars.length === 0 ? (
        <div className="text-center py-20">
          <Car className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No pending vehicles</h3>
          <p className="text-muted-foreground text-sm">All vehicle submissions have been reviewed.</p>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plate</TableHead>
                <TableHead>Price/Day</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car) => (
                <TableRow key={car.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelected(car); setShowReject(false); setRejectionReason('') }}>
                  <TableCell className="font-medium">{car.car_models.car_brands.name} {car.car_models.name}</TableCell>
                  <TableCell>{car.profiles.full_name || car.profiles.email}</TableCell>
                  <TableCell className="font-mono">{car.plate_number}</TableCell>
                  <TableCell>₱{Number(car.price_per_day).toLocaleString()}</TableCell>
                  <TableCell>{format(new Date(car.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost"><Eye className="w-3.5 h-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Vehicle Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold">Vehicle Review</h2>
              <Button size="icon" variant="ghost" onClick={() => setSelected(null)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-6 space-y-5">
              {/* Vehicle Info */}
              <div>
                <h3 className="font-semibold text-lg">{selected.car_models.car_brands.name} {selected.car_models.name}</h3>
                <div className="grid sm:grid-cols-2 gap-3 mt-3 text-sm">
                  <div><span className="text-muted-foreground">Body Type:</span> <span className="capitalize font-medium">{selected.car_models.body_type}</span></div>
                  <div><span className="text-muted-foreground">Seats:</span> <span className="font-medium">{selected.car_models.seats}</span></div>
                  <div><span className="text-muted-foreground">Fuel:</span> <span className="capitalize font-medium">{selected.car_models.fuel_type}</span></div>
                  <div><span className="text-muted-foreground">Plate:</span> <span className="font-mono font-medium">{selected.plate_number}</span></div>
                  <div><span className="text-muted-foreground">Mileage:</span> <span className="font-medium">{selected.mileage ? `${selected.mileage.toLocaleString()} km` : 'N/A'}</span></div>
                  <div><span className="text-muted-foreground">Price/Day:</span> <span className="font-medium">₱{Number(selected.price_per_day).toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{selected.location || 'N/A'}</span></div>
                  <div><span className="text-muted-foreground">Contact:</span> <span className="font-medium">{selected.contact_number || selected.profiles.phone || 'N/A'}</span></div>
                </div>
                {selected.additional_info && <p className="text-sm text-muted-foreground mt-2">Additional: {selected.additional_info}</p>}
              </div>

              {/* Car Images */}
              {selected.car_images.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Car Images</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selected.car_images.map((img) => (
                      <a key={img.id} href={getUrl('vehicle-documents', img.storage_path)} target="_blank" rel="noopener noreferrer">
                        <img src={getUrl('vehicle-documents', img.storage_path)} alt="Car" className="w-full h-24 object-cover rounded-lg border hover:ring-2 hover:ring-primary cursor-pointer" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* ORCR (admin only) */}
              {selected.car_documents.filter((d) => d.document_type === 'orcr').length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">ORCR Document (Admin Only)</h4>
                  {selected.car_documents.filter((d) => d.document_type === 'orcr').map((doc) => (
                    <a key={doc.id} href={getUrl('vehicle-documents', doc.storage_path)} target="_blank" rel="noopener noreferrer">
                      <img src={getUrl('vehicle-documents', doc.storage_path)} alt="ORCR" className="w-48 h-32 object-cover rounded-lg border hover:ring-2 hover:ring-primary cursor-pointer" />
                    </a>
                  ))}
                </div>
              )}

              {/* Rental Agreement */}
              {selected.car_documents.filter((d) => d.document_type === 'rental_agreement').length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Rental Agreement</h4>
                  {selected.car_documents.filter((d) => d.document_type === 'rental_agreement').map((doc) => (
                    <a key={doc.id} href={getUrl('vehicle-documents', doc.storage_path)} target="_blank" rel="noopener noreferrer">
                      <img src={getUrl('vehicle-documents', doc.storage_path)} alt="Rental Agreement" className="w-48 h-32 object-cover rounded-lg border hover:ring-2 hover:ring-primary cursor-pointer" />
                    </a>
                  ))}
                </div>
              )}

              {/* Owner Info for cross-checking */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-semibold mb-2">Owner Verification (Cross-Check)</h4>
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selected.profiles.full_name || `${selected.profiles.first_name || ''} ${selected.profiles.last_name || ''}`}</span></div>
                  <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selected.profiles.email}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{selected.profiles.phone || 'N/A'}</span></div>
                  <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{selected.profiles.address || 'N/A'}</span></div>
                  <div><span className="text-muted-foreground">Driver's License:</span> <span className="font-medium">{selected.profiles.driver_license || 'N/A'}</span></div>
                  <div><span className="text-muted-foreground">National ID:</span> <span className="font-medium">{selected.profiles.national_id || 'N/A'}</span></div>
                </div>
              </div>

              {/* Rejection reason */}
              {showReject && (
                <div className="space-y-2">
                  <Label>Rejection Reason *</Label>
                  <Input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Reason for rejecting this vehicle..." />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button onClick={handleApprove} disabled={actionLoading} className="gap-2">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve & List
                </Button>
                {!showReject ? (
                  <Button variant="destructive" onClick={() => setShowReject(true)} className="gap-2">
                    <XCircle className="w-4 h-4" /> Reject
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={handleReject} disabled={actionLoading || !rejectionReason.trim()} className="gap-2">
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Confirm Reject
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
