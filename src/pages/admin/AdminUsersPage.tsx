import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ShieldCheck, Search, CheckCircle, XCircle, X, Eye, Loader2, Maximize2, Zap, AlertCircle, ZoomIn } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { Profile, VerificationImage } from '@/types/database'

interface UserWithImages extends Profile {
  verification_images: VerificationImage[]
}

export default function AdminUsersPage() {
  const { user: adminUser } = useAuth()
  const [users, setUsers] = useState<UserWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserWithImages | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState<{ url: string; type: string } | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [checklist, setChecklist] = useState({
    nameMatch: false,
    idMatch: false,
    faceMatch: false,
    validExpiry: false,
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*, verification_images(*)')
      .eq('role', 'user')
      .order('created_at', { ascending: false })

    if (data) setUsers(data as unknown as UserWithImages[])
    setLoading(false)
  }

  const filteredUsers = users.filter((u) => {
    const matchesFilter = filter === 'all' || u.verified_status === filter
    const matchesSearch =
      search === '' ||
      (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from('user-verification').getPublicUrl(path)
    return data.publicUrl
  }

  const handleApprove = async () => {
    if (!selectedUser || !adminUser) return
    setActionLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({ verified_status: 'verified', rejection_reason: null })
      .eq('id', selectedUser.id)

    if (!error) {
      // Notification
      await supabase.from('notifications').insert({
        user_id: selectedUser.id,
        title: 'Verification Approved!',
        message: 'Your identity has been verified. You now have full access to SafeDrive.',
        type: 'success',
        link: '/browse',
      })
      // Audit
      await supabase.from('audit_log').insert({
        user_id: adminUser.id,
        action: 'admin_approved_verification',
        entity_type: 'profile',
        entity_id: selectedUser.id,
        details: { admin_email: adminUser.email },
      })
      toast.success(`${selectedUser.full_name || selectedUser.email} approved!`)
      setSelectedUser(null)
      fetchUsers()
    } else {
      toast.error('Failed to approve')
    }
    setActionLoading(false)
  }

  const handleReject = async () => {
    if (!selectedUser || !adminUser || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    setActionLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({ verified_status: 'rejected', rejection_reason: rejectionReason })
      .eq('id', selectedUser.id)

    if (!error) {
      await supabase.from('notifications').insert({
        user_id: selectedUser.id,
        title: 'Verification Rejected',
        message: `Your verification was rejected. Reason: ${rejectionReason}`,
        type: 'error',
        link: '/verify',
      })
      await supabase.from('audit_log').insert({
        user_id: adminUser.id,
        action: 'admin_rejected_verification',
        entity_type: 'profile',
        entity_id: selectedUser.id,
        details: { reason: rejectionReason },
      })
      toast.success('User verification rejected')
      setSelectedUser(null)
      setRejectionReason('')
      setShowRejectInput(false)
      fetchUsers()
    }
    setActionLoading(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-1">Review and manage user verifications</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Select value={filter} onValueChange={(val) => setFilter(val || 'all')}>
          <SelectTrigger className="w-full sm:w-48 h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { 
                    setSelectedUser(u); 
                    setShowRejectInput(false); 
                    setRejectionReason('');
                    setChecklist({ nameMatch: false, idMatch: false, faceMatch: false, validExpiry: false });
                  }}>
                    <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.verified_status === 'verified' ? 'text-green-600 bg-green-50 dark:bg-green-950/30' :
                        u.verified_status === 'pending' ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' :
                        u.verified_status === 'rejected' ? 'text-red-600 bg-red-50 dark:bg-red-950/30' :
                        'text-muted-foreground bg-muted'
                      }`}>
                        <ShieldCheck className="w-3 h-3" />
                        {u.verified_status.charAt(0).toUpperCase() + u.verified_status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{format(new Date(u.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedUser(u) }}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold">User Verification</h2>
              <Button size="icon" variant="ghost" onClick={() => setSelectedUser(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 space-y-5">
              {/* Personal Info */}
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Full Name:</span><p className="font-medium">{selectedUser.full_name || '—'}</p></div>
                <div><span className="text-muted-foreground">Email:</span><p className="font-medium">{selectedUser.email}</p></div>
                <div><span className="text-muted-foreground">Phone:</span><p className="font-medium">{selectedUser.phone || '—'}</p></div>
                <div><span className="text-muted-foreground">Birthday:</span><p className="font-medium">{selectedUser.birthday ? format(new Date(selectedUser.birthday), 'MMM d, yyyy') : '—'}</p></div>
                <div className="sm:col-span-2"><span className="text-muted-foreground">Address:</span><p className="font-medium">{selectedUser.address || '—'}</p></div>
                <div><span className="text-muted-foreground">Driver's License:</span><p className="font-medium">{selectedUser.driver_license || '—'}</p></div>
                <div><span className="text-muted-foreground">National ID:</span><p className="font-medium">{selectedUser.national_id || '—'}</p></div>
              </div>

              {/* Verification Images */}
              {selectedUser.verification_images.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center justify-between">
                    Uploaded Documents
                    <span className="text-xs font-normal text-muted-foreground items-center flex gap-1">
                      <ZoomIn className="w-3 h-3" /> Click image for Deep Zoom
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedUser.verification_images.map((img) => (
                      <div key={img.id} className="group relative space-y-1">
                        <p className="text-xs text-muted-foreground capitalize">{img.image_type.replace(/_/g, ' ')}</p>
                        <div 
                          className="relative aspect-video overflow-hidden rounded-lg border border-border group-hover:ring-2 group-hover:ring-primary transition-all cursor-zoom-in"
                          onClick={() => {
                            setPreviewImage({ url: getImageUrl(img.storage_path), type: img.image_type })
                            setZoomLevel(1)
                          }}
                        >
                          <img
                            src={getImageUrl(img.storage_path)}
                            alt={img.image_type}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Maximize2 className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consistency Flagging Assistant */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Automated Consistency Flags
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-primary/60 tracking-wider">Experimental OCR Info</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5 p-2 rounded bg-background/50 border border-border/50">
                    <p className="text-muted-foreground">Form Full Name</p>
                    <p className="font-mono text-sm font-semibold">{selectedUser.full_name || 'N/A'}</p>
                  </div>
                  <div className="space-y-1.5 p-2 rounded bg-background/50 border border-border/50">
                    <p className="text-muted-foreground">ID Numbers Provided</p>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono">DL: {selectedUser.driver_license || 'None'}</span>
                      <span className="font-mono">NID: {selectedUser.national_id || 'None'}</span>
                    </div>
                  </div>
                </div>

                {/* Mandatory Review Checklist */}
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Manual Review Checklist</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'nameMatch', label: 'Name matches IDs' },
                      { id: 'idMatch', label: 'ID numbers match' },
                      { id: 'faceMatch', label: 'Faces match selfie' },
                      { id: 'validExpiry', label: 'Docs are valid' }
                    ].map((item) => (
                      <label key={item.id} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={(checklist as any)[item.id]}
                          onChange={(e) => setChecklist(prev => ({ ...prev, [item.id]: e.target.checked }))}
                        />
                        <span className="text-xs font-medium">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rejection reason input */}
              {showRejectInput && (
                <div className="space-y-2">
                  <Label>Rejection Reason *</Label>
                  <Input
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why the verification is rejected..."
                  />
                </div>
              )}

              {/* Actions */}
              {selectedUser.verified_status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={handleApprove} 
                    disabled={actionLoading || !Object.values(checklist).every(Boolean)} 
                    className="gap-2 flex-1 shadow-lg shadow-primary/20"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve Identity
                  </Button>
                  {!showRejectInput ? (
                    <Button variant="outline" onClick={() => setShowRejectInput(true)} className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10">
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  ) : (
                    <Button variant="destructive" onClick={handleReject} disabled={actionLoading || !rejectionReason.trim()} className="gap-2">
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Confirm Reject
                    </Button>
                  )}
                </div>
              )}

              {!Object.values(checklist).every(Boolean) && selectedUser.verified_status === 'pending' && (
                <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5" />
                  Complete all checklist items to enable approval
                </p>
              )}

              {selectedUser.verified_status === 'rejected' && selectedUser.rejection_reason && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    <strong>Rejected:</strong> {selectedUser.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Deep Zoom Lightbox Overlay */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1.5 backdrop-blur-md border border-white/10 mr-4">
              <Button size="icon" variant="ghost" onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))} className="w-8 h-8 text-white hover:bg-white/20">
                <Search className="w-4 h-4" />
              </Button>
              <span className="text-xs font-mono text-white w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
              <Button size="icon" variant="ghost" onClick={() => setZoomLevel(Math.min(4, zoomLevel + 0.5))} className="w-8 h-8 text-white hover:bg-white/20">
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              className="bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10"
              onClick={() => { setPreviewImage(null); setZoomLevel(1) }}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="w-full h-full flex items-center justify-center overflow-auto p-12 custom-scrollbar">
            <div 
              className="transition-transform duration-200 ease-out cursor-grab active:cursor-grabbing"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img 
                src={previewImage.url} 
                alt="Deep Zoom Preview" 
                className="max-w-[70vw] max-h-[80vh] shadow-2xl rounded-sm ring-1 ring-white/20"
              />
            </div>
          </div>
          
          <div className="absolute bottom-8 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex flex-col items-center">
            <p className="text-white font-semibold text-sm capitalize">{previewImage.type.replace(/_/g, ' ')}</p>
            <p className="text-white/60 text-[10px]">Use mouse wheel or buttons to zoom • Drag to pan</p>
          </div>
        </div>
      )}
    </div>
  )
}
