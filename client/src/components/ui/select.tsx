import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
} | null>(null)

const Select = ({
  children,
  value,
  onValueChange,
  defaultValue,
}: {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)

  const activeValue = value !== undefined ? value : internalValue
  const handleValueChange = (val: string) => {
    if (value === undefined) {
      setInternalValue(val)
    }
    if (onValueChange) {
      onValueChange(val)
    }
    setOpen(false)
  }

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (open && triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [open])

  return (
    <SelectContext.Provider
      value={{
        value: activeValue,
        onValueChange: handleValueChange,
        open,
        setOpen,
        triggerRef,
      }}
    >
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectTrigger must be inside Select")

  const combinedRef = (node: HTMLButtonElement) => {
    (context.triggerRef as any).current = node
    if (typeof ref === "function") ref(node)
    else if (ref) (ref as any).current = node
  }

  return (
    <button
      ref={combinedRef}
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => context.setOpen(!context.open)}
      {...props}
    >
      {children}
      <ChevronDown className="size-4 opacity-50" />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectValue must be inside Select")

  return (
    <span
      ref={ref}
      className={cn("block truncate text-sm text-foreground", className)}
      {...props}
    >
      {context.value || placeholder}
    </span>
  )
})
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectContent must be inside Select")

  if (!context.open) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-[1000] mt-1 max-h-60 w-full overflow-auto border bg-popover p-1 text-popover-foreground shadow-md outline-none animate-in fade-in-80",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectItem must be inside Select")

  const isSelected = context.value === value

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isSelected && "bg-accent/50 font-medium",
        className
      )}
      onClick={() => context.onValueChange?.(value)}
      {...props}
    >
      {isSelected ? (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="size-4 text-primary" />
        </span>
      ) : null}
      <span className="block truncate">{children}</span>
    </div>
  )
})
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
