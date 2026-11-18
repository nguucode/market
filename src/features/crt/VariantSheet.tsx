// US-CRT-003 variant edit: reuses the product page's chip picker.
import { useState } from 'react'
import { changeSku, getState, setSelected, skusOf, unitPrice, useNow, useWorld, type LineView } from '@/app/store'
import { Button, Img, Sheet, toast, vnd } from '@/components/ui'
import { resolveSku, selectionOf, VariantPicker } from '@/features/pdp/VariantPicker'

export function VariantSheet({ view, onClose }: { view: LineView | null; onClose: () => void }) {
  return (
    <Sheet open={!!view} onOpenChange={(o) => !o && onClose()} title="Chọn phân loại">
      {view && <Chooser key={view.line.id} view={view} onClose={onClose} />}
    </Sheet>
  )
}

function Chooser({ view, onClose }: { view: LineView; onClose: () => void }) {
  const w = useWorld()
  const t = useNow()
  const p = view.product
  const skus = skusOf(w, p.id)
  const [sel, setSel] = useState(() => selectionOf(view.sku))
  const chosen = resolveSku(skus, sel)
  const u = chosen && unitPrice(w, chosen, t)
  const gone = !!chosen && chosen.stock <= 0
  const confirm = () => {
    if (!chosen || gone) return
    if (chosen.id !== view.sku.id) {
      const dup = getState().world.cart.find((l) => l.skuId === chosen.id && l.id !== view.line.id)
      changeSku(view.line.id, chosen.id, view.line.qty)
      setSelected([dup?.id ?? view.line.id], true)
      if (dup) toast('Đã gộp với sản phẩm cùng phân loại trong giỏ')
    }
    onClose()
  }
  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <Img src={chosen?.image ?? view.sku.image ?? p.images[0]} alt={p.name} className="aspect-[4/5] w-20 shrink-0 rounded-[var(--radius-media)]" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-[14px]">{p.name}</p>
          {u ? (
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <span className={u.before && u.before > u.price ? 'tabular font-bold text-jade' : 'tabular font-bold'}>{vnd(u.price)}</span>
              {u.before && u.before > u.price && <s className="tabular text-[13px] text-muted">{vnd(u.before)}</s>}
            </p>
          ) : <p className="mt-1 text-[13px] text-muted">Chọn đủ phân loại để xem giá</p>}
          {chosen && !gone && <p className="mt-0.5 text-[12px] text-muted">Còn {chosen.stock} sản phẩm</p>}
        </div>
      </div>
      <VariantPicker product={p} value={sel} onChange={setSel} />
      {gone && <p className="text-[13px] text-ink-2" role="alert">Phân loại này vừa hết hàng</p>}
      <Button full size="lg" disabled={!chosen || gone} onClick={confirm}>Xác nhận</Button>
    </div>
  )
}
