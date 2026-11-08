import clsx from 'clsx'

/** Quiet graphite avatar — signature initials without rainbow identity colors */
export function Avatar({
  initials,
  size = 'md',
  dimmed,
}: {
  initials: string
  size?: 'sm' | 'md' | 'lg'
  dimmed?: boolean
}) {
  const sizes = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-8 w-8 text-[11px]',
    lg: 'h-12 w-12 text-[14px]',
  }
  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-md bg-sidebar font-medium text-white',
        sizes[size],
        dimmed && 'opacity-40',
      )}
    >
      {initials}
    </span>
  )
}
