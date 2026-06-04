import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const SheetContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

const Sheet = ({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = (op: boolean) => {
    if (open === undefined) setInternalOpen(op)
    if (onOpenChange) onOpenChange(op)
  }

  return (
    <SheetContext.Provider value={{ open: isOpen, setOpen: setIsOpen }}>
      {children}
    </SheetContext.Provider>
  )
}

const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const context = React.useContext(SheetContext)
  if (!context) throw new Error("SheetTrigger must be inside Sheet")

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      onClick={(e) => {
        context.setOpen(true)
        onClick?.(e)
      }}
      {...props}
    />
  )
})
SheetTrigger.displayName = "SheetTrigger"

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    side?: "top" | "bottom" | "left" | "right"
  }
>(({ className, children, side = "right", ...props }, ref) => {
  const context = React.useContext(SheetContext)
  if (!context) throw new Error("SheetContent must be inside Sheet")

  if (!context.open) return null

  // Click outside listener for the overlay
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => context.setOpen(false)}
      />
      <div
        ref={ref}
        role="dialog"
        className={cn(
          "fixed z-50 bg-white p-6 shadow-lg transition-transform duration-300 ease-in-out flex flex-col h-full",
          side === "right" && "right-0 top-0 w-full sm:max-w-md border-l",
          side === "left" && "left-0 top-0 w-full sm:max-w-md border-r",
          side === "top" && "top-0 left-0 w-full h-1/3 border-b",
          side === "bottom" && "bottom-0 left-0 w-full h-1/3 border-t",
          className
        )}
        {...props}
      >
        <button
          type="button"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          onClick={() => context.setOpen(false)}
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </>
  )
})
SheetContent.displayName = "SheetContent"

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-left border-b pb-4 mb-4",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 border-t pt-4 mt-auto",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-bold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = "SheetDescription"

const SheetClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const context = React.useContext(SheetContext)
  if (!context) throw new Error("SheetClose must be inside Sheet")

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      onClick={(e) => {
        context.setOpen(false)
        onClick?.(e)
      }}
      {...props}
    />
  )
})
SheetClose.displayName = "SheetClose"

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
}
