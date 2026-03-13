/**
 * DateTimeSelection is now merged into PropertyDetails.
 * This component redirects to /client/property-details to maintain backward compatibility.
 */
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function DateTimeSelection() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/client/property-details", { replace: true });
  }, [navigate]);
  return null;
}
