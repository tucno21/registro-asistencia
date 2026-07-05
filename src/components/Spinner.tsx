import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: number
  className?: string
}

const Spinner = ({ size = 24, className = '' }: SpinnerProps) => {
  return (
    <Loader2
      className={['animate-spin text-primary', className].join(' ')}
      size={size}
    />
  )
}

export default Spinner
