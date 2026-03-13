import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, MapPin, Star, Clock, Shield, Camera, Zap } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { PublicLayout } from "@/components/layouts/PublicLayout";

export default function ClientLanding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const features = [
    {
      icon: MapPin,
      title: "Find Local Photographers",
      description: "Browse and compare professional real estate photographers in your area"
    },
    {
      icon: Star,
      title: "Read Reviews",
      description: "Check ratings and reviews from other clients to find the best fit"
    },
    {
      icon: Clock,
      title: "Book Instantly",
      description: "Schedule your shoot at a time that works for you"
    },
    {
      icon: Zap,
      title: "Quick Turnaround",
      description: "Get professional photos and videos within days"
    },
    {
      icon: Shield,
      title: "Verified Professionals",
      description: "All photographers are vetted and insured"
    },
    {
      icon: Camera,
      title: "Multiple Services",
      description: "Choose from photography, drone, video, and floor plans"
    }
  ];

  const handleGetStarted = () => {
    if (user) {
      navigate("/client/home");
    } else {
      navigate("/client/signup");
    }
  };

  return (
    <PublicLayout>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">Snapty</div>
          <div className="flex gap-4">
            {user ? (
              <>
                <Button variant="outline" onClick={() => navigate("/client/home")}>
                  Dashboard
                </Button>
                <Button onClick={() => navigate("/for-photographers")}>
                  For Photographers
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate("/login")}>
                  Sign In
                </Button>
                <Button onClick={() => navigate("/for-photographers")}>
                  For Photographers
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Professional Real Estate Photography Made Easy
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Connect with vetted photographers in your area. Book instantly. Get stunning photos and videos for your listings.
            </p>
            <div className="flex gap-4">
              <Button size="lg" onClick={handleGetStarted}>
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg h-96 flex items-center justify-center">
            <Camera className="w-32 h-32 text-white opacity-50" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose Snapty?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                  <Icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Our Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "Real Estate Photography", price: "$150+", desc: "Professional photos" },
              { name: "Drone Photography", price: "+$80", desc: "Aerial views" },
              { name: "Video Walkthrough", price: "+$150", desc: "Property tours" },
              { name: "Floor Plans", price: "+$90", desc: "2D floor plans" }
            ].map((service, idx) => (
              <Card key={idx} className="p-6 text-center hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {service.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{service.desc}</p>
                <p className="text-2xl font-bold text-primary">{service.price}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Book a professional photographer today and showcase your property beautifully.
          </p>
          <Button size="lg" variant="secondary" onClick={handleGetStarted}>
            Start Booking Now <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Snapty</h4>
              <p className="text-gray-400">Professional real estate photography marketplace</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Clients</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">How it works</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Photographers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Join us</a></li>
                <li><a href="#" className="hover:text-white">Earnings</a></li>
                <li><a href="#" className="hover:text-white">Guidelines</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Snapty. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
    </PublicLayout>
  );
}
