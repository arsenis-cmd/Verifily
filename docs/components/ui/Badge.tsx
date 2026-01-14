import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border',
  {
    variants: {
      variant: {
        default: 'bg-[#111] border-[#222] text-[#a1a1a1]',
        success: 'bg-[rgba(0,255,136,0.1)] border-[#00ff88] text-[#00ff88]',
        error: 'bg-[rgba(255,68,68,0.1)] border-[#ff4444] text-[#ff4444]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
