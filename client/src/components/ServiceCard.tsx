import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface ServiceCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  price: string;
  features: string[];
  isSelected?: boolean;
  onClick?: () => void;
}

export function ServiceCard({
  icon,
  title,
  description,
  price,
  features,
  isSelected = false,
  onClick,
}: ServiceCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 group h-full ${
        isSelected
          ? "ring-2 ring-blue-600 shadow-lg scale-105"
          : "hover:shadow-xl hover:scale-105"
      }`}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative p-6 h-full flex flex-col">
        {/* Icon */}
        <div className="mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow">
            {icon}
          </div>
        </div>

        {/* Title & Description */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>

          {/* Features */}
          <ul className="space-y-2 mb-4">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Price */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-blue-600">{price}</span>
            <span className="text-sm text-gray-600">/shoot</span>
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </Card>
  );
}
