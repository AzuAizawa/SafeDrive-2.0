import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Car, Shield, CreditCard, Users, ChevronRight, Star, Zap, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        
        {/* Nav */}
        <header className="relative z-10 max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                <Car className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">SafeDrive</span>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <Button onClick={() => navigate('/browse')} className="gap-2">
                  Go to Dashboard
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')}>
                    Log In
                  </Button>
                  <Button onClick={() => navigate('/signup')} className="gap-2 shadow-lg shadow-primary/25">
                    Get Started
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Zap className="w-3.5 h-3.5" />
              Peer-to-Peer Car Rental Platform
            </div>
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              Rent Cars from
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                {' '}Real People
              </span>
            </h1>
            <p
              className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl mb-10 animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              Connect with car owners in your area. Browse, book, and drive — all secured with verified profiles and transparent pricing.
            </p>
            <div
              className="flex flex-wrap gap-4 animate-fade-in"
              style={{ animationDelay: '0.3s' }}
            >
              <Button
                size="lg"
                onClick={() => navigate(user ? '/browse' : '/signup')}
                className="text-base px-8 h-12 shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-shadow"
              >
                {user ? 'Browse Cars' : 'Start Renting'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate(user ? '/my-vehicles' : '/signup')}
                className="text-base px-8 h-12"
              >
                List Your Car
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="relative py-24 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Why SafeDrive?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A secure, transparent, and easy-to-use platform for peer-to-peer car rentals.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'Verified Users',
                desc: 'Every renter and lister goes through identity verification for your safety.',
                gradient: 'from-blue-500/10 to-blue-600/5',
                iconColor: 'text-blue-500',
              },
              {
                icon: CreditCard,
                title: 'Secure Payments',
                desc: 'All transactions processed securely. Downpayments held until rental completion.',
                gradient: 'from-green-500/10 to-green-600/5',
                iconColor: 'text-green-500',
              },
              {
                icon: Users,
                title: 'Peer-to-Peer',
                desc: 'Rent directly from car owners in your area at competitive daily rates.',
                gradient: 'from-purple-500/10 to-purple-600/5',
                iconColor: 'text-purple-500',
              },
              {
                icon: Star,
                title: 'Quality Cars',
                desc: 'Every vehicle is reviewed and approved before being listed on the platform.',
                gradient: 'from-amber-500/10 to-amber-600/5',
                iconColor: 'text-amber-500',
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="group relative p-6 rounded-2xl border border-border/50 hover:border-border hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${0.1 * i}s` }}
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative">
                  <div className={`w-11 h-11 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-muted/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get on the road in just a few simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Sign Up & Verify', desc: 'Create your account and complete identity verification with your ID and license.'},
              { step: '02', title: 'Browse & Book', desc: 'Find the perfect car, select your dates, and send a booking request to the owner.'},
              { step: '03', title: 'Pay & Drive', desc: 'Pay the 50% downpayment, pick up the car, and enjoy your trip!'},
            ].map((item, i) => (
              <div
                key={item.step}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${0.15 * i}s` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <span className="text-2xl font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border/50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join SafeDrive today and experience a smarter way to rent or list cars.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate(user ? '/browse' : '/signup')}
              className="text-base px-10 h-12 shadow-xl shadow-primary/20"
            >
              {user ? 'Browse Cars' : 'Create Account'}
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-muted-foreground">
            {['Free to sign up', 'No hidden fees', 'Verified community'].map((text) => (
              <span key={text} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">SafeDrive</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                The leading peer-to-peer car rental marketplace. Connect with car owners in your area and get on the road in minutes.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-sm uppercase tracking-widest mb-6">Renting</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link to="/browse" className="hover:text-primary transition-colors">Browse Cars</Link></li>
                <li><Link to="/signup" className="hover:text-primary transition-colors">How to Book</Link></li>
                <li><Link to="/signup" className="hover:text-primary transition-colors">Safety for Renters</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm uppercase tracking-widest mb-6">Listing</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link to="/signup" className="hover:text-primary transition-colors">List Your Car</Link></li>
                <li><Link to="/signup" className="hover:text-primary transition-colors">Insurance</Link></li>
                <li><Link to="/signup" className="hover:text-primary transition-colors">Lister Tips</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm uppercase tracking-widest mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="/" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © 2026 SafeDrive 2.0. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors"><Shield className="w-4 h-4" /></Link>
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors"><Users className="w-4 h-4" /></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
