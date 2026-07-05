const SUFIJOS = ['', 'ro', 'do', 'ro', 'to', 'to', 'to']

export function formatGrado(grado: string): string {
  const num = parseInt(grado, 10)
  if (isNaN(num) || num < 1 || num > 6) return grado
  return `${num}${SUFIJOS[num]}`
}

export function unformatGrado(grado: string): string {
  const match = grado.match(/^(\d+)/)
  return match ? match[1] : grado
}
