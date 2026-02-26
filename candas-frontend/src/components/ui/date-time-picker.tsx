/**
 * Componente estándar del proyecto para selección de fecha y fecha/hora.
 * Un solo diseño y comportamiento en toda la app.
 *
 * Cuándo usar cada export:
 * - Solo fecha (rangos, filtros, "fecha de"): DatePickerForm — value/onChange string YYYY-MM-DD.
 * - Fecha y hora en formularios: DateTimePickerForm — value/onChange string ISO local (YYYY-MM-DDTHH:mm).
 * - Fecha/hora con estado local (sin react-hook-form): DateTimePicker — value/onChange Date | null.
 *
 * En modales/dialogs se recomienda inline={true} para evitar problemas de z-index/portal.
 * Placeholders por defecto: "dd/mm/aaaa" (date), "dd/mm/aaaa hh:mm" (datetime).
 */
import * as React from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const WEEKDAYS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO']
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function formatDisplay(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${h}:${m}`
}

function formatDisplayDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function toISOLocal(d: Date): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${day}T${h}:${mi}`
}

/** Returns YYYY-MM-DD for date-only form values. */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

function getCalendarGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const firstWeekday = (first.getDay() + 6) % 7 // Monday = 0
  const start = new Date(year, month, 1 - firstWeekday)
  const grid: Date[] = []
  for (let i = 0; i < 42; i++) {
    grid.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }
  return grid
}

export interface DateTimePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
  minDate?: Date
  maxDate?: Date
  /** Cuando true, el panel se renderiza dentro del DOM (debajo del trigger) en lugar de en un portal. Uso recomendado dentro de modales. */
  inline?: boolean
  /** 'datetime' muestra calendario + hora; 'date' solo calendario (hora 00:00:00). */
  mode?: 'date' | 'datetime'
  title?: string
}

export function DateTimePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  id,
  className,
  minDate,
  maxDate,
  inline = false,
  mode = 'datetime',
  title,
}: DateTimePickerProps) {
  const defaultPlaceholder = mode === 'date' ? 'dd/mm/aaaa' : 'dd/mm/aaaa hh:mm'
  const resolvedPlaceholder = placeholder ?? defaultPlaceholder
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [panelPosition, setPanelPosition] = React.useState({ top: 0, left: 0, width: 380 })
  const [inlineOpenAbove, setInlineOpenAbove] = React.useState(false)
  const [usePortalForInline, setUsePortalForInline] = React.useState(false)
  const PANEL_HEIGHT_ESTIMATE = 420
  const INLINE_PANEL_HEIGHT_ESTIMATE = 280
  const PANEL_WIDTH = 380

  React.useLayoutEffect(() => {
    if (inline && open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom - 12
      let openAbove = spaceBelow < INLINE_PANEL_HEIGHT_ESTIMATE
      let usePortal = false
      let p: HTMLElement | null = triggerRef.current.parentElement
      while (p && p !== document.body) {
        const s = getComputedStyle(p)
        if (s.overflow !== 'visible' || s.overflowY !== 'visible') {
          openAbove = true
          usePortal = true
          break
        }
        p = p.parentElement
      }
      setInlineOpenAbove(openAbove)
      setUsePortalForInline(usePortal)
      if (usePortal) {
        const viewportW = window.innerWidth
        const panelW = Math.min(PANEL_WIDTH, viewportW * 0.9)
        const spaceBelowV = window.innerHeight - rect.bottom - 8
        const spaceAboveV = rect.top - 8
        const openAbovePos = spaceBelowV < INLINE_PANEL_HEIGHT_ESTIMATE && spaceAboveV >= spaceBelowV
        const top = openAbovePos
          ? Math.max(8, rect.top - INLINE_PANEL_HEIGHT_ESTIMATE - 4)
          : rect.bottom + 4
        let left = rect.left
        if (left + panelW > viewportW - 8) left = Math.max(8, viewportW - panelW - 8)
        if (left < 8) left = 8
        setPanelPosition({ top, left, width: panelW })
      }
    }
  }, [inline, open])

  React.useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    if (inline && !usePortalForInline) return
    const rect = triggerRef.current.getBoundingClientRect()
    const viewportH = window.innerHeight
    const viewportW = window.innerWidth
    const panelW = Math.min(PANEL_WIDTH, viewportW * 0.9)
    const panelH = inline ? INLINE_PANEL_HEIGHT_ESTIMATE : PANEL_HEIGHT_ESTIMATE
    const spaceBelow = viewportH - rect.bottom - 8
    const spaceAbove = rect.top - 8
    const openAbove = spaceBelow < panelH && spaceAbove >= spaceBelow
    const top = openAbove
      ? Math.max(8, rect.top - panelH - 4)
      : rect.bottom + 4
    let left = rect.left
    if (left + panelW > viewportW - 8) left = Math.max(8, viewportW - panelW - 8)
    if (left < 8) left = 8
    setPanelPosition({ top, left, width: panelW })
  }, [inline, open, usePortalForInline])

  const dateValue = value == null ? null : value

  const [viewDate, setViewDate] = React.useState(() => dateValue ?? new Date())
  React.useEffect(() => {
    if (dateValue) setViewDate(dateValue)
    else if (!open) setViewDate(new Date())
  }, [dateValue?.getTime(), open])
  const viewYear = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth()

  const handleSelectDate = (d: Date) => {
    const base = dateValue ?? new Date()
    const hour = mode === 'date' ? 0 : base.getHours()
    const minute = mode === 'date' ? 0 : base.getMinutes()
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute, 0, 0)
    onChange(next)
    setViewDate(next)
  }

  const handleSelectTime = (hour: number, minute: number) => {
    const base = dateValue ?? new Date()
    const next = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour, minute, 0, 0)
    onChange(next)
  }

  const handleClear = () => {
    onChange(null)
    setOpen(false)
  }

  const handleToday = () => {
    const now = new Date()
    const next = mode === 'date' ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0) : now
    onChange(next)
    setViewDate(next)
  }

  React.useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      const inTrigger = triggerRef.current?.contains(target)
      const inPanel = panelRef.current?.contains(target)
      const inPanelByData = (target as Element)?.closest?.('[data-datepicker-panel]') != null ||
        (document.querySelector('[data-datepicker-panel]')?.contains(target) ?? false)
      if (!inTrigger && !inPanel && !inPanelByData) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick, inline && !usePortalForInline ? false : true)
    return () => document.removeEventListener('mousedown', onDocClick, inline && !usePortalForInline ? false : true)
  }, [open, inline, usePortalForInline])

  const displayText = dateValue ? (mode === 'date' ? formatDisplayDate(dateValue) : formatDisplay(dateValue)) : resolvedPlaceholder
  const grid = getCalendarGrid(viewYear, viewMonth)

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)
  const selectedHour = dateValue?.getHours() ?? 0
  const selectedMinute = dateValue?.getMinutes() ?? 0

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  const isCurrentMonth = (d: Date) => d.getMonth() === viewMonth
  const isToday = (d: Date) => {
    const t = new Date()
    return isSameDay(d, t)
  }

  return (
    <div ref={containerRef} className="relative w-full overflow-visible">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        title={title}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center justify-between rounded-md border border-border bg-transparent px-3 py-1 text-sm text-left transition-colors h-9',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !dateValue && 'text-muted-foreground',
          className
        )}
      >
        <span className="truncate">{displayText}</span>
        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && inline && !usePortalForInline && (
        <div
          ref={panelRef}
          data-datepicker-panel
          className={cn(
            'absolute left-0 z-[9999] w-full min-w-[320px] max-w-[min(380px,90vw)] rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col isolate',
            inlineOpenAbove ? 'bottom-full mb-2' : 'top-full mt-2'
          )}
          role="dialog"
          aria-label="Selector de fecha y hora"
        >
          <div className="shrink-0 p-2 border-b border-border/50 flex items-center justify-between gap-2 bg-muted/20">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{mode === 'date' ? 'Fecha Seleccionada' : 'Fecha y Hora Seleccionada'}</span>
              <span className="text-xs font-semibold">
                {dateValue ? (mode === 'date' ? formatDisplayDate(dateValue) : formatDisplay(dateValue)) : '—'}
              </span>
            </div>
            <Calendar className="h-3.5 w-3.5 shrink-0 text-primary opacity-80" />
          </div>
          <div className={cn('flex h-[232px]', mode === 'date' && 'flex-row')}>
            <div className={cn('flex-1 p-2 flex flex-col min-w-0', mode === 'datetime' && 'border-r border-border/50')}>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold text-foreground capitalize px-1">
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setViewDate(new Date(viewYear, viewMonth - 1, 1))}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                  >
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewDate(new Date(viewYear, viewMonth + 1, 1))}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                  >
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-[9px] font-bold text-muted-foreground/60 mb-0.5">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="h-3.5 flex items-center justify-center">{w}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5 flex-1 min-h-0">
                {grid.map((d, i) => {
                  const isOther = !isCurrentMonth(d)
                  const selected = dateValue && isSameDay(d, dateValue)
                  const today = isToday(d)
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectDate(d)}
                      className={cn(
                        'h-5 w-full rounded-md text-[10px] font-medium transition-all duration-200',
                        isOther && 'text-muted-foreground/30',
                        selected && 'bg-primary text-primary-foreground shadow-sm scale-105',
                        !selected && !isOther && 'hover:bg-muted hover:text-foreground',
                        today && !selected && 'ring-1 ring-primary/40 text-primary'
                      )}
                    >
                      {d.getDate()}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-1 mt-1.5 pt-1.5 border-t border-border/50 shrink-0">
                <Button type="button" variant="ghost" size="sm" className="flex-1 text-[10px] font-bold h-6 uppercase tracking-tight" onClick={handleClear}>Borrar</Button>
                <Button type="button" variant="secondary" size="sm" className="flex-1 text-[10px] font-bold h-6 uppercase tracking-tight" onClick={handleToday}>Hoy</Button>
              </div>
            </div>
            {mode === 'datetime' && (
            <div className="w-[100px] flex gap-0.5 p-1 bg-muted/10 shrink-0">
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="text-[9px] font-bold text-center py-1 text-muted-foreground uppercase border-b border-border/30">H</div>
                <div className="flex-1 overflow-y-auto scrollbar-none hover:scrollbar-thin py-1 px-0.5 space-y-0.5 min-h-0">
                  {hours.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleSelectTime(h, selectedMinute)}
                      className={cn(
                        'w-full py-1 text-center text-[10px] rounded font-bold transition-all',
                        selectedHour === h ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'
                      )}
                    >
                      {String(h).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-px bg-border/30 my-2" />
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="text-[9px] font-bold text-center py-1 text-muted-foreground uppercase border-b border-border/30">M</div>
                <div className="flex-1 overflow-y-auto scrollbar-none hover:scrollbar-thin py-1 px-0.5 space-y-0.5 min-h-0">
                  {minutes.filter(m => m % 1 === 0).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectTime(selectedHour, m)}
                      className={cn(
                        'w-full py-1 text-center text-[10px] rounded font-bold transition-all',
                        selectedMinute === m ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'
                      )}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {open && inline && usePortalForInline &&
        createPortal(
          <div
            ref={panelRef}
            data-datepicker-panel
            className="fixed z-[9999] rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col pointer-events-auto w-full min-w-[320px] max-w-[min(380px,90vw)]"
            style={{ top: panelPosition.top, left: panelPosition.left, width: panelPosition.width, maxWidth: '90vw' }}
            role="dialog"
            aria-label="Selector de fecha y hora"
          >
            <div className="shrink-0 p-2 border-b border-border/50 flex items-center justify-between gap-2 bg-muted/20">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{mode === 'date' ? 'Fecha Seleccionada' : 'Fecha y Hora Seleccionada'}</span>
                <span className="text-xs font-semibold">
                  {dateValue ? (mode === 'date' ? formatDisplayDate(dateValue) : formatDisplay(dateValue)) : '—'}
                </span>
              </div>
              <Calendar className="h-3.5 w-3.5 shrink-0 text-primary opacity-80" />
            </div>
            <div className={cn('flex h-[232px]', mode === 'date' && 'flex-row')}>
              <div className={cn('flex-1 p-2 flex flex-col min-w-0', mode === 'datetime' && 'border-r border-border/50')}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-foreground capitalize px-1">
                    {MONTHS[viewMonth]} {viewYear}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={() => setViewDate(new Date(viewYear, viewMonth - 1, 1))} className="p-1 rounded-md hover:bg-muted transition-colors">
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button type="button" onClick={() => setViewDate(new Date(viewYear, viewMonth + 1, 1))} className="p-1 rounded-md hover:bg-muted transition-colors">
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-[9px] font-bold text-muted-foreground/60 mb-0.5">
                  {WEEKDAYS.map((w) => (
                    <div key={w} className="h-3.5 flex items-center justify-center">{w}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5 flex-1 min-h-0">
                  {grid.map((d, i) => {
                    const isOther = !isCurrentMonth(d)
                    const selected = dateValue && isSameDay(d, dateValue)
                    const today = isToday(d)
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectDate(d)}
                        className={cn(
                          'h-5 w-full rounded-md text-[10px] font-medium transition-all duration-200',
                          isOther && 'text-muted-foreground/30',
                          selected && 'bg-primary text-primary-foreground shadow-sm scale-105',
                          !selected && !isOther && 'hover:bg-muted hover:text-foreground',
                          today && !selected && 'ring-1 ring-primary/40 text-primary'
                        )}
                      >
                        {d.getDate()}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-1 mt-1.5 pt-1.5 border-t border-border/50 shrink-0">
                  <Button type="button" variant="ghost" size="sm" className="flex-1 text-[10px] font-bold h-6 uppercase tracking-tight" onClick={handleClear}>Borrar</Button>
                  <Button type="button" variant="secondary" size="sm" className="flex-1 text-[10px] font-bold h-6 uppercase tracking-tight" onClick={handleToday}>Hoy</Button>
                </div>
              </div>
              {mode === 'datetime' && (
              <div className="w-[100px] flex gap-0.5 p-1 bg-muted/10 shrink-0">
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="text-[9px] font-bold text-center py-1 text-muted-foreground uppercase border-b border-border/30">H</div>
                  <div className="flex-1 overflow-y-auto scrollbar-none hover:scrollbar-thin py-1 px-0.5 space-y-0.5 min-h-0">
                    {hours.map((h) => (
                      <button key={h} type="button" onClick={() => handleSelectTime(h, selectedMinute)} className={cn('w-full py-1 text-center text-[10px] rounded font-bold transition-all', selectedHour === h ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground')}>
                        {String(h).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-px bg-border/30 my-2" />
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="text-[9px] font-bold text-center py-1 text-muted-foreground uppercase border-b border-border/30">M</div>
                  <div className="flex-1 overflow-y-auto scrollbar-none hover:scrollbar-thin py-1 px-0.5 space-y-0.5 min-h-0">
                    {minutes.filter(m => m % 1 === 0).map((m) => (
                      <button key={m} type="button" onClick={() => handleSelectTime(selectedHour, m)} className={cn('w-full py-1 text-center text-[10px] rounded font-bold transition-all', selectedMinute === m ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground')}>
                        {String(m).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {open && !inline &&
        createPortal(
          <div
            ref={panelRef}
            data-datepicker-panel
            className="fixed z-[9999] rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col pointer-events-auto"
            style={{ top: panelPosition.top, left: panelPosition.left, width: panelPosition.width, maxWidth: '90vw' }}
            role="dialog"
            aria-label="Selector de fecha y hora"
          >
            <div className="p-3.5 border-b border-border/50 flex items-center justify-between gap-2 bg-muted/20">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{mode === 'date' ? 'Fecha Seleccionada' : 'Fecha y Hora Seleccionada'}</span>
                <span className="text-sm font-semibold">
                  {dateValue ? (mode === 'date' ? formatDisplayDate(dateValue) : formatDisplay(dateValue)) : '—'}
                </span>
              </div>
              <Calendar className="h-4 w-4 shrink-0 text-primary opacity-80" />
            </div>
            <div className={cn('flex h-[377px]', mode === 'date' && 'flex-row')}>
              <div className={cn('flex-1 p-4 flex flex-col h-[377px]', mode === 'datetime' && 'border-r border-border/50')}>
                <div className="flex items-center justify-between gap-1 mb-4">
                  <span className="text-xs font-bold text-foreground capitalize px-1">
                    {MONTHS[viewMonth]} {viewYear}
                  </span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setViewDate(new Date(viewYear, viewMonth - 1, 1))} className="p-1.5 rounded-md hover:bg-muted transition-colors">
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button type="button" onClick={() => setViewDate(new Date(viewYear, viewMonth + 1, 1))} className="p-1.5 rounded-md hover:bg-muted transition-colors">
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-[9px] font-bold text-muted-foreground/60 mb-2">
                  {WEEKDAYS.map((w) => (
                    <div key={w} className="h-5 flex items-center justify-center">{w}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 flex-1">
                  {grid.map((d, i) => {
                    const isOther = !isCurrentMonth(d)
                    const selected = dateValue && isSameDay(d, dateValue)
                    const today = isToday(d)
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectDate(d)}
                        className={cn(
                          'h-8 w-full rounded-md text-xs font-medium transition-all duration-200',
                          isOther && 'text-muted-foreground/30',
                          selected && 'bg-primary text-primary-foreground shadow-md scale-105',
                          !selected && !isOther && 'hover:bg-muted hover:text-foreground',
                          today && !selected && 'ring-1 ring-primary/40 text-primary'
                        )}
                      >
                        {d.getDate()}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
                  <Button type="button" variant="ghost" size="sm" className="flex-1 text-[10px] font-bold h-8 uppercase tracking-tight" onClick={handleClear}>Borrar</Button>
                  <Button type="button" variant="secondary" size="sm" className="flex-1 text-[10px] font-bold h-8 uppercase tracking-tight" onClick={handleToday}>Hoy</Button>
                </div>
              </div>
              {mode === 'datetime' && (
              <div className="w-[120px] flex gap-0.5 p-1 bg-muted/10">
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="text-[9px] font-bold text-center py-2 text-muted-foreground uppercase border-b border-border/30">H</div>
                  <div className="flex-1 overflow-y-auto scrollbar-none hover:scrollbar-thin py-2 px-1 space-y-0.5">
                    {hours.map((h) => (
                      <button key={h} type="button" onClick={() => handleSelectTime(h, selectedMinute)} className={cn('w-full py-1.5 text-center text-[10px] rounded-md font-bold transition-all', selectedHour === h ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground')}>
                        {String(h).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-[1px] bg-border/30 my-4" />
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="text-[9px] font-bold text-center py-2 text-muted-foreground uppercase border-b border-border/30">M</div>
                  <div className="flex-1 overflow-y-auto scrollbar-none hover:scrollbar-thin py-2 px-1 space-y-0.5">
                    {minutes.filter(m => m % 1 === 0).map((m) => (
                      <button key={m} type="button" onClick={() => handleSelectTime(selectedHour, m)} className={cn('w-full py-1.5 text-center text-[10px] rounded-md font-bold transition-all', selectedMinute === m ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground')}>
                        {String(m).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

/** Use with react-hook-form Controller: value/onChange are ISO local string (YYYY-MM-DDTHH:mm). */
export function DateTimePickerForm({
  value,
  onChange,
  ...rest
}: Omit<DateTimePickerProps, 'value' | 'onChange'> & {
  value: string
  onChange: (v: string) => void
}) {
  const date = value ? new Date(value) : null
  const handleChange = (d: Date | null) => {
    onChange(d ? toISOLocal(d) : '')
  }
  return <DateTimePicker value={date} onChange={handleChange} {...rest} />
}

/** Use for date-only fields: value/onChange are YYYY-MM-DD string. Replaces native type="date". */
export function DatePickerForm({
  value,
  onChange,
  ...rest
}: Omit<DateTimePickerProps, 'value' | 'onChange' | 'mode'> & {
  value: string
  onChange: (v: string) => void
}) {
  const date = value ? new Date(value + 'T00:00:00') : null
  const handleChange = (d: Date | null) => {
    onChange(d ? toISODate(d) : '')
  }
  return <DateTimePicker value={date} onChange={handleChange} mode="date" {...rest} />
}

export { toISOLocal }
