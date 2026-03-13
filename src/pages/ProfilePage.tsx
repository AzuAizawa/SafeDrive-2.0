import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, ShieldCheck, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    middle_name: profile?.middle_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
  })

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)

    const fullName = [formData.first_name, formData.middle_name, formData.last_name]
      .filter(Boolean)
      .join(' ')

    const { error } = await supabase
      .from('profiles')
      .update({ ...formData, full_name: fullName })
      .eq('id', profile.id)

    if (error) {
      toast.error('Failed to update profile')
    } else {
      await refreshProfile()
      toast.success('Profile updated!')
    }
    setSaving(false)
  }

  const verificationColor =
    profile?.verified_status === 'verified'
      ? 'text-green-600 dark:text-green-400'
      : profile?.verified_status === 'pending'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-muted-foreground'

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <User className="w-8 h-8 text-primary" />
          Profile
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account information</p>
      </div>

      {/* Status Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/10">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Account Status</p>
            <div className={`flex items-center gap-1.5 font-semibold mt-0.5 ${verificationColor}`}>
              <ShieldCheck className="w-4 h-4" />
              {profile?.verified_status === 'verified'
                ? 'Verified'
                : profile?.verified_status === 'pending'
                  ? 'Pending Verification'
                  : profile?.verified_status === 'rejected'
                    ? 'Verification Rejected'
                    : 'Not Verified'}
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Email</p>
            <p className="font-medium text-foreground">{profile?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your name and contact details.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Middle Name</Label>
            <Input
              value={formData.middle_name}
              onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Address</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lister Mode Info */}
      {profile?.is_lister && (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              You're currently in <span className="font-semibold text-foreground">Lister Mode</span>.
              You can list vehicles and manage incoming booking requests.
              Switch back to Renter mode from the profile dropdown.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
