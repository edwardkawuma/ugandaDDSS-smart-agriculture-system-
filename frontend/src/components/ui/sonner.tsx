import { useTheme } from "@/contexts/ThemeContext"
import { Toaster as Sonner, toast } from "sonner"
import "./toast-spacing.css"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { themeMode } = useTheme()

  return (
    <Sonner
      theme={themeMode as ToasterProps["theme"]}
      className="toaster group [&_[data-sonner-toast]]:gap-1 [&_[data-sonner-toast]>div]:gap-1 [&_[data-sonner-toast]>div>div]:gap-1 [&_[data-sonner-toast]>div>div>div]:gap-1"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-md [&>div]:gap-1 group-[.toaster]:rounded-full px-6",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive [&>div]:gap-1",
          success: "group-[.toaster]:bg-success group-[.toaster]:text-success-foreground group-[.toaster]:border-success [&>div]:gap-1",
          warning: "group-[.toaster]:bg-warning group-[.toaster]:text-warning-foreground group-[.toaster]:border-warning [&>div]:gap-1",
          info: "group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground group-[.toaster]:border-primary [&>div]:gap-1",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
