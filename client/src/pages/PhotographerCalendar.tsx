import { useState } from "react";
import { useLocation } from "wouter";
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Bell, LogOut, Home, Inbox,
  DollarSign, User, Plus, X, Save, AlertCircle, Check,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PhotographerLayout } from "@/components/layouts/PhotographerLayout";

type ViewMode = "week" | "month";
type TimeSlot = "09:00" | "11:00" | "13:00" | "15:00" | "17:00";
type Weekday = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

const WEEKDAYS: Weekday[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS: TimeSlot[] = ["09:00", "11:00", "13:00", "15:00", "17:00"];

const BOTTOM_TABS = [
  { value: "dashboard", label: "Dashboard", icon: Home },
  { value: "bookings", label: "Bookings", icon: Inbox },
  { value: "calendar", label: "Calendar", icon: Calendar },
  { value: "earnings", label: "Earnings", icon: DollarSign },
  { value: "profile", label: "Profile", icon: User },
];

/* ─── Day cell ────────────────────────────────────────────── */
function DayCell({
  date,
  isSelected,
  isBooked,
  isBlocked,
  isToday,
  onClick,
}: {
  date: Date;
  isSelected: boolean;
  isBooked: boolean;
  isBlocked: boolean;
  isToday: boolean;
  onClick: () => void;
}) {
  const day = date.getDate();
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
        isSelected
          ? "border-blue-600 bg-blue-50"
          : isBooked
          ? "border-orange-200 bg-orange-50"
          : isBlocked
          ? "border-red-200 bg-red-50"
          : isToday
          ? "border-green-200 bg-green-50"
          : "border-gray-100 bg-white hover:border-gray-200"
      )}
    >
      <p className="text-xs font-bold text-gray-500">{dayName}</p>
      <p className="text-lg font-extrabold text-gray-900">{day}</p>
      {isBooked && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
      {isBlocked && <div className="w-2 h-2 bg-red-500 rounded-full" />}
      {isToday && <div className="w-2 h-2 bg-green-500 rounded-full" />}
    </button>
  );
}

/* ─── Time slot toggle ────────────────────────────────────── */
function TimeSlotToggle({
  slot,
  available,
  onToggle,
}: {
  slot: TimeSlot;
  available: boolean;
  onToggle: () => void;
}) {
  const displayTime = new Date(`2026-01-01T${slot}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center justify-between p-3 rounded-xl border-2 transition-all",
        available
          ? "border-green-200 bg-green-50"
          : "border-gray-100 bg-white hover:border-gray-200"
      )}
    >
      <span className="font-bold text-gray-900">{displayTime}</span>
      <div className={cn(
        "w-6 h-6 rounded-full border-2 flex items-center justify-center",
        available ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"
      )}>
        {available && <Check className="w-4 h-4 text-white" />}
      </div>
    </button>
  );
}

/* ─── Main calendar page ──────────────────────────────────── */
export default function PhotographerCalendar() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayBlocked, setDayBlocked] = useState(false);
  const [slotAvailability, setSlotAvailability] = useState<Record<TimeSlot, boolean>>({
    "09:00": true,
    "11:00": true,
    "13:00": true,
    "15:00": true,
    "17:00": true,
  });
  const [workingHours, setWorkingHours] = useState({ start: "09:00", end: "17:00" });
  const [recurringAvailability, setRecurringAvailability] = useState<Record<Weekday, boolean>>({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: false,
    Sunday: false,
  });
  const [exceptions, setExceptions] = useState<Array<{ date: string; reason: string }>>([]);
  const [newException, setNewException] = useState({ date: "", reason: "" });

  const profileQuery = trpc.photographers.getMyProfile.useQuery(undefined, {
    enabled: user?.role === "photographer",
    retry: false,
  });

  const photographer = profileQuery.data?.photographer;

  /* ── Get days for current view ── */
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    for (let i = firstDay.getDate(); i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getDaysInWeek = (date: Date) => {
    const curr = new Date(date);
    const first = curr.getDate() - curr.getDay();
    const days: Date[] = [];

    for (let i = 0; i < 7; i++) {
      days.push(new Date(curr.setDate(first + i)));
    }
    return days;
  };

  const days = viewMode === "month" ? getDaysInMonth(currentDate) : getDaysInWeek(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isDateBooked = (date: Date) => {
    // Placeholder: in real app, check against bookings
    return false;
  };

  const isDateBlocked = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString() && dayBlocked;
  };

  const isToday = (date: Date) => date.toDateString() === today.toDateString();

  const handleAddException = () => {
    if (!newException.date || !newException.reason) {
      toast.error("Please fill in all fields");
      return;
    }
    setExceptions([...exceptions, newException]);
    setNewException({ date: "", reason: "" });
    toast.success("Exception added");
  };

  const handleRemoveException = (idx: number) => {
    setExceptions(exceptions.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    toast.success("Availability saved successfully!");
    // In real app, call tRPC mutation to save to database
  };

  return (
    <PhotographerLayout>
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-gray-900">Availability Calendar</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => logout().then(() => navigate("/"))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* ── Calendar view toggle ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold text-gray-900">Calendar</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("week")}
                className={cn(
                  "px-3 py-1 rounded-lg font-bold text-xs transition-colors",
                  viewMode === "week"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={cn(
                  "px-3 py-1 rounded-lg font-bold text-xs transition-colors",
                  viewMode === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                Month
              </button>
            </div>
          </div>

          {/* ── Month/week header ── */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-sm font-bold text-gray-900">
              {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* ── Days grid ── */}
          <div className="grid grid-cols-4 gap-2">
            {days.map((day) => (
              <DayCell
                key={day.toDateString()}
                date={day}
                isSelected={day.toDateString() === selectedDate.toDateString()}
                isBooked={isDateBooked(day)}
                isBlocked={isDateBlocked(day)}
                isToday={isToday(day)}
                onClick={() => setSelectedDate(day)}
              />
            ))}
          </div>
        </div>

        {/* ── Time slots for selected day ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gray-900">
              Time Slots for {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </h3>
            <button
              onClick={() => setDayBlocked(!dayBlocked)}
              className={cn(
                "px-3 py-1 rounded-lg font-bold text-xs transition-colors",
                dayBlocked
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {dayBlocked ? "Unblock Day" : "Block Day"}
            </button>
          </div>

          {dayBlocked ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-red-700">This day is blocked</p>
              <p className="text-xs text-red-600 mt-1">Clients cannot book on this date</p>
            </div>
          ) : (
            <div className="space-y-2">
              {TIME_SLOTS.map((slot) => (
                <TimeSlotToggle
                  key={slot}
                  slot={slot}
                  available={slotAvailability[slot]}
                  onToggle={() => {
                    setSlotAvailability({
                      ...slotAvailability,
                      [slot]: !slotAvailability[slot],
                    });
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Working hours ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h3 className="text-sm font-extrabold text-gray-900">Default Working Hours</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Start Time</label>
              <input
                type="time"
                value={workingHours.start}
                onChange={(e) => setWorkingHours({ ...workingHours, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg font-medium text-gray-900"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">End Time</label>
              <input
                type="time"
                value={workingHours.end}
                onChange={(e) => setWorkingHours({ ...workingHours, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg font-medium text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* ── Recurring availability ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h3 className="text-sm font-extrabold text-gray-900">Recurring Availability</h3>

          <div className="space-y-2">
            {WEEKDAYS.map((day) => (
              <button
                key={day}
                onClick={() => {
                  setRecurringAvailability({
                    ...recurringAvailability,
                    [day]: !recurringAvailability[day],
                  });
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all",
                  recurringAvailability[day]
                    ? "border-green-200 bg-green-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                )}
              >
                <span className="font-bold text-gray-900">{day}</span>
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                  recurringAvailability[day] ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"
                )}>
                  {recurringAvailability[day] && <Check className="w-4 h-4 text-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Exceptions ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h3 className="text-sm font-extrabold text-gray-900">Exceptions (Vacation, Blocked Dates)</h3>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={newException.date}
                onChange={(e) => setNewException({ ...newException, date: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg font-medium text-gray-900"
              />
              <input
                type="text"
                placeholder="e.g., Vacation"
                value={newException.reason}
                onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg font-medium text-gray-900 placeholder-gray-400"
              />
            </div>
            <button
              onClick={handleAddException}
              className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Exception
            </button>
          </div>

          {exceptions.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-gray-100">
              {exceptions.map((exc, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{exc.reason}</p>
                    <p className="text-xs text-gray-500">{new Date(exc.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveException(idx)}
                    className="p-1 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Calendar sync placeholder ── */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
          <h3 className="text-sm font-extrabold text-gray-900">Calendar Sync</h3>
          <p className="text-xs text-gray-600">Google Calendar sync coming soon. For now, manage your availability manually above.</p>
        </div>

        {/* ── Save button ── */}
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-colors"
        >
          <Save className="w-5 h-5" />
          Save Availability
        </button>
      </div>

      {/* ── Bottom navigation ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-around">
          {BOTTOM_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.value === "calendar";
            return (
              <button
                key={tab.value}
                onClick={() => {
                  if (tab.value === "dashboard") navigate("/photographer");
                  else if (tab.value === "bookings") navigate("/photographer/bookings");
                  else if (tab.value === "earnings") navigate("/photographer/earnings");
                  else if (tab.value === "profile") navigate("/photographer/profile");
                }}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-colors",
                  isActive
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-bold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
    </PhotographerLayout>
  );
}
