import React, {useEffect, useState} from "react";
import {enGB} from "date-fns/locale";
import {DatePickerCalendar} from "react-nice-dates";
import "react-nice-dates/build/style.css";
import {Button, Input, InputGroup} from "@chakra-ui/react";
import {getDay} from "date-fns";
import {FaCalendar} from "react-icons/fa";
import {Event}from "@/types"

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DatePickerInputProps {
  account_id: number;
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  advanceNoticeDays: number;
  cutOffTime: string;
  weekSchedule: string;
}

function DatePickerInput({ selectedDate, onDateChange, weekSchedule, cutOffTime, advanceNoticeDays, account_id}: DatePickerInputProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(selectedDate ?? undefined);
  const [minimumDate] = useState<Date>(new Date());

  const token = sessionStorage.getItem("swayam_jwt_token");

  useEffect(() => {
    // Week Schedule
    const parsedSchedule = weekSchedule.split('').map(Number);
    setBlockedDays(parsedSchedule);

    // Advanced Notice Days
    minimumDate.setDate(minimumDate.getDate() + advanceNoticeDays);

    // Cutoff Time
    const now = new Date();
    const [cutoffHours, cutoffMinutes, cutoffSeconds] = cutOffTime.split(":").map(Number);

    const cutoffDate = new Date(now);
    cutoffDate.setHours(cutoffHours, cutoffMinutes, cutoffSeconds, 0);

    if (now > cutoffDate) {
      minimumDate.setDate(minimumDate.getDate() + 1);
    }

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/v1/accounts/block-days/${account_id}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        const allDates: Set<Date> = new Set();

        data.data.forEach((event: Event) => {
          const start = new Date(event.start_date);
          const end = new Date(event.end_date);
          if (end>now){
            for (let dateInBetween = new Date(start); dateInBetween <= end; dateInBetween.setDate(dateInBetween.getDate() + 1)) {
              allDates.add(new Date(dateInBetween));
            }
          }
        });

        setBlockedDates(Array.from(allDates))
      });
  }, []);

  function areDatesEqual(date1: Date, date2: Date) {
    // Set both dates to midnight (00:00:00)
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());

    return d1.getTime() === d2.getTime(); // returns true if same date
  }

  useEffect(() => {
    setTempDate(selectedDate ?? undefined);
  }, [selectedDate]);

  const handleSave = () => {
    onDateChange(tempDate ?? null);
    setIsDialogOpen(false);
  };

  const [blockedDates, setBlockedDates] = useState<Date[]>([]);


  const [blockedDays, setBlockedDays] = useState<number[]>([1,1,1,1,1,1,1]);

  const modifiers = {
    disabled: (date: Date) => {
      const isWeekDayNotAllowed = blockedDays[getDay(date)] === 0;

      const isBlockedDate = blockedDates.some((dateToDisable) =>
        areDatesEqual(dateToDisable, date)
      );

      return isWeekDayNotAllowed || isBlockedDate;

    },
  };
  const modifiersClassNames = {
    highlight: "-highlight"
  };

  return (
    <DialogRoot
      open={isDialogOpen}
      onOpenChange={(e) => setIsDialogOpen(e.open)}
      placement="center"
      motionPreset="slide-in-bottom"
    >
      <DialogTrigger asChild>
        <InputGroup startElement={<FaCalendar />}>
          <Input
            placeholder="Select Date"
            value={selectedDate ? selectedDate.toLocaleDateString() : ""}
            onClick={() => setIsDialogOpen(true)}
            readOnly
            required
          />
        </InputGroup>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Alert Date</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <DatePickerCalendar
            date={tempDate}
            minimumDate={minimumDate}
            onDateChange={(newDate) => setTempDate(newDate ?? undefined)}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            locale={enGB}
          />
        </DialogBody>

        <DialogFooter>
          <DialogCloseTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </DialogCloseTrigger>
          <Button colorScheme="blue" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

export default DatePickerInput;