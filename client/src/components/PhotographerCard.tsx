import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Camera, Plane, Video, MapIcon } from "lucide-react";

interface PhotographerCardProps {
  id: number;
  name: string;
  profileImage?: string;
  rating: number;
  reviewCount: number;
  startingPrice: number;
  city: string;
  state: string;
  services: Array<{
    name: string;
    icon: "camera" | "drone" | "video" | "floorplan";
  }>;
  isSelected?: boolean;
  onClick?: () => void;
}

const serviceIcons: Record<string, React.ReactNode> = {
  camera: <Camera className="w-4 h-4" />,
  drone: <Plane className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  floorplan: <MapIcon className="w-4 h-4" />,
};

export function PhotographerCard({
  id,
  name,
  profileImage,
  rating,
  reviewCount,
  startingPrice,
  city,
  state,
  services,
  isSelected = false,
  onClick,
}: PhotographerCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`overflow-hidden cursor-pointer transition-all duration-300 group ${
        isSelected
          ? "ring-2 ring-blue-600 shadow-xl"
          : "hover:shadow-lg"
      }`}
    >
      {/* Profile Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden">
        {profileImage ? (
          <img
            src={profileImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-16 h-16 text-blue-300" />
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 shadow-md flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="font-bold text-sm text-gray-900">{rating.toFixed(1)}</span>
          <span className="text-xs text-gray-600">({reviewCount})</span>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-3 left-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Name & Location */}
        <div className="mb-3">
          <h3 className="font-bold text-gray-900 text-lg mb-1">{name}</h3>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{city}, {state}</span>
          </div>
        </div>

        {/* Services */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {services.map((service, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 text-xs"
              >
                {serviceIcons[service.icon]}
                {service.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-blue-600">
              ${(startingPrice / 100).toFixed(0)}
            </span>
            <span className="text-sm text-gray-600">starting price</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
