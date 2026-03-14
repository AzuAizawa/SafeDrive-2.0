import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, Upload, Loader2, CheckCircle, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

const imageFields = [
  { key: 'license_front', label: "Driver's License (Front)" },
  { key: 'license_back', label: "Driver's License (Back)" },
  { key: 'national_id_front', label: "National ID (Front)" },
  { key: 'national_id_back', label: "National ID (Back)" },
  { key: 'selfie_with_id', label: 'Selfie Holding ID' },
  { key: 'selfie', label: 'Selfie (Face Only)' },
] as const

export default function VerificationPage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    middle_name: profile?.middle_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    birthday: profile?.birthday || '',
    driver_license: profile?.driver_license || '',
    national_id: profile?.national_id || '',
  })

  const [images, setImages] = useState<Record<string, File | null>>({
    license_front: null,
    license_back: null,
    national_id_front: null,
    national_id_back: null,
    selfie_with_id: null,
    selfie: null,
  })

  if (profile?.verified_status === 'verified') {
    return (
      <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">You're Verified!</h2>
        <p className="text-muted-foreground mb-6">Your identity has been verified. You have full access to SafeDrive.</p>
        <Button onClick={() => navigate('/browse')}>Browse Cars</Button>
      </div>
    )
  }

  if (profile?.verified_status === 'pending') {
    return (
      <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-10 h-10 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Verification Pending</h2>
        <p className="text-muted-foreground mb-6">Your verification is being reviewed by our team. We'll notify you once it's approved.</p>
        <Button variant="outline" onClick={() => navigate('/browse')}>Go to Browse</Button>
      </div>
    )
  }

  const handleImageChange = (key: string, file: File | null) => {
    if (file) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Only JPG and PNG files are allowed')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be under 5MB')
        return
      }
    }
    setImages((prev) => ({ ...prev, [key]: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validate all images are uploaded
    const missingImages = imageFields.filter((f) => !images[f.key])
    if (missingImages.length > 0) {
      toast.error('Please upload all required images', {
        description: `Missing: ${missingImages.map((f) => f.label).join(', ')}`,
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Upload images
      for (const field of imageFields) {
        const file = images[field.key]!
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${field.key}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('user-verification')
          .upload(path, file, { upsert: true })

        if (uploadError) throw uploadError

        await supabase.from('verification_images').insert({
          user_id: user.id,
          image_type: field.key,
          storage_path: path,
        })
      }

      // Update profile
      const fullName = [formData.first_name, formData.middle_name, formData.last_name]
        .filter(Boolean)
        .join(' ')

      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          full_name: fullName,
          verified_status: 'pending',
        })
        .eq('id', user.id)

      if (error) throw error

      // Audit log
      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'verification_submitted',
        entity_type: 'profile',
        entity_id: user.id,
      })

      await refreshProfile()
      toast.success('Verification submitted!', { description: 'Our team will review your submission.' })
    } catch (err: unknown) {
      const error = err as Error
      toast.error('Submission failed', { description: error.message })
    }

    setIsSubmitting(false)
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary" />
          Identity Verification
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete verification to start booking or listing cars.
        </p>
      </div>

      {profile?.verified_status === 'rejected' && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">
            Your previous verification was rejected.
          </p>
          {profile.rejection_reason && (
            <p className="text-sm text-red-600 dark:text-red-400/80 mt-1">
              Reason: {profile.rejection_reason}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Provide your legal name and contact information.</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input id="first_name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input id="middle_name" value={formData.middle_name} onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input id="last_name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Contact Number *</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday *</Label>
              <Input id="birthday" type="date" value={formData.birthday} onChange={(e) => setFormData({ ...formData, birthday: e.target.value })} required />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ID Numbers</CardTitle>
            <CardDescription>Your driver's license and national ID.</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="driver_license">Driver's License Number *</Label>
              <Input id="driver_license" value={formData.driver_license} onChange={(e) => setFormData({ ...formData, driver_license: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="national_id">National ID Number *</Label>
              <Input id="national_id" value={formData.national_id} onChange={(e) => setFormData({ ...formData, national_id: e.target.value })} required />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification Images</CardTitle>
            <CardDescription>Upload clear photos (JPG/PNG, max 5MB each).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {imageFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label} *</Label>
                  <label className={`flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${images[field.key]
                    ? 'border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}>
                    {images[field.key] ? (
                      <div className="text-center">
                        <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {images[field.key]!.name}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Click to upload</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={(e) => handleImageChange(field.key, e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/20" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
          ) : (
            <><Upload className="w-4 h-4 mr-2" /> Submit for Verification</>
          )}
        </Button>
      </form>
    </div>
  )
}
