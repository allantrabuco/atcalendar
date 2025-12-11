import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-light transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:none  aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-primary/60',
        'default-rounded':
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-primary/60 rounded',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 active:bg-primary/60 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 rounded',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 rounded',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 active:bg-secondary/60',
        'secondary-rounded':
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 active:bg-secondary/60 rounded',
        grey: 'bg-[var(--button-group-separator)] text-secondary-foreground shadow-xs hover:bg-secondary/80 active:bg-secondary/60',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 rounded',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-8 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-6 gap-1.5 px-3 has-[>svg]:px-2.5',
        smr: 'h-6 rounded-sm gap-1.5 px-3 has-[>svg]:px-2.5',
        smdr: 'h-6 rounded gap-1.5 px-3 has-[>svg]:px-2.5',
        smdrr: 'h-6 rounded-r gap-1.5 px-3 has-[>svg]:px-2.5',
        smdrl: 'h-6 rounded-l gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-sm px-6 has-[>svg]:px-4',
        lgr: 'h-10 px-6 has-[>svg]:px-4',
        icon: 'size-9',
        menu: 'w-18 h-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
