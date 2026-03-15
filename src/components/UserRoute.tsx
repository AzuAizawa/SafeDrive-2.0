import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'

export default function UserRoute() {
    const { profile, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Skeleton className="h-12 w-48" />
            </div>
        )
    }

    // Allow access only if user is NOT an admin (role !== 'admin')
    if (!profile || profile.role === 'admin') {
        return <Navigate to="/admin/login" replace />
    }

    return <Outlet />
}