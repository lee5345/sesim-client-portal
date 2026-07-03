"use client"

import * as React from "react"
import { format, isValid, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DateInputProps = {
  id: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  className?: string
}

function digitsToIsoDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  const y = digits.slice(0, 4)
  const m = digits.slice(4, 6)
  const d = digits.slice(6, 8)

  if (!m) return y
  if (!d) return `${y}-${m}`
  return `${y}-${m}-${d}`
}

function normalizeIsoDate(value: string): string {
  if (!value) return ""
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const parsed = parseISO(value)
  if (!isValid(parsed)) return value
  return format(parsed, "yyyy-MM-dd")
}

function parseSelectedDate(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : undefined
}

export function DateInput({
  id,
  value,
  onChange,
  required = false,
  disabled = false,
  className,
}: DateInputProps) {
  const [open, setOpen] = React.useState(false)
  const selected = parseSelectedDate(value)

  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="YYYY-MM-DD"
        value={value}
        onChange={(event) => onChange(digitsToIsoDate(event.target.value))}
        onBlur={() => onChange(normalizeIsoDate(value))}
        required={required}
        disabled={disabled}
        title="YYYY-MM-DD"
        className={cn("pr-10 font-mono tabular-nums")}
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-1 -translate-y-1/2"
              disabled={disabled}
              aria-label="날짜 선택"
            />
          }
        >
          <CalendarIcon className="size-4" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (!date) return
              onChange(format(date, "yyyy-MM-dd"))
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
