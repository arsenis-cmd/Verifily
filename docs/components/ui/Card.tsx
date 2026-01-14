import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#111] border border-[#222] rounded-2xl p-6',
        'transition-all duration-300 hover:border-[#333] hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
