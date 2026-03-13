import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function NavigationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const menuItems = [
    { label: "For Clients", href: "/" },
    { label: "For Photographers", href: "/for-photographers" },
    { label: "Client Login", href: "/client/login" },
    { label: "Photographer Login", href: "/photographer/login" },
    { label: "Admin Login", href: "/admin/login" },
  ];

  const handleNavigate = (href: string) => {
    setLocation(href);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg hover:bg-gray-100 lg:hidden"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-900" />
        ) : (
          <Menu className="w-6 h-6 text-gray-900" />
        )}
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="fixed inset-0 top-0 z-40 bg-white lg:hidden">
          <div className="pt-20 px-4 space-y-4">
            {menuItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className="block w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 text-gray-900 font-medium"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Menu */}
      <div className="hidden lg:flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => handleNavigate("/")}>
          For Clients
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleNavigate("/for-photographers")}>
          For Photographers
        </Button>
        <div className="w-px h-6 bg-gray-200 mx-2" />
        <Button variant="ghost" size="sm" onClick={() => handleNavigate("/client/login")}>
          Client Login
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleNavigate("/photographer/login")}>
          Photographer Login
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleNavigate("/admin/login")}>
          Admin
        </Button>
      </div>
    </>
  );
}
