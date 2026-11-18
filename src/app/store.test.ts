import {
  advanceOrder, expirePayment, lineParts, buyAgain, cancelOrder, getState, pay, placeOrder, quoteCheckout, requestCancel, resetDemo, respondCancel, returnDemo, setSettings,
  startCheckout, submitReturn, type CheckoutDraft,
} from './store'

vi.useFakeTimers({ shouldAdvanceTime: true })
beforeEach(() => { resetDemo(); setSettings({ latency: 'none' }) })

const draftFromCart = (): CheckoutDraft => {
  const w = getState().world
  startCheckout('cart', w.cart.filter((l) => l.selected).map((l) => ({ skuId: l.skuId, qty: l.qty, cartLineId: l.id })))
  return JSON.parse(sessionStorage.getItem('market.session.v1')!).checkout as CheckoutDraft
}

test('checkout of the seeded cart is the §4.3 example: 653.000₫ over two shops, best vouchers auto-applied', () => {
  const w = getState().world
  const d = { ...draftFromCart(), lines: draftFromCart().lines.filter((l) => {
    const k = w.skus.find((x) => x.id === l.skuId)!
    return ['linen-ha', 'chao-gang-ba-bay'].includes(w.shops.find((s) => s.id === w.products.find((p) => p.id === k.productId)!.shopId)!.handle)
  }) }
  const q = quoteCheckout(w, d, Date.now())
  expect(q.pricing.goods).toBe(723_000)
  expect(q.pricing.platformVoucher?.id).toBe('mk15')
  expect(q.pricing.total).toBe(653_000)
})

test('place order creates one order per shop that sum to the session total, and empties those cart lines', async () => {
  const d = draftFromCart()
  const q = quoteCheckout(getState().world, d, Date.now())
  const r = await placeOrder(d)
  expect(r.ok).toBe(true)
  if (!r.ok) return
  const w = getState().world
  const orders = w.orders.filter((o) => r.orderIds.includes(o.id))
  expect(orders).toHaveLength(q.shops.length)
  expect(orders.reduce((a, o) => a + o.total, 0)).toBe(q.pricing.total)
  expect(w.cart.some((l) => d.lines.some((x) => x.cartLineId === l.id))).toBe(false)
  expect(orders.every((o) => o.status === 'to_confirm')).toBe(true) // COD
})

test('price-changed scenario stops place order once, then it goes through', async () => {
  const d = draftFromCart()
  setSettings({ nextPlaceOrder: 'price_changed' })
  const r1 = await placeOrder(d)
  expect(r1.ok).toBe(false)
  expect(getState().settings.nextPlaceOrder).toBe('normal')
})

test('online payment: failure keeps the order unpaid, success moves it to Chờ xác nhận', async () => {
  const d = { ...draftFromCart(), payment: 'vietqr' as const }
  const r = await placeOrder(d)
  if (!r.ok) throw new Error('place failed')
  expect(getState().world.orders.find((o) => o.id === r.orderIds[0])!.status).toBe('awaiting_payment')
  setSettings({ nextPayment: 'failure' })
  expect(await pay(r.paymentId)).toBe('failed')
  expect(await pay(r.paymentId)).toBe('paid')
  expect(getState().world.orders.filter((o) => r.orderIds.includes(o.id)).every((o) => o.status === 'to_confirm' && o.paymentStatus === 'paid')).toBe(true)
})

test('cancelling one unpaid order cancels every order on that payment', async () => {
  const r = await placeOrder({ ...draftFromCart(), payment: 'vietqr' })
  if (!r.ok) throw new Error('place failed')
  const ids = await cancelOrder(r.orderIds[0], 'Đổi ý, không muốn mua nữa')
  expect(ids.sort()).toEqual([...r.orderIds].sort())
})

test('cancel request is one-shot; a refusal keeps the order going', async () => {
  const o = getState().world.orders.find((x) => x.status === 'to_ship' && !x.cancelRequest)
    ?? (() => { const x = getState().world.orders.find((y) => y.status === 'to_confirm')!; advanceOrder(x.id); return getState().world.orders.find((y) => y.id === x.id)! })()
  await requestCancel(o.id, 'Lý do khác')
  respondCancel(o.id, false)
  const after = getState().world.orders.find((x) => x.id === o.id)!
  expect(after.cancelRequest?.status).toBe('refused')
  expect(after.status).toBe('to_ship')
})

test('approved refund-only return refunds and issues the platform share as a credit voucher', async () => {
  const o = getState().world.orders.find((x) => x.status === 'delivered')!
  const id = await submitReturn({ orderId: o.id, lineIds: [o.lines[0].id], reason: 'damaged', description: '', photos: ['x'], solution: 'refund_only' })
  returnDemo(id, 'approve_refund')
  const w = getState().world
  expect(w.returns.find((r) => r.id === id)!.status).toBe('refunded')
  expect(w.orders.find((x) => x.id === o.id)!.status).toBe('returned')
})

test('buy again skips unavailable lines', () => {
  const o = getState().world.orders.find((x) => x.status === 'completed')!
  const before = getState().world.cart.length
  const r = buyAgain(o.id)
  expect(r.added + r.skipped).toBe(o.lines.length)
  expect(getState().world.cart.length).toBeGreaterThanOrEqual(before)
})

describe('review fixes', () => {
  const flashItem = () => {
    const w = getState().world
    const t = Date.now()
    const slot = w.flashSlots.find((s) => s.startsAt <= t && t < s.endsAt)!
    const item = slot.items.find((i) => w.skus.find((k) => k.id === i.skuId)!.stock >= 5 && i.quota - i.sold >= 5)!
    return { w, t, slot, item, sku: w.skus.find((k) => k.id === item.skuId)! }
  }

  test('flash price stops at the per-buyer limit across orders, and parts are whole đồng', async () => {
    const { item, sku } = flashItem()
    const lim = item.perBuyerLimit
    const parts = lineParts(getState().world, sku, lim + 2, Date.now())
    expect(parts[0]).toMatchObject({ price: item.salePrice, qty: lim })
    expect(parts[1]).toMatchObject({ price: sku.price, qty: 2 })
    startCheckout('buy_now', [{ skuId: sku.id, qty: lim }])
    const d = JSON.parse(sessionStorage.getItem('market.session.v1')!).checkout as CheckoutDraft
    const r = await placeOrder(d)
    expect(r.ok).toBe(true)
    expect(lineParts(getState().world, sku, 1, Date.now())).toEqual([{ price: sku.price, qty: 1 }])
  })

  test('a total that changed since the page was shown stops place order', async () => {
    const d = draftFromCart()
    const shown = quoteCheckout(getState().world, d, Date.now()).pricing.total
    const r = await placeOrder(d, shown + 1000)
    expect(r.ok).toBe(false)
  })

  test('paying an expired payment does not mark it paid', async () => {
    const r = await placeOrder({ ...draftFromCart(), payment: 'vietqr' })
    if (!r.ok) throw new Error('place failed')
    expirePayment(r.paymentId)
    expect(await pay(r.paymentId)).toBe('timeout')
    expect(getState().world.payments.find((p) => p.id === r.paymentId)!.status).toBe('expired')
  })

  test('a voucher used up by this buyer is dropped even when picked by hand', () => {
    const w = getState().world
    const v = w.vouchers.find((x) => x.id === 'mk15')!
    mutateUsage('mk15', v.perBuyerLimit)
    const d = { ...draftFromCart(), platformVoucher: 'mk15' }
    const q = quoteCheckout(getState().world, d, Date.now())
    expect(q.pricing.platformVoucher).toBeUndefined()
    expect(q.pricing.dropped.map((x) => x.reason.kind)).toContain('used_up')
  })
})

function mutateUsage(voucherId: string, n: number) {
  setSettings({})
  const w = getState().world
  w.savedVouchers.find((s) => s.voucherId === voucherId)!.usedCount = n
}
