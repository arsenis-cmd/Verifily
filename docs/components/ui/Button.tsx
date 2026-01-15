import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-3 rounded-full font-medium transition-all duration-200 whitespace-nowrap',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white hover:opacity-90 hover:scale-[1.02] font-semibold',
        secondary: 'bg-transparent text-white border-2 border-[#333] hover:border-[#555] hover:bg-[#111111]',
        ghost: 'bg-transparent text-[#a1a1a1] hover:text-white',
      },
      size: {
        sm: 'px-8 py-4 text-[14px]',
        md: 'px-10 py-5 text-[15px]',
        lg: 'px-14 py-6 text-[16px]',
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
