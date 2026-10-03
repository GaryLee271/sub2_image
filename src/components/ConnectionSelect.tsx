import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDownIcon } from './icons'
import PlatformIcon from './PlatformIcon'

export interface ConnectionOption {
  value: string
  label: string
  platform?: string
  group?: string
  description?: string
  rate?: number
  userRate?: number
}

export default function ConnectionSelect({ label, value, options, disabled, placeholder, onChange }: {
  label: string
  value: string
  options: ConnectionOption[]
  disabled?: boolean
  placeholder: string
  onChange: (value: string) => void
}) {
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const [position, setPosition] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null)
  const [query, setQuery] = useState('')
  const selected = options.find((option) => option.value === value)
  const filtered = options.filter((option) => `${option.label} ${option.group ?? ''} ${option.description ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  function close(focus = false) { setPosition(null); if (focus) trigger.current?.focus() }
  function open() {
    if (disabled) return
    const rect = trigger.current!.getBoundingClientRect()
    const width = Math.min(Math.max(rect.width, 360), window.innerWidth - 24)
    setQuery('')
    setPosition({ left: Math.min(rect.left, window.innerWidth - width - 12), top: rect.bottom + 8, width, maxHeight: Math.min(440, window.innerHeight - rect.bottom - 20) })
  }
  useEffect(() => {
    if (!position) return
    search.current?.focus()
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) close()
    }
    const resize = () => close()
    document.addEventListener('pointerdown', outside)
    window.addEventListener('resize', resize)
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', resize) }
  }, [position])
  useEffect(() => { if (disabled) setPosition(null) }, [disabled])
  return <>
    <button ref={trigger} type="button" role="combobox" aria-label={label} aria-expanded={Boolean(position)} aria-controls={position ? id : undefined} aria-haspopup="listbox" disabled={disabled}
      onClick={() => position ? close() : open()}
      onKeyDown={(event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open() } }}
      className="flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm transition hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-500">
      {selected?.platform && <span className={selected.platform === 'openai' ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-200'}><PlatformIcon platform={selected.platform} /></span>}
      <span className="min-w-0 flex-1 truncate text-left" title={selected?.label}>{selected?.label ?? placeholder}</span>
      {selected?.group && <span className="hidden max-w-[40%] truncate rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-300 sm:block">{selected.group}</span>}
      <ChevronDownIcon className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${position ? 'rotate-180' : ''}`} />
    </button>
    {position && createPortal(<div ref={menu} className="fixed z-[150] flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800" style={position}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); close(true) }
        if (event.key === 'Tab') close()
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          const elements = Array.from(menu.current!.querySelectorAll<HTMLButtonElement>('[role="option"]'))
          const current = elements.indexOf(document.activeElement as HTMLButtonElement)
          const next = event.key === 'ArrowDown' ? (current + 1) % elements.length : (current <= 0 ? elements.length - 1 : current - 1)
          elements[next]?.focus()
        }
      }}>
      <div className="border-b border-gray-100 p-3 dark:border-gray-700">
        <input ref={search} aria-label={`搜索${label}`} placeholder={`搜索${label === '选择密钥' ? '密钥、分组或说明' : '模型'}`} value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-teal-500/30 dark:bg-gray-900 dark:text-gray-100" />
      </div>
      <div id={id} role="listbox" aria-label={label} className="min-h-0 overflow-y-auto p-1.5">
        {filtered.map((option) => {
          const active = option.value === value
          const badge = option.platform === 'openai' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400'
          return <button key={option.value} role="option" aria-selected={active} tabIndex={-1} onClick={() => { onChange(option.value); close(true) }}
            className={`flex w-full items-start gap-3 rounded-lg p-3 text-left outline-none transition focus:bg-teal-50 dark:focus:bg-teal-900/20 ${active ? 'bg-teal-50/70 dark:bg-teal-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/60'}`}>
            <div className="min-w-0 flex-1">
              <div className="break-words text-sm font-medium text-gray-900 dark:text-gray-100">{option.label}</div>
              {option.group && <div className={`mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${badge}`}><PlatformIcon platform={option.platform ?? ''} /><span className="truncate">{option.group}</span></div>}
              {option.description && <p className="mt-1.5 whitespace-pre-line break-words text-xs leading-relaxed text-gray-500 dark:text-gray-400">{option.description}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2 pt-0.5">
              {option.rate != null && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}>
                {option.userRate != null && option.userRate !== option.rate && <span className="mr-1 line-through opacity-50">{option.rate}x</span>}
                {option.userRate ?? option.rate}x 倍率
              </span>}
              {active && <span aria-hidden="true" className="text-teal-600 dark:text-teal-400">✓</span>}
            </div>
          </button>
        })}
        {!filtered.length && <p className="p-4 text-center text-sm text-gray-500">无匹配选项</p>}
      </div>
    </div>, document.body)}
  </>
}
