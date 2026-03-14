import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ShieldCheck, Search, CheckCircle, XCircle, X, Eye, Loader2 } from 'lucide-react'
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
        <Select value={filter} onValueChange={setFilter}>
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
                  <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedUser(u); setShowRejectInput(false); setRejectionReason('') }}>
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
                  <h3 className="font-semibold mb-3">Uploaded Documents</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedUser.verification_images.map((img) => (
                      <div key={img.id} className="space-y-1">
                        <p className="text-xs text-muted-foreground capitalize">{img.image_type.replace(/_/g, ' ')}</p>
                        <a href={getImageUrl(img.storage_path)} target="_blank" rel="noopener noreferrer">
                          <img
                            src={getImageUrl(img.storage_path)}
                            alt={img.image_type}
                            className="w-full h-32 object-cover rounded-lg border border-border hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                          />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  <Button onClick={handleApprove} disabled={actionLoading} className="gap-2">
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve
                  </Button>
                  {!showRejectInput ? (
                    <Button variant="destructive" onClick={() => setShowRejectInput(true)} className="gap-2">
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
    </div>
  )
}
