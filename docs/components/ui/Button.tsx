import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white hover:opacity-90',
        secondary: 'bg-transparent text-white border-2 border-[#333] hover:border-[#555] hover:bg-[#111111]',
        ghost: 'bg-transparent text-[#a1a1a1] hover:text-white',
      },
      size: {
        sm: 'h-[48px] px-[32px] text-[14px]',
        md: 'h-[56px] px-[40px] text-[15px]',
        lg: 'h-[64px] px-[48px] text-[16px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
