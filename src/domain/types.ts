// Domain types: spec/ia/object-model.md. Times are epoch ms.

export type PaymentMethod = 'cod' | 'vietqr' | 'wallet' | 'card'
export type ShippingOption = 'express' | 'fast' | 'economy'

export type Category = { id: string; slug: string; name: string; parentId?: string; level: 1 | 2 | 3; image?: string }

export type Shop = {
  id: string
  handle: string
  name: string
  avatar: string // initials monogram colour key
  banner?: string // product image used as banner
  isOfficial: boolean
  provinceCode: number
  provinceName: string
  rating: number
  ratingCount: number
  followers: number
  responseRate: number // 0-100
  responseTime: string // "trong vài giờ"
  joinedAt: number
  legalName: string
  businessAddress: string
  businessCode: string
  codEnabled: boolean
  about: string
  shopCategories: { id: string; name: string }[]
  policies: { returnDays: number; warranty?: string }
}

export type VariantOption = { id: string; label: string; image?: string }
export type VariantDimension = { id: string; name: string; options: VariantOption[] }

export type Product = {
  id: string
  slug: string
  shopId: string
  categoryId: string // level 3
  shopCategoryId?: string
  name: string
  images: string[]
  description: string
  attributes: { label: string; value: string }[]
  dimensions: VariantDimension[]
  soldCount: number
  rating: number
  ratingCount: number
  status: 'active' | 'delisted'
  weightGrams: number
  freeShipEligible: boolean
  createdAt: number
}

export type Sku = { id: string; productId: string; optionIds: string[]; price: number; priceBeforePromo?: number; stock: number; image?: string }

export type Review = {
  id: string
  productId: string
  skuId: string
  orderId?: string
  buyerName: string
  anonymous: boolean
  rating: number
  sub?: { quality?: number; delivery?: number; service?: number }
  text: string
  tags: string[]
  photos: string[]
  createdAt: number
  editedAt?: number
  isMine: boolean
  shopReply?: { text: string; at: number }
}

export type VoucherScope = 'platform' | 'shop' | 'shipping'
export type Voucher = {
  id: string
  code: string
  scope: VoucherScope
  shopId?: string
  kind: 'amount' | 'percent'
  value: number
  maxDiscount?: number
  minSpend: number
  startsAt: number
  endsAt: number
  totalQuota: number
  usedCount: number
  perBuyerLimit: number
  paymentMethods?: PaymentMethod[]
  maxPerShop?: number
  /** Return credit (rules.md#decisions-from-story-writing): issued to the buyer, not claimable. */
  credit?: boolean
}
export type SavedVoucher = { voucherId: string; savedAt: number; usedCount: number }

export type FlashSlot = { id: string; startsAt: number; endsAt: number; items: FlashItem[] }
export type FlashItem = { skuId: string; productId: string; salePrice: number; quota: number; sold: number; perBuyerLimit: number }

export type CartLine = { id: string; skuId: string; qty: number; selected: boolean; addedAt: number; priceAtAdd: number }

export type Address = {
  id: string
  name: string
  phone: string
  provinceCode: number
  provinceName: string
  wardCode: number
  wardName: string
  detail: string
  label: 'home' | 'office'
  isDefault: boolean
}

export type OrderStatus =
  | 'awaiting_payment' | 'to_confirm' | 'to_ship' | 'shipping' | 'delivered' | 'completed' | 'cancelled' | 'return_requested' | 'returned'

export type OrderLine = {
  id: string
  productId: string
  skuId: string
  name: string
  variantText: string
  image: string
  unitPrice: number
  beforePromo?: number
  qty: number
  reviewId?: string
  /** Units bought at a flash-sale price in this slot. */
  flashSlotId?: string
}
export type AppliedVoucher = { voucherId: string; scope: VoucherScope; label: string; code: string; amount: number }

export type Order = {
  id: string
  paymentId: string
  shopId: string
  lines: OrderLine[]
  status: OrderStatus
  goods: number
  shippingFee: number
  shopDiscount: number
  platformDiscount: number
  shippingDiscount: number
  total: number
  vouchers: AppliedVoucher[]
  address: Address
  shippingOption: ShippingOption
  carrier: string
  eta: [number, number]
  paymentMethod: PaymentMethod
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  messageToShop?: string
  createdAt: number
  at: Partial<Record<OrderStatus | 'paid' | 'picked' | 'out_for_delivery', number>>
  cancelReason?: string
  cancelledBy?: 'buyer' | 'shop' | 'system'
  cancelRequest?: { status: 'pending' | 'refused' | 'withdrawn' | 'accepted'; reason: string; at: number }
  refund?: { amount: number; to: string; status: 'processing' | 'done'; at: number; doneAt?: number }
  returnId?: string
  statusBeforeReturn?: OrderStatus
  trackingCode: string
}

export type Payment = {
  id: string
  orderIds: string[]
  method: PaymentMethod
  amount: number
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded'
  createdAt: number
  expiresAt: number
  failures: number
}

export type TrackingEvent = { orderId: string; at: number; code: string; text: string; location?: string }

export type ReturnReason = 'not_received' | 'missing' | 'wrong_item' | 'damaged' | 'not_as_described' | 'counterfeit' | 'changed_mind'
export type ReturnStatus =
  | 'submitted' | 'under_review' | 'needs_evidence' | 'awaiting_return_shipment' | 'returning' | 'inspecting' | 'refunded' | 'rejected'
export type ReturnRequest = {
  id: string
  orderId: string
  lineIds: string[]
  reason: ReturnReason
  description: string
  photos: string[]
  solution: 'refund_only' | 'return_and_refund'
  refundTo: string
  cash: number
  voucherCredit: number
  shippingRefund: number
  status: ReturnStatus
  createdAt: number
  returnDeadline?: number
  rejectReason?: string
  timeline: { status: ReturnStatus; at: number; note?: string }[]
}

export type Notification = { id: string; kind: 'order' | 'promotion' | 'system'; title: string; body: string; link?: string; read: boolean; createdAt: number }

export type Buyer = { name: string; phone: string; email: string; avatarInitials: string; joinedAt: number }
