import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, MapPin, Fuel, Users, Calendar, CarFront } from 'lucide-react'
import type { CarWithDetails } from '@/types/database'

const bodyTypes = ['all', 'sedan', 'suv', 'hatchback', 'van', 'pickup', 'coupe', 'convertible', 'wagon', 'mpv']

export default function BrowseCarsPage() {
  const [cars, setCars] = useState<CarWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [bodyTypeFilter, setBodyTypeFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    fetchCars()
  }, [])

  const fetchCars = async () => {
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
      .in('status', ['approved', 'active'])

    if (!error && data) {
      setCars(data as unknown as CarWithDetails[])
    }
    setLoading(false)
  }

  const filteredCars = cars.filter((car) => {
    const matchesSearch =
      searchQuery === '' ||
      car.car_models.car_brands.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.car_models.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (car.location ?? '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesBodyType = bodyTypeFilter === 'all' || car.car_models.body_type === bodyTypeFilter

    return matchesSearch && matchesBodyType
  })

  const getCarImageUrl = (car: CarWithDetails) => {
    const primary = car.car_images?.find((img) => img.is_primary)
    const path = primary?.storage_path || car.car_images?.[0]?.storage_path
    if (path) {
      const { data } = supabase.storage.from('vehicle-documents').getPublicUrl(path)
      return data.publicUrl
    }
    return null
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Browse Cars</h1>
        <p className="text-muted-foreground mt-1">Find the perfect car for your next trip</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by brand, model or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Select value={bodyTypeFilter} onValueChange={(val) => setBodyTypeFilter(val || 'all')}>
          <SelectTrigger className="w-full sm:w-44 h-10">
            <SelectValue placeholder="Body Type" />
          </SelectTrigger>
          <SelectContent>
            {bodyTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {loading ? 'Loading...' : `${filteredCars.length} car${filteredCars.length !== 1 ? 's' : ''} found`}
      </p>

      {/* Car Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full rounded-none" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCars.length === 0 ? (
        <div className="text-center py-20">
          <CarFront className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-1">No cars found</h3>
          <p className="text-muted-foreground text-sm">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCars.map((car, i) => {
            const imageUrl = getCarImageUrl(car)
            return (
              <Card
                key={car.id}
                className="group overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:border-primary/20 animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => navigate(`/cars/${car.id}`)}
              >
                {/* Image */}
                <div className="relative h-48 bg-muted overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`${car.car_models.car_brands.name} ${car.car_models.name}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CarFront className="w-16 h-16 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm text-xs font-semibold shadow-sm">
                    ₱{Number(car.price_per_day).toLocaleString()}/day
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                    {car.car_models.car_brands.name} {car.car_models.name}
                  </h3>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CarFront className="w-3.5 h-3.5" />
                      {car.car_models.body_type.charAt(0).toUpperCase() + car.car_models.body_type.slice(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {car.car_models.seats} seats
                    </span>
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5" />
                      {car.car_models.fuel_type.charAt(0).toUpperCase() + car.car_models.fuel_type.slice(1)}
                    </span>
                    {car.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {car.location}
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      View & Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
