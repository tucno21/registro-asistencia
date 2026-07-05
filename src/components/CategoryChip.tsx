import { Check } from 'lucide-react'
import type { ColorCategoria } from '../types'

interface CategoryChipProps {
  label: string
  color: ColorCategoria
  selected: boolean
  onClick: () => void
  size?: 'sm' | 'md'
}

const selectedStyles: Record<ColorCategoria, string> = {
  success: 'bg-success text-success-foreground ring-2 ring-success/25',
  warning: 'bg-warning text-warning-foreground ring-2 ring-warning/25',
  error: 'bg-error text-error-foreground ring-2 ring-error/25',
  info: 'bg-info text-info-foreground ring-2 ring-info/25',
  neutral: 'bg-slate-500 text-white ring-2 ring-slate-500/25',
}

const sizeClasses = {
  sm: 'px-2.5 py-0.5 text-xs gap-0.5',
  md: 'px-3 py-1 text-xs gap-1',
}

const CategoryChip = ({
  label,
  color,
  selected,
  onClick,
  size = 'md',
}: CategoryChipProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center rounded-full font-semibold',
        'transition-all duration-150 select-none',
        sizeClasses[size],
        selected
          ? selectedStyles[color]
          : 'bg-surface border-[1.5px] border-border text-text-secondary hover:border-text-muted hover:bg-surface-alt',
      ].join(' ')}
    >
      {selected && <Check className="h-3 w-3 flex-shrink-0" />}
      {label}
    </button>
  )
}

export default CategoryChip
