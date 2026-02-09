import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-white text-black hover:bg-slate-200",
                destructive:
                    "bg-red-500 text-destructive-foreground hover:bg-red-500/90",
                outline:
                    "border border-white/10 bg-transparent hover:bg-white/5 hover:text-white",
                secondary:
                    "bg-[#111] border border-white/10 text-white hover:border-[#00E5FF]/50 hover:text-[#00E5FF]",
                ghost: "hover:bg-white/10 hover:text-white",
                link: "text-primary underline-offset-4 hover:underline",
                ork: "bg-[#00E5FF] text-black hover:bg-[#00E5FF]/90 font-bold tracking-tight shadow-[0_0_15px_rgba(0,229,255,0.4)]",
                // Mappings for KubeLite legacy variants if needed, or mapped below
                primary: "bg-white text-black hover:bg-slate-200", // Map primary to default/white
                danger: "bg-red-500 text-destructive-foreground hover:bg-red-500/90",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
                // KubeLite sizes
                md: "h-10 px-4 py-2",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
    isLoading?: boolean
    fullWidth?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, isLoading, fullWidth, leftIcon, rightIcon, children, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"

        // Map KubeLite variants/sizes to GOrk8stra if passed literally
        // (Though TS might complain if strict, but runtime safe)
        const effectiveVariant = variant === 'primary' ? 'default' : variant === 'danger' ? 'destructive' : variant;
        const effectiveSize = size === 'md' ? 'default' : size;

        return (
            <Comp
                className={cn(buttonVariants({ variant: effectiveVariant as any, size: effectiveSize as any, className }), fullWidth && "w-full")}
                ref={ref}
                disabled={props.disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
                {children}
                {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
            </Comp>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
export default Button; // Export default for KubeLite compatibility
