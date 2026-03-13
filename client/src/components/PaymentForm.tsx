import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface PaymentFormProps {
  bookingId: number;
  amount: number;
  bookingCode: string;
  onPaymentSuccess?: () => void;
}

export function PaymentForm({
  bookingId,
  amount,
  bookingCode,
  onPaymentSuccess,
}: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const createCheckoutSession = trpc.payments.createCheckoutSession.useMutation();

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const result = await createCheckoutSession.mutateAsync({
        bookingId,
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });

      if (result.checkoutUrl) {
        toast.success("Redirecting to checkout...");
        // Open in new tab
        window.open(result.checkoutUrl, "_blank");
        onPaymentSuccess?.();
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <CardDescription>Complete your booking with secure payment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Booking Code:</span>
            <span className="font-mono font-semibold">{bookingCode}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold border-t pt-2">
            <span>Total Amount:</span>
            <span className="text-blue-600">${amount.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>Test Card:</strong> 4242 4242 4242 4242 (any future date, any CVC)
          </p>
        </div>

        <Button
          onClick={handlePayment}
          disabled={isProcessing || createCheckoutSession.isPending}
          className="w-full h-12 text-base"
          size="lg"
        >
          {isProcessing || createCheckoutSession.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          You will be redirected to a secure Stripe checkout page. Your payment information is encrypted and secure.
        </p>
      </CardContent>
    </Card>
  );
}
