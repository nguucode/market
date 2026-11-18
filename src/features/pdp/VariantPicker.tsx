// US-PDP-003: option-box picker, one radiogroup per dimension. Reused by the cart's "change variant" sheet.
import { useState, type KeyboardEvent } from 'react'
import { cx } from '@/components/ui'
import type { Product } from '@/domain/types'
import { skusOf, useWorld } from '@/app/store'
import { availableOptions, emptySelection, resolveSku, toggle, type Selection } from './variants'

export { LOW_STOCK, resolveSku, optionState, availableOptions, selectionOf, emptySelection, type Selection } from './variants'

/** Selection state shared by the inline picker and the variant sheet. */
export function useSkuSelection(product: Product, initial?: Selection) {
  const w = useWorld()
  const skus = skusOf(w, product.id)
  const [sel, setSel] = useState<Selection>(() => initial ?? emptySelection(product.dimensions))
  return { sel, setSel, skus, sku: resolveSku(skus, sel) }
}

export function VariantPicker({ product, value, onChange, onPreview, className, rows }: {
  product: Product
  value: Selection
  onChange: (sel: Selection) => void
  /** Web hover on a first-dimension option with an image (gallery preview); undefined on leave. */
  onPreview?: (image: string | undefined) => void
  className?: string
  /** Web PDP: each dimension as a row with the name in the 88px label column. */
  rows?: boolean
}) {
  const w = useWorld()
  const skus = skusOf(w, product.id)
  if (product.dimensions.length === 0) return null
  const states = availableOptions(product.dimensions, skus, value)

  return (
    <div className={cx('space-y-4', className)}>
      {product.dimensions.map((dim, d) => {
        const picked = dim.options.find((o) => o.id === value[d])
        const labelId = `vp-${product.id}-${dim.id}`
        const enabledIdx = dim.options.map((_, i) => i).filter((i) => states[d][i].enabled)
        const tabStop = picked && states[d][dim.options.indexOf(picked)].enabled ? dim.options.indexOf(picked) : enabledIdx[0]
        const move = (e: KeyboardEvent<HTMLElement>, from: number) => {
          const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
          if (!step || enabledIdx.length === 0) return
          e.preventDefault()
          const pos = enabledIdx.indexOf(from)
          const next = enabledIdx[(pos + step + enabledIdx.length) % enabledIdx.length]
          e.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role=radio]')[next]?.focus()
        }
        return (
          <div key={dim.id} className={cx(rows && 'flex gap-3')}>
            {rows ? <p id={labelId} className="w-[88px] shrink-0 pt-2 text-[13px] text-muted">{dim.name}</p> : (
              <p id={labelId} className="mb-2 text-[13px] text-ink-2">
                {picked ? <>{dim.name}: <span className="font-semibold text-ink">{picked.label}</span></> : <>Chọn {dim.name}</>}
              </p>
            )}
            <div role="radiogroup" aria-labelledby={labelId} className="flex min-w-0 flex-1 flex-wrap gap-2">
              {dim.options.map((o, i) => {
                const st = states[d][i]
                const on = value[d] === o.id
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-disabled={!st.enabled || undefined}
                    aria-label={st.enabled ? o.label : `${o.label}, hết hàng`}
                    title={o.label}
                    tabIndex={st.enabled && i === tabStop ? 0 : -1}
                    onClick={() => st.enabled && onChange(toggle(value, d, o.id))}
                    onKeyDown={(e) => move(e, i)}
                    onMouseEnter={d === 0 && o.image && onPreview ? () => onPreview(o.image) : undefined}
                    onMouseLeave={d === 0 && o.image && onPreview ? () => onPreview(undefined) : undefined}
                    className={cx(
                      'inline-flex h-11 max-w-[220px] items-center gap-2 rounded-[var(--radius-control)] px-3 text-[13px] lg:h-9',
                      o.image && 'pl-1',
                      on ? 'bg-accent-soft font-medium text-accent-ink ring-2 ring-inset ring-accent' : 'bg-surface ring-1 ring-inset ring-line-strong hover:ring-accent',
                      !st.enabled && 'cursor-not-allowed bg-well text-muted line-through decoration-muted/70 ring-line hover:ring-line',
                    )}
                  >
                    {o.image && <img src={o.image} alt="" className={cx('size-9 shrink-0 rounded-[6px] bg-well object-contain mix-blend-multiply lg:size-7', !st.enabled && 'opacity-50')} />}
                    <span className="truncate">{o.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
