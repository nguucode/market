// US-PRM-002 / US-PRM-003: "Kho voucher" with tabs, saved before claimable, and the conditions sheet (also via ?voucher=).
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useNow, useWorld } from '@/app/store'
import { Button, ButtonLink, EmptyState, PageTitle, Skeleton, Tabs, useLoaded } from '@/components/ui'
import { VoucherConditionsSheet, VoucherTile } from './VoucherTile'
import { HUB_TABS, hubList, voucherTileState, type HubTab } from './vouchers'

const PAGE = 20

export default function VouchersPage() {
  const w = useWorld()
  const t = useNow()
  const ready = useLoaded()
  const [sp, setSp] = useSearchParams()
  const raw = sp.get('tab')
  const tab: HubTab = HUB_TABS.some((x) => x.id === raw) ? (raw as HubTab) : 'all'
  const [shown, setShown] = useState({ tab, n: PAGE })
  const n = shown.tab === tab ? shown.n : PAGE
  const items = hubList(w.vouchers, w.savedVouchers, tab, t)

  // Deep link ?voucher={id}: open the sheet, or say it is no longer valid.
  const vid = sp.get('voucher')
  const deep = vid ? w.vouchers.find((v) => v.id === vid) : undefined
  const deepValid = !!deep && voucherTileState(deep, w.savedVouchers.find((s) => s.voucherId === deep.id), t) !== 'expired'
  const closeDeep = () => setSp((p) => { p.delete('voucher'); return p }, { replace: true })

  // Keep the selected tab in view on narrow screens.
  const tabsRef = useRef<HTMLDivElement>(null)
  useEffect(() => { tabsRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }) }, [tab])

  return (
    <div className="mx-auto max-w-[960px] pb-8">
      <PageTitle className="mb-2 max-lg:sr-only lg:mb-4 lg:text-[36px]!">Kho voucher</PageTitle>
      <div ref={tabsRef} className="sticky top-14 z-30 -mx-4 bg-ground px-4 lg:static lg:mx-0 lg:px-0">
        <Tabs label="Loại voucher" value={tab} items={HUB_TABS.map((x) => ({ id: x.id, label: x.label }))}
          onChange={(id) => setSp((p) => { p.set('tab', id); p.delete('voucher'); return p }, { replace: true })} />
      </div>
      {vid && !deepValid && <p role="status" className="mt-4 rounded-[10px] bg-well px-4 py-3 text-[14px] text-ink-2">Voucher không còn hiệu lực.</p>}
      <div role="tabpanel" aria-label={HUB_TABS.find((x) => x.id === tab)!.label} className="mt-4">
        {!ready ? (
          <ul role="list" aria-busy="true" aria-label="Đang tải" className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => <li key={i}><Skeleton className="h-[132px] w-full rounded-[12px]" /></li>)}
          </ul>
        ) : items.length === 0 ? (
          tab === 'expiring' ? <EmptyState title="Không có voucher nào sắp hết hạn." />
            : <EmptyState title="Bạn chưa có voucher nào ở đây." action={tab === 'all' && <ButtonLink to="/">Khám phá sản phẩm</ButtonLink>} />
        ) : (
          <>
            <ul role="list" className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {items.slice(0, n).map(({ voucher }) => <li key={voucher.id}><VoucherTile voucher={voucher} className="h-full" /></li>)}
            </ul>
            {items.length > n && (
              <div className="mt-6 flex justify-center">
                <Button variant="secondary" className="w-full lg:w-auto lg:min-w-[240px]" onClick={() => setShown({ tab, n: n + PAGE })}>Xem thêm</Button>
              </div>
            )}
          </>
        )}
      </div>
      {deep && deepValid && <VoucherConditionsSheet voucher={deep} open onOpenChange={(o) => { if (!o) closeDeep() }} />}
    </div>
  )
}
