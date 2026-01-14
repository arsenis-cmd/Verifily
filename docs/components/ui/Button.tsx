import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200',
  {
    variants: {
      variant: {
        primary: 'bg-white text-black hover:bg-gray-100 hover:scale-[1.02] font-semibold',
        secondary: 'bg-transparent text-white border border-[#333] hover:border-[#555] hover:bg-[#111111]',
        ghost: 'bg-transparent text-[#a1a1a1] hover:text-white',
      },
      size: {
        sm: 'px-5 py-2.5 text-[14px]',
        md: 'px-6 py-3 text-[15px]',
        lg: 'px-8 py-4 text-[16px]',
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
