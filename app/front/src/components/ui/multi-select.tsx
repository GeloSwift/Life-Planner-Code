"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface Option {
  label: string
  value: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  renderOption?: (option: Option) => React.ReactNode
  renderBadge?: (option: Option) => React.ReactNode
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Sélectionner...",
  className,
  renderOption,
  renderBadge,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (value: string) => {
    onChange(selected.filter((s) => s !== value))
  }

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      handleUnselect(value)
    } else {
      onChange([...selected, value])
    }
  }

  const handleToggleAll = () => {
    if (selected.length === options.length) {
      onChange([])
    } else {
      onChange(options.map((opt) => opt.value))
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-10 w-full justify-between min-h-10",
            selected.length > 0 && "h-auto",
            className
          )}
        >
          <div className="flex gap-1 flex-wrap flex-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((value) => {
                const option = options.find((opt) => opt.value === value)
                if (!option) return null
                return (
                  <Badge
                    variant="secondary"
                    key={value}
                    className="mr-1 mb-1"
                  >
                    {renderBadge ? renderBadge(option) : (option.label || value)}
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          e.stopPropagation()
                          handleUnselect(value)
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleUnselect(value)
                      }}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </span>
                  </Badge>
                )
              })
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="max-h-[300px] overflow-auto p-2">
          {options.length > 0 && (
            <div className="mb-2">
              <button
                type="button"
                onClick={handleToggleAll}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                {selected.length === options.length
                  ? "Tout désélectionner"
                  : "Tout sélectionner"}
              </button>
            </div>
          )}
          <div className="space-y-1">
            {options.map((option) => {
              const isSelected = selected.includes(option.value)
              return (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <div className="flex h-4 w-4 items-center justify-center rounded-sm border border-primary mr-2">
                    {isSelected && (
                      <Check className="h-3 w-3 text-primary" />
                    )}
                  </div>
                  {renderOption ? renderOption(option) : <span>{option.label}</span>}
                </div>
              )
            })}
            {options.length === 0 && (
              <div className="text-sm text-muted-foreground p-2 text-center">
                Aucune option disponible
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
