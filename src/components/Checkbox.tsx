import type { InputHTMLAttributes } from 'react'
import { Check } from 'lucide-react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

const Checkbox = ({ label, checked, onChange, id, className = '', ...props }: CheckboxProps) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <label
      htmlFor={inputId}
      className={[
        'inline-flex items-center gap-3 cursor-pointer select-none',
        className,
      ].join(' ')}
    >
      <span className="relative flex items-center justify-center">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
          {...props}
        />
        <span
          className={[
            'flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors',
            'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2',
            checked
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-surface hover:border-primary',
          ].join(' ')}
        >
          {checked && <Check className="h-4 w-4" />}
        </span>
      </span>
      {label && <span className="text-base text-text-primary">{label}</span>}
    </label>
  )
}

export default Checkbox
