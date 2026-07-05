import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const Card = ({ children, className = '', padding = 'md' }: CardProps) => {
  return (
    <div
      className={[
        'bg-surface rounded-card shadow-card border border-border',
        paddingClasses[padding],
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

export default Card
