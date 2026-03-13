import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Camera, Plane, Video, MapPin, Star, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { PublicLayout } from "@/components/layouts/PublicLayout";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleStartBooking = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
    } else {
      navigate("/booking");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Snapty</span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">{user?.name}</span>
                {user?.role === "photographer" ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/photographer-dashboard")}
                    >
                      My Dashboard
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/dashboard")}
                    >
                      My Bookings
                    </Button>
                  </>
                )}
                <Button variant="ghost" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => (window.location.href = getLoginUrl())}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Professional Real Estate Photography, On Demand
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Connect with vetted photographers in your area. Book a shoot in minutes, get stunning property photos in hours.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Button size="lg" onClick={handleStartBooking} className="bg-blue-600 hover:bg-blue-700">
                Book a Photographer
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => {
                  if (!isAuthenticated) {
                    window.location.href = getLoginUrl();
                  } else {
                    navigate("/photographer-onboarding");
                  }
                }}
              >
                Become a Photographer
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <Camera className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Photography</h3>
              <p className="text-sm text-gray-600">Professional property photos</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <Plane className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Drone Shots</h3>
              <p className="text-sm text-gray-600">Aerial views & perspectives</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <Video className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Video</h3>
              <p className="text-sm text-gray-600">4K video walkthroughs</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <MapPin className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Floor Plans</h3>
              <p className="text-sm text-gray-600">2D floor plan layouts</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: "Enter Location",
                description: "Tell us where your property is",
              },
              {
                step: 2,
                title: "Choose Services",
                description: "Select the services you need",
              },
              {
                step: 3,
                title: "Pick Photographer",
                description: "Browse and select your photographer",
              },
              {
                step: 4,
                title: "Book & Pay",
                description: "Schedule and complete payment",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Why Choose Snapty</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Star,
                title: "Vetted Photographers",
                description: "All photographers are verified and rated by clients",
              },
              {
                icon: Clock,
                title: "Fast Turnaround",
                description: "Get your photos within 24 hours of the shoot",
              },
              {
                icon: MapPin,
                title: "Local Availability",
                description: "Find photographers available in your area",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx}>
                  <CardHeader>
                    <Icon className="w-8 h-8 text-blue-600 mb-2" />
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90">
            Book a professional photographer for your property today
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={handleStartBooking}
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            Book Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">About</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Clients</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">How It Works</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Photographers</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Join Us</a></li>
                <li><a href="#" className="hover:text-white">Resources</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Snapty. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </PublicLayout>
  );
}
