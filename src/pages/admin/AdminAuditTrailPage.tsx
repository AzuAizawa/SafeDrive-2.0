import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, ClipboardList } from 'lucide-react'
import { format } from 'date-fns'

interface AuditEntry {
  id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  profiles: { full_name: string | null; email: string } | null
}

const actionLabels: Record<string, string> = {
  verification_submitted: 'Submitted verification',
  admin_approved_verification: 'Approved user verification',
  admin_rejected_verification: 'Rejected user verification',
  vehicle_submitted: 'Submitted vehicle for approval',
  admin_approved_vehicle: 'Approved vehicle listing',
  admin_rejected_vehicle: 'Rejected vehicle listing',
  booking_created: 'Created booking request',
  payout_sent: 'Sent owner payout',
  admin_added_car_brand: 'Added car brand',
  admin_added_car_model: 'Added car model',
}

export default function AdminAuditTrailPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  useEffect(() => { fetchEntries() }, [])

  const fetchEntries = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('audit_log')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (data) setEntries(data as unknown as AuditEntry[])
    setLoading(false)
  }

  const uniqueActions = [...new Set(entries.map((e) => e.action))]

  const filtered = entries.filter((e) => {
    const matchesAction = actionFilter === 'all' || e.action === actionFilter
    const matchesSearch = search === '' ||
      (e.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.profiles?.email || '').toLowerCase().includes(search.toLowerCase()) ||
      e.action.toLowerCase().includes(search.toLowerCase())
    return matchesAction && matchesSearch
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
        <p className="text-muted-foreground mt-1">Track all system activity</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by user or action..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Select value={actionFilter} onValueChange={(v) => v && setActionFilter(v)}>
          <SelectTrigger className="w-full sm:w-56 h-10"><SelectValue placeholder="Filter by action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map((a) => (
              <SelectItem key={a} value={a}>{actionLabels[a] || a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No audit entries</h3>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs whitespace-nowrap">{format(new Date(e.created_at), 'MMM d, yyyy h:mm a')}</TableCell>
                  <TableCell className="text-sm">{e.profiles?.full_name || e.profiles?.email || '—'}</TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{actionLabels[e.action] || e.action}</span>
                    {e.entity_type && <span className="text-xs text-muted-foreground ml-1">({e.entity_type})</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {e.details ? JSON.stringify(e.details) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
