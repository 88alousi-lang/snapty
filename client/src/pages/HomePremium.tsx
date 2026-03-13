import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Plane,
  Video,
  LayoutGrid,
  ArrowRight,
  Star,
  MapPin,
  Clock,
  Shield,
  Zap,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { PublicLayout } from "@/components/layouts/PublicLayout";

export default function HomePremium() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleBooking = () => {
    if (isAuthenticated) {
      navigate("/complete-booking-flow");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  const handleViewMap = () => {
    if (isAuthenticated) {
      navigate("/photographers-map");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  const handlePhotographerSignup = () => {
    if (isAuthenticated) {
      navigate("/photographer-onboarding");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  const services = [
    {
      id: 1,
      title: "Real Estate Photography",
      description: "Professional property photos that sell",
      icon: Camera,
      color: "from-blue-500 to-blue-600",
      price: "$150+",
    },
    {
      id: 2,
      title: "Drone Photography",
      description: "Aerial views of your property",
      icon: Plane,
      color: "from-cyan-500 to-blue-500",
      price: "$80+",
    },
    {
      id: 3,
      title: "Video Walkthrough",
      description: "Immersive property video tours",
      icon: Video,
      color: "from-purple-500 to-pink-500",
      price: "$150+",
    },
    {
      id: 4,
      title: "Floor Plans",
      description: "Detailed 2D floor plan layouts",
      icon: LayoutGrid,
      color: "from-orange-500 to-red-500",
      price: "$90+",
    },
  ];

  const features = [
    {
      icon: Zap,
      title: "Book in Minutes",
      description: "Find and book photographers instantly",
    },
    {
      icon: Shield,
      title: "Verified Professionals",
      description: "All photographers are vetted and rated",
    },
    {
      icon: Clock,
      title: "Same-Day Service",
      description: "Get photos delivered fast",
    },
    {
      icon: MapPin,
      title: "Local Photographers",
      description: "Find experts in your area",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Real Estate Agent",
      image: "👩‍💼",
      text: "Snapty made it so easy to get professional photos. My listings sell faster now.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Photographer",
      image: "👨‍💼",
      text: "Great platform to find clients. The booking system is seamless.",
      rating: 5,
    },
    {
      name: "Emma Davis",
      role: "Property Manager",
      image: "👩‍💼",
      text: "Best investment for our property marketing. Highly recommended!",
      rating: 5,
    },
  ];

  return (
    <PublicLayout>
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Snapty</span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">{user?.name}</span>
                <Button onClick={() => navigate("/dashboard")} variant="outline" className="border-gray-200">
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => (window.location.href = getLoginUrl())}
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20 md:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 w-fit">
                  ✨ Professional Photography On Demand
                </Badge>
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                  Stunning Property Photos in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">Hours</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Connect with vetted photographers in your area. Book a shoot in minutes, get professional photos delivered fast.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleBooking}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Book a Photographer
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  onClick={handleViewMap}
                  variant="outline"
                  className="border-2 border-gray-300 hover:border-blue-600 px-8 py-6 text-lg rounded-xl font-semibold"
                >
                  View on Map
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <p className="text-3xl font-bold text-gray-900">1000+</p>
                  <p className="text-gray-600">Photographers</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">5000+</p>
                  <p className="text-gray-600">Bookings</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">4.9★</p>
                  <p className="text-gray-600">Average Rating</p>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative h-96 md:h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl opacity-10"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-24 h-24 text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Professional Photography</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to showcase your property professionally
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map(service => {
              const Icon = service.icon;
              return (
                <Card key={service.id} className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    <p className="text-2xl font-bold text-blue-600">{service.price}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Why Choose Snapty?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The easiest way to get professional property photography
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Loved by Professionals</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what our users have to say about Snapty
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border-0 shadow-sm hover:shadow-lg transition-all">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl">{testimonial.image}</div>
                    <div>
                      <p className="font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of real estate professionals using Snapty to showcase properties beautifully.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleBooking}
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg rounded-xl font-semibold"
            >
              Book a Photographer
            </Button>
            <Button
              onClick={handlePhotographerSignup}
              variant="outline"
              className="border-2 border-white text-white hover:bg-blue-700 px-8 py-6 text-lg rounded-xl font-semibold"
            >
              Become a Photographer
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white">Snapty</span>
              </div>
              <p className="text-sm">Professional photography on demand.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Snapty. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
    </PublicLayout>
  );
}
