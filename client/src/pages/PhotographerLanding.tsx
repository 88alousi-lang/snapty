import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, DollarSign, TrendingUp, Clock, Shield, Users } from "lucide-react";
import { useLocation } from "wouter";

export default function PhotographerLanding() {
  const [, setLocation] = useLocation();

  const benefits = [
    {
      icon: <DollarSign className="w-8 h-8 text-blue-600" />,
      title: "Flexible Earnings",
      description: "Set your own rates and earn up to 65% of every booking"
    },
    {
      icon: <Clock className="w-8 h-8 text-blue-600" />,
      title: "Be Your Own Boss",
      description: "Choose your own schedule and work on your terms"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
      title: "Grow Your Business",
      description: "Access a steady stream of real estate photography bookings"
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: "Professional Support",
      description: "Get support from our team and access to resources"
    },
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: "Community",
      description: "Join a network of professional photographers"
    },
    {
      icon: <CheckCircle2 className="w-8 h-8 text-blue-600" />,
      title: "Vetted Clients",
      description: "Work with verified property owners and real estate agents"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Apply",
      description: "Submit your application with basic information"
    },
    {
      number: "2",
      title: "Verify",
      description: "Complete identity verification and upload your portfolio"
    },
    {
      number: "3",
      title: "Get Approved",
      description: "Our team reviews your application and approves you"
    },
    {
      number: "4",
      title: "Start Earning",
      description: "Receive bookings and start earning immediately"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">📸</span>
            </div>
            <span className="font-bold text-lg text-gray-900">Snapty</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => setLocation("/")}>
              For Clients
            </Button>
            <Button variant="ghost" onClick={() => setLocation("/photographer/login")}>
              Login
            </Button>
            <Button onClick={() => setLocation("/photographer/apply")} className="bg-blue-600 hover:bg-blue-700">
              Apply Now
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Grow Your Photography Business
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Join Snapty and access a steady stream of real estate photography bookings. 
            Work on your own schedule and earn up to 65% of every booking.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => setLocation("/photographer/apply")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
            >
              Apply Now
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => setLocation("/photographer/login")}
              className="px-8 py-6 text-lg"
            >
              Already a Photographer? Login
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-20 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Join Snapty?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border border-gray-200 hover:border-blue-300 transition-colors">
                <CardHeader>
                  <div className="mb-4">{benefit.icon}</div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-center text-sm">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-blue-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Approval Process Section */}
      <section className="bg-blue-50 py-20 border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Simple Approval Process
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            We review all applications carefully to ensure quality. Most photographers are approved within 2-3 business days. 
            You'll need to provide identity verification and a portfolio of your work.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-base">Identity Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Upload a government-issued ID to verify your identity
                </p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-base">Portfolio Review</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Submit 5-10 real estate photos showcasing your work
                </p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-base">Agreement Acceptance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Accept our photographer agreement and platform policies
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Payout Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Transparent Payouts
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            You earn 65% of the booking price. We handle 35% as platform commission. 
            Payouts are processed weekly to your connected bank account.
          </p>
          <div className="bg-blue-50 rounded-lg p-8 border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="text-sm text-gray-600 mb-2">Standard Booking</p>
                <p className="text-3xl font-bold text-blue-600">$150</p>
                <p className="text-sm text-gray-600 mt-2">You earn: $97.50</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">With Drone</p>
                <p className="text-3xl font-bold text-blue-600">$230</p>
                <p className="text-sm text-gray-600 mt-2">You earn: $149.50</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">With Video</p>
                <p className="text-3xl font-bold text-blue-600">$300</p>
                <p className="text-sm text-gray-600 mt-2">You earn: $195</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg mb-8 text-blue-100">
            Join hundreds of photographers earning with Snapty
          </p>
          <Button 
            size="lg"
            onClick={() => setLocation("/photographer/apply")}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold"
          >
            Apply Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Snapty</h3>
              <p className="text-sm">Professional real estate photography on demand</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Photographers</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">How It Works</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Apply</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Clients</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Book Now</a></li>
                <li><a href="#" className="hover:text-white">How It Works</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Snapty. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
