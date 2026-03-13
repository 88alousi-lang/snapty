import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Bell, Trash2, CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ClientLayout } from "@/components/layouts/ClientLayout";
import { trpc } from "@/lib/trpc";

interface Notification {
  id: string;
  type: "booking" | "system" | "alert";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "booking",
    title: "Booking Confirmed",
    message: "Your booking with photographer John Smith has been confirmed for March 15, 2026 at 2:00 PM",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    actionUrl: "/client/booking/TEST123",
  },
  {
    id: "2",
    type: "booking",
    title: "Photos Delivered",
    message: "John Smith has delivered your photos from the March 10 booking. You can now download them.",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: false,
    actionUrl: "/client/booking/TEST122",
  },
  {
    id: "3",
    type: "system",
    title: "Welcome to Snapty!",
    message: "Welcome to Snapty! Start booking professional photographers for your real estate properties.",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: "4",
    type: "alert",
    title: "Booking Reminder",
    message: "Your booking with Sarah Johnson is coming up in 24 hours. Please confirm your availability.",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    read: true,
    actionUrl: "/client/booking/TEST121",
  },
];

export default function ClientNotifications() {
  const [, navigate] = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread" | "booking" | "system">("all");
  const [isLoading, setIsLoading] = useState(true);

  // Load notifications from backend using tRPC
  const notificationsQuery = trpc.notifications.getAll.useQuery();

  useEffect(() => {
    if (notificationsQuery.data) {
      // Transform backend notifications to UI format
      const transformed = notificationsQuery.data.map((notif: any) => ({
        id: notif.id,
        type: notif.type || "system",
        title: notif.title,
        message: notif.message,
        timestamp: new Date(notif.createdAt),
        read: notif.read,
        actionUrl: notif.actionUrl,
      }));
      setNotifications(transformed);
      setIsLoading(false);
    } else if (notificationsQuery.isError) {
      toast.error("Failed to load notifications");
      setIsLoading(false);
    }
  }, [notificationsQuery.data, notificationsQuery.isError]);

  const filteredNotifications = notifications.filter(notif => {
    if (filter === "all") return true;
    if (filter === "unread") return !notif.read;
    if (filter === "booking") return notif.type === "booking";
    if (filter === "system") return notif.type === "system" || notif.type === "alert";
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    // Call tRPC mutation to mark notification as read
    // Note: This requires a backend mutation endpoint for marking notifications as read
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleDelete = async (id: string) => {
    try {
      // Call tRPC mutation to delete notification
      // Note: This requires a backend mutation endpoint for deleting notifications
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ClientLayout>
    );
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const handleDeleteAll = () => {
    setNotifications([]);
    toast.success("All notifications deleted");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "alert":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case "system":
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <ClientLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
                </p>
              </div>
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    Mark all as read
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { value: "all", label: "All" },
              { value: "unread", label: "Unread" },
              { value: "booking", label: "Bookings" },
              { value: "system", label: "System" },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as any)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  filter === tab.value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <Card className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
              <p className="text-gray-600">You're all caught up!</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map(notification => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.read ? "bg-blue-50 border-blue-200" : ""
                  }`}
                  onClick={() => {
                    if (!notification.read) handleMarkAsRead(notification.id);
                    if (notification.actionUrl) navigate(notification.actionUrl);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">{formatTime(notification.timestamp)}</p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Clear All Button */}
          {notifications.length > 0 && filteredNotifications.length > 0 && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={handleDeleteAll}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Notifications
              </Button>
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
