import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, TrendingUp, Users, DollarSign, Calendar, Shield, Zap } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { PublicLayout } from "@/components/layouts/PublicLayout";

export default function PhotographerLandingPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const benefits = [
    {
      icon: TrendingUp,
      title: "Grow Your Business",
      description: "Access a steady stream of real estate photography bookings"
    },
    {
      icon: DollarSign,
      title: "Competitive Earnings",
      description: "Keep 80% of each booking fee, no hidden charges"
    },
    {
      icon: Users,
      title: "Build Your Reputation",
      description: "Earn ratings and reviews to attract more clients"
    },
    {
      icon: Calendar,
      title: "Flexible Schedule",
      description: "Accept or decline bookings based on your availability"
    },
    {
      icon: Shield,
      title: "Professional Support",
      description: "Dedicated support team to help you succeed"
    },
    {
      icon: Zap,
      title: "Easy Payments",
      description: "Get paid weekly directly to your bank account"
    }
  ];

  const handleGetStarted = () => {
    if (user) {
      navigate("/photographer/signup");
    } else {
      navigate("/photographer/login");
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
                <Button variant="outline" onClick={() => navigate("/photographer")}>
                  Dashboard
                </Button>
                <Button onClick={() => navigate("/for-clients")}>
                  For Clients
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate("/login")}>
                  Sign In
                </Button>
                <Button onClick={() => navigate("/for-clients")}>
                  For Clients
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
              Grow Your Photography Business
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of photographers earning money on Snapty. Get consistent bookings, build your reputation, and grow your income.
            </p>
            <div className="flex gap-4">
              <Button size="lg" onClick={handleGetStarted}>
                Apply Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg h-96 flex items-center justify-center">
            <TrendingUp className="w-32 h-32 text-white opacity-50" />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Why Join Snapty?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                  <Icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Apply", desc: "Fill out your profile and upload your portfolio" },
              { step: 2, title: "Get Approved", desc: "We review your application and verify your credentials" },
              { step: 3, title: "Start Booking", desc: "Receive booking requests from clients in your area" },
              { step: 4, title: "Earn Money", desc: "Complete shoots and get paid weekly" }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Section */}
      <section className="bg-blue-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Competitive Earnings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Base Photography", price: "$150", desc: "1000-1999 sqft" },
              { title: "Medium Properties", price: "$220", desc: "2000-2999 sqft" },
              { title: "Large Properties", price: "$300+", desc: "3000+ sqft" }
            ].map((earning, idx) => (
              <Card key={idx} className="p-6 text-center">
                <p className="text-sm text-gray-600 mb-2">{earning.desc}</p>
                <p className="text-4xl font-bold text-primary mb-2">{earning.price}</p>
                <p className="text-gray-700">{earning.title}</p>
                <p className="text-sm text-gray-500 mt-4">Plus add-ons: Drone +$80, Video +$150, Floor Plans +$90</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Requirements
          </h2>
          <Card className="p-8">
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">✓</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Professional Equipment</h4>
                  <p className="text-gray-600">High-quality camera and editing software</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">✓</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Liability Insurance</h4>
                  <p className="text-gray-600">Minimum $1M coverage for property damage</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">✓</div>
                <div>
                  <h4 className="font-semibold text-gray-900">FAA Certification (Optional)</h4>
                  <p className="text-gray-600">Part 107 license required for drone services</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">✓</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Portfolio</h4>
                  <p className="text-gray-600">At least 5 high-quality real estate photos</p>
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join Snapty today and start earning from real estate photography bookings.
          </p>
          <Button size="lg" variant="secondary" onClick={handleGetStarted}>
            Apply Now <ArrowRight className="ml-2 w-5 h-5" />
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
              <h4 className="font-semibold mb-4">For Photographers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">How it works</a></li>
                <li><a href="#" className="hover:text-white">Earnings</a></li>
                <li><a href="#" className="hover:text-white">Requirements</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Clients</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Browse</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
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
