
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-background", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-sm font-black uppercase tracking-widest text-primary",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "default" }),
          "h-8 w-8 p-0 absolute left-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md border-none z-10"
        ),
        button_next: cn(
          buttonVariants({ variant: "default" }),
          "h-8 w-8 p-0 absolute right-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md border-none z-10"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex mb-2",
        weekday:
          "text-muted-foreground rounded-md w-9 font-black text-[0.7rem] uppercase text-center flex-1",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20 flex-1",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-bold aria-selected:opacity-100 hover:bg-primary/10 transition-colors rounded-md"
        ),
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-black shadow-lg opacity-100 rounded-md scale-105",
        range_start: "rounded-l-md rounded-r-none bg-primary text-primary-foreground",
        range_end: "rounded-r-md rounded-l-none bg-primary text-primary-foreground",
        range_middle: "aria-selected:bg-primary/20 aria-selected:text-primary font-bold rounded-none",
        today: "bg-accent/10 text-accent-foreground font-black border border-accent/20",
        outside: "text-muted-foreground/30 opacity-50",
        disabled: "text-muted-foreground/20 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === "left") {
            return <ChevronLeft className="h-5 w-5 text-primary-foreground" />
          }
          return <ChevronRight className="h-5 w-5 text-primary-foreground" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
