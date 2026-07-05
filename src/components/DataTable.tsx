import { useEffect, useState, type ReactNode } from 'react'
import {
  Search,
  Filter,
  X,
  Inbox,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import EmptyState from './EmptyState'

export interface DataTableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
  headerClassName?: string
  hideOnMobile?: boolean
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string

  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string

  filters?: ReactNode
  filtersActive?: boolean

  loading?: boolean

  emptyIcon?: LucideIcon
  emptyTitle: string
  emptyDescription?: string
  emptyAction?: ReactNode

  mobileCard?: (row: T) => ReactNode

  onRowClick?: (row: T) => void

  countLabel?: (count: number) => string

  pagination?: boolean
  defaultPageSize?: number
  pageSizeOptions?: number[]
}

type PageItem = number | 'ellipsis'

const SKELETON_WIDTHS = ['w-3/4', 'w-full', 'w-1/2', 'w-2/3', 'w-1/3']

function getPageNumbers(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: PageItem[] = [1]

  if (current > 3) pages.push('ellipsis')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('ellipsis')

  pages.push(total)
  return pages
}

function DataTable<T,>({
  columns,
  data,
  rowKey,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  filtersActive = false,
  loading = false,
  emptyIcon = Inbox,
  emptyTitle,
  emptyDescription,
  emptyAction,
  mobileCard,
  onRowClick,
  countLabel,
  pagination = true,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 50],
}: DataTableProps<T>) {
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const hasFilters = !!filters
  const visibleMobileColumns = columns.filter((c) => !c.hideOnMobile)

  useEffect(() => {
    setPage(1)
  }, [searchValue])

  const totalItems = data.length
  const totalPages = pagination ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1
  const safePage = Math.min(page, totalPages)
  const startIdx = (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, totalItems)
  const pagedData = pagination ? data.slice(startIdx, startIdx + pageSize) : data
  const showPager = pagination && totalItems > pageSizeOptions[0]

  const navBtnBase =
    'flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-all duration-150 active:scale-90 disabled:opacity-40 disabled:active:scale-100'
  const navBtnEnabled = 'text-text-secondary hover:border-primary hover:text-primary hover:bg-primary/5'
  const pageBtnBase =
    'flex h-10 min-w-10 items-center justify-center rounded-lg px-2.5 text-sm font-semibold transition-all duration-150 active:scale-90'

  return (
    <div className="flex flex-col gap-3">
      {/* ===== Toolbar ===== */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 shadow-card md:p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-lg border border-border bg-surface pl-10 pr-9 text-sm text-text-primary placeholder:text-text-muted transition-all duration-150 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 hover:border-primary/50"
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-alt hover:text-text-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {hasFilters && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={[
                'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border transition-all duration-150 active:scale-90',
                showFilters || filtersActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-text-muted hover:border-primary/50 hover:text-text-secondary',
              ].join(' ')}
            >
              <Filter className="h-4 w-4" />
            </button>
          )}
        </div>

        {hasFilters && showFilters && (
          <div className="flex flex-wrap gap-2">{filters}</div>
        )}
      </div>

      {/* ===== Count ===== */}
      {countLabel && (
        <p className="px-1 text-sm text-text-muted">{countLabel(totalItems)}</p>
      )}

      {/* ===== Content ===== */}
      {loading ? (
        <>
          {/* Skeleton — desktop */}
          <div className="hidden overflow-hidden rounded-xl border border-border shadow-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-alt">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {columns.map((col, j) => (
                      <td key={col.key} className="px-4 py-3.5">
                        <div
                          className={`h-4 animate-pulse rounded-md bg-surface-alt ${SKELETON_WIDTHS[j % SKELETON_WIDTHS.length]}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Skeleton — mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-surface p-4 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-surface-alt" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded-md bg-surface-alt" />
                    <div className="h-3 w-1/2 animate-pulse rounded-md bg-surface-alt" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : totalItems === 0 ? (
        <div className="rounded-xl border border-border bg-surface py-16 shadow-card">
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        </div>
      ) : (
        <>
          {/* ===== Desktop table ===== */}
          <div className="hidden overflow-hidden rounded-xl border border-border shadow-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-alt">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={[
                        'px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-muted',
                        col.headerClassName ?? '',
                      ].join(' ')}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedData.map((row, idx) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={[
                      'border-b border-border transition-colors duration-100 last:border-0',
                      idx % 2 === 1 ? 'bg-surface-alt/30' : '',
                      'hover:bg-primary/5',
                      onRowClick ? 'cursor-pointer' : '',
                    ].join(' ')}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={col.className ?? 'px-4 py-3 text-text-primary'}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ===== Mobile cards ===== */}
          <div className="flex flex-col gap-2.5 md:hidden">
            {mobileCard
              ? pagedData.map((row) => (
                  <div key={rowKey(row)} className="transition-transform duration-100 active:scale-[0.98]">
                    {mobileCard(row)}
                  </div>
                ))
              : pagedData.map((row) => (
                  <div
                    key={rowKey(row)}
                    className="rounded-xl border border-border bg-surface p-3.5 shadow-card transition-transform duration-100 active:scale-[0.98]"
                  >
                    {visibleMobileColumns.map((col, idx) => (
                      <div
                        key={col.key}
                        className={
                          idx === 0
                            ? 'font-semibold text-text-primary'
                            : 'mt-1.5 text-sm text-text-secondary'
                        }
                      >
                        {idx > 0 && (
                          <span className="text-text-muted">{col.header}: </span>
                        )}
                        {col.render(row)}
                      </div>
                    ))}
                  </div>
                ))}
          </div>

          {/* ===== Paginator ===== */}
          {showPager && (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-card">
              {/* Row 1: info + page size */}
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-text-muted">
                  Mostrando{' '}
                  <span className="font-semibold text-text-secondary">{startIdx + 1}</span>
                  {'–'}
                  <span className="font-semibold text-text-secondary">{endIdx}</span>
                  {' '}
                  de{' '}
                  <span className="font-semibold text-text-secondary">{totalItems}</span>
                  {' '}resultados
                </p>

                {/* Page size selector */}
                <div className="flex items-center gap-2">
                  <span className="hidden text-sm text-text-muted sm:inline">Filas:</span>
                  <div className="relative">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setPage(1)
                      }}
                      className="h-9 cursor-pointer appearance-none rounded-lg border border-border bg-surface pl-3 pr-8 text-sm font-medium text-text-secondary transition-all duration-150 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 hover:border-primary/50"
                    >
                      {pageSizeOptions.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  </div>
                </div>
              </div>

              {/* Row 2: navigation */}
              <div className="flex items-center justify-center gap-1">
                {/* First */}
                <button
                  onClick={() => setPage(1)}
                  disabled={safePage === 1}
                  className={`${navBtnBase} ${navBtnEnabled}`}
                  aria-label="Primera página"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                {/* Prev */}
                <button
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage === 1}
                  className={`${navBtnBase} ${navBtnEnabled}`}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Desktop: full page numbers */}
                <div className="hidden items-center gap-1 md:flex">
                  {getPageNumbers(safePage, totalPages).map((item, i) =>
                    item === 'ellipsis' ? (
                      <span
                        key={`e-${i}`}
                        className="flex h-10 min-w-10 items-center justify-center text-sm text-text-muted"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={[
                          pageBtnBase,
                          item === safePage
                            ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20'
                            : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
                        ].join(' ')}
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>

                {/* Mobile: pill indicator */}
                <div className="flex items-center gap-1.5 rounded-lg bg-surface-alt px-4 py-2 md:hidden">
                  <span className="text-sm font-bold text-primary">{safePage}</span>
                  <span className="text-sm text-text-muted">de</span>
                  <span className="text-sm font-medium text-text-secondary">{totalPages}</span>
                </div>

                {/* Next */}
                <button
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage === totalPages}
                  className={`${navBtnBase} ${navBtnEnabled}`}
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Last */}
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={safePage === totalPages}
                  className={`${navBtnBase} ${navBtnEnabled}`}
                  aria-label="Última página"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DataTable
