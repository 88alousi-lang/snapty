import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Plus, Loader2, ArrowRight, ArrowLeft, Info } from "lucide-react";
import { toast } from "sonner";

export default function BookingAddons() {
  const [, navigate] = useLocation();
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);

  const servicesQuery = trpc.services.list.useQuery();
  const addons = (servicesQuery.data ?? []).filter(s => s.serviceType === "addon" && s.isActive !== false);

  const toggleAddon = (id: number) => {
    setSelectedAddons(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    // In a real flow, we'd save these to a context or local storage
    localStorage.setItem("booking_addons", JSON.stringify(selectedAddons));
    navigate("/client/book/review");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Enhance Your Photos</h1>
          <p className="text-gray-600 mt-2">Select add-on services to get the most out of your shoot.</p>
        </div>

        {servicesQuery.isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : addons.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No add-on services available at the moment.</p>
              <Button variant="link" onClick={() => navigate("/client/book/review")} className="mt-4">
                Skip to Review
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {addons.map((addon) => {
              const isSelected = selectedAddons.includes(addon.id);
              return (
                <Card 
                  key={addon.id} 
                  className={`cursor-pointer transition-all border-2 ${
                    isSelected ? "border-blue-600 bg-blue-50/50 shadow-md" : "border-transparent hover:border-gray-200"
                  }`}
                  onClick={() => toggleAddon(addon.id)}
                >
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 mt-1 flex items-center justify-center transition-colors ${
                      isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-gray-900">{addon.name}</h3>
                        <p className="font-bold text-blue-600">${parseFloat(String(addon.basePrice)).toFixed(0)}</p>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{addon.description}</p>
                      {addon.deliveryTime && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <Loader2 className="w-3 h-3" /> Delivery: {addon.deliveryTime}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/client/book/photographers")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">Selected Add-ons</p>
              <p className="font-bold text-gray-900">{selectedAddons.length} items</p>
            </div>
            <Button 
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 gap-2 rounded-xl"
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
