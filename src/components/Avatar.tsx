interface AvatarProps {
  name: string
  size?: 'sm' | 'md'
}

const AVATAR_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-teal-100', text: 'text-teal-700' },
  { bg: 'bg-amber-100', text: 'text-amber-600' },
  { bg: 'bg-red-100', text: 'text-red-600' },
  { bg: 'bg-cyan-100', text: 'text-cyan-600' },
  { bg: 'bg-green-100', text: 'text-green-600' },
  { bg: 'bg-slate-100', text: 'text-slate-600' },
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase()
}

function getColorIndex(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % AVATAR_COLORS.length
}

const Avatar = ({ name, size = 'sm' }: AvatarProps) => {
  const initials = getInitials(name)
  const color = AVATAR_COLORS[getColorIndex(name)]
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'

  return (
    <span
      className={[
        'inline-flex items-center justify-center rounded-full font-bold flex-shrink-0',
        color.bg,
        color.text,
        sizeClass,
      ].join(' ')}
    >
      {initials}
    </span>
  )
}

export default Avatar
