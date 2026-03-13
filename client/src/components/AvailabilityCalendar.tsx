import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AvailabilitySlot {
  id?: number;
  dayOfWeek: number; // 0-6
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isAvailable: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AvailabilityCalendar() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([
    { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isAvailable: true },
    { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isAvailable: true },
    { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isAvailable: true },
    { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", isAvailable: true },
    { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isAvailable: true },
  ]);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleAddSlot = () => {
    const newSlot: AvailabilitySlot = {
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
      isAvailable: true,
    };
    setSlots([...slots, newSlot]);
  };

  const handleRemoveSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
    toast.success("Slot removed");
  };

  const handleUpdateSlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    setSlots(updated);
  };

  const handleSaveAvailability = () => {
    // In a real app, this would call the API
    toast.success("Availability saved successfully!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability</CardTitle>
          <CardDescription>Set your recurring availability schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {slots.map((slot, index) => (
            <div key={index} className="flex items-end gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <Label className="text-sm">Day</Label>
                <select
                  value={slot.dayOfWeek}
                  onChange={(e) =>
                    handleUpdateSlot(index, "dayOfWeek", parseInt(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                >
                  {DAYS.map((day, i) => (
                    <option key={i} value={i}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-sm">Start Time</Label>
                <Input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) =>
                    handleUpdateSlot(index, "startTime", e.target.value)
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm">End Time</Label>
                <Input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => handleUpdateSlot(index, "endTime", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`available-${index}`}
                  checked={slot.isAvailable}
                  onCheckedChange={(checked) =>
                    handleUpdateSlot(index, "isAvailable", checked)
                  }
                />
                <Label htmlFor={`available-${index}`} className="text-sm cursor-pointer">
                  Available
                </Label>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveSlot(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button onClick={handleAddSlot} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Time Slot
          </Button>

          <Button onClick={handleSaveAvailability} className="w-full">
            Save Availability
          </Button>
        </CardContent>
      </Card>

      {/* Calendar Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar Preview</CardTitle>
          <CardDescription>Your availability for {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="font-semibold">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day) => (
                <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
                  {day.slice(0, 3)}
                </div>
              ))}

              {Array.from({ length: 35 }).map((_, i) => {
                const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
                const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
                const dayNum = i - firstDay + 1;
                const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                const isAvailableDay = isCurrentMonth && slots.some(s => s.dayOfWeek === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum).getDay() && s.isAvailable);

                return (
                  <div
                    key={i}
                    className={`p-2 text-center rounded text-sm ${
                      isCurrentMonth
                        ? isAvailableDay
                          ? "bg-green-100 text-green-900 font-semibold"
                          : "bg-gray-100 text-gray-600"
                        : "text-gray-300"
                    }`}
                  >
                    {isCurrentMonth ? dayNum : ""}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
