import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-ink border-transparent',
  secondary: 'bg-ink text-white hover:bg-[#2a2a2a] border-transparent',
  ghost: 'bg-transparent text-ink hover:bg-raised border-transparent',
  danger: 'bg-danger text-white hover:bg-[#b91c1c] border-transparent',
  outline: 'bg-surface text-ink border-border hover:bg-raised',
}

const sizes = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-3.5 text-[14px]',
  lg: 'h-11 px-4 text-[14px] font-medium',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}: Props) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      {...props}
    />
  )
}
