// Deterministic mock world: spec/ia/mock-data.md. All shops, people and carriers are fictional.
// Product photos: DummyJSON (MIT, hotlinked from cdn.dummyjson.com); names rewritten in Vietnamese, branded items excluded.
// shortcut: images are hotlinked from cdn.dummyjson.com; self-host them if that CDN ever becomes unreliable.
import source from './data/catalog-source.json'
import { quoteShipping } from '@/domain/shipping'
import { refundSplit } from '@/domain/orders'
import { price as priceSession, voucherLabel } from '@/domain/pricing'
import type {
  Address, Buyer, CartLine, Category, FlashSlot, Notification, Order, OrderLine, OrderStatus, Payment, PaymentMethod, Product,
  ReturnRequest, Review, SavedVoucher, Shop, Sku, TrackingEvent, VariantDimension, Voucher,
} from '@/domain/types'

/** Bump whenever seed logic changes, so saved demo state from an older seed is discarded. */
export const SEED_VERSION = 3

export type World = {
  buyer: Buyer
  categories: Category[]
  shops: Shop[]
  products: Product[]
  skus: Sku[]
  reviews: Review[]
  vouchers: Voucher[]
  savedVouchers: SavedVoucher[]
  flashSlots: FlashSlot[]
  cart: CartLine[]
  addresses: Address[]
  orders: Order[]
  payments: Payment[]
  tracking: TrackingEvent[]
  returns: ReturnRequest[]
  notifications: Notification[]
  favorites: string[]
  follows: string[]
  searchHistory: string[]
  /** Vouchers already announced as expiring (US-NTF-002). */
  expiryNotified?: string[]
  /** Flash units the buyer bought, per `slotId:skuId` (per-buyer limit). */
  flashBought?: Record<string, number>
  seq: number
}

const DAY = 86_400_000
const HOUR = 3_600_000
const MIN = 60_000

/* ── PRNG ─────────────────────────────────────────────────────────── */
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
let rnd = mulberry32(0x5eed)
const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1))
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)]
const round1000 = (n: number) => Math.round(n / 1000) * 1000

/* ── Shops ────────────────────────────────────────────────────────── */
type ShopDef = [handle: string, name: string, group: string, province: number, official?: boolean, codOff?: boolean]
const SHOP_DEFS: ShopDef[] = [
  ['linen-ha', 'Linen Hạ', 'thoi-trang-nu', 48],
  ['moc-mien-studio', 'Mộc Miên Studio', 'thoi-trang-nu', 79],
  ['gio-mua-closet', 'Gió Mùa Closet', 'thoi-trang-nu', 1],
  ['nang-tho-boutique', 'Nàng Thơ Boutique', 'thoi-trang-nu', 79, true],
  ['ao-so-mi-ba-lang', 'Áo Sơ Mi Ba Làng', 'thoi-trang-nam', 1],
  ['quan-ao-nam-tot', 'Đồ Nam Tốt', 'thoi-trang-nam', 79],
  ['buoc-chan-sneaker', 'Bước Chân Sneaker', 'thoi-trang-nam', 79, false, true],
  ['kinh-mat-gio-bien', 'Kính Mát Gió Biển', 'phu-kien', 56],
  ['bong-tai-hat-sương', 'Hạt Sương Trang Sức', 'phu-kien', 1],
  ['dong-ho-kim-gio', 'Kim Giờ Watch', 'phu-kien', 79, true],
  ['phan-hong-cosmetics', 'Phấn Hồng Cosmetics', 'sac-dep', 79, true],
  ['moi-xinh-beauty', 'Môi Xinh Beauty', 'sac-dep', 1],
  ['go-moc-noi-that', 'Gỗ Mộc Nội Thất', 'nha-cua', 79, false, true],
  ['nha-xanh-decor', 'Nhà Xanh Decor', 'nha-cua', 48],
  ['den-vang-am', 'Đèn Vàng Ấm', 'nha-cua', 1],
  ['gom-men-lam', 'Gốm Men Lam', 'nha-cua', 46],
  ['bep-viet-official', 'Bếp Việt Official', 'do-bep', 79, true],
  ['chao-gang-ba-bay', 'Chảo Gang Bà Bảy', 'do-bep', 79],
  ['nha-bep-nho', 'Nhà Bếp Nhỏ', 'do-bep', 48],
  ['dung-cu-bep-an-khang', 'Dụng Cụ Bếp An Khang', 'do-bep', 1],
  ['thiet-bi-bep-sao-mai', 'Thiết Bị Bếp Sao Mai', 'do-bep', 31, true],
  ['cho-sang-da-nang', 'Chợ Sáng Đà Nẵng', 'bach-hoa', 48],
  ['vuon-rau-da-lat', 'Vườn Rau Đà Lạt', 'bach-hoa', 68],
  ['hai-san-bien-dong', 'Hải Sản Biển Đông', 'bach-hoa', 56],
  ['tap-hoa-co-hai', 'Tạp Hóa Cô Hai', 'bach-hoa', 79],
  ['pet-ban-nho', 'Pet Bạn Nhỏ', 'bach-hoa', 1],
  ['the-thao-song-han', 'Thể Thao Sông Hàn', 'the-thao', 48],
  ['vot-va-bong', 'Vợt & Bóng', 'the-thao', 79],
  ['san-co-xanh', 'Sân Cỏ Xanh', 'the-thao', 1],
  ['phu-kien-chup-anh-lumen', 'Lumen Phụ Kiện Chụp Ảnh', 'dien-thoai-pk', 79],
  ['op-lung-mem', 'Ốp Lưng Mềm', 'dien-thoai-pk', 1],
  ['tui-xach-may', 'Túi Xách Mây', 'thoi-trang-nu', 92],
  ['dam-tiec-dem-trang', 'Đêm Trắng Dạ Hội', 'thoi-trang-nu', 1],
  ['giay-nu-hoa-ban', 'Giày Nữ Hoa Ban', 'thoi-trang-nu', 79],
  ['nha-sach-bep', 'Góc Bếp Xinh', 'do-bep', 92],
  ['trai-cay-mien-tay', 'Trái Cây Miền Tây', 'bach-hoa', 92],
  ['gia-dung-thanh-tam', 'Gia Dụng Thanh Tâm', 'nha-cua', 31],
  ['the-thao-ngoai-troi', 'Ngoài Trời Outdoor', 'the-thao', 56],
  ['cua-hang-dong-ho-xua', 'Đồng Hồ Xưa', 'phu-kien', 46],
  ['my-pham-thuan-viet', 'Mỹ Phẩm Thuần Việt', 'sac-dep', 48, false, true],
]
const PROVINCE: Record<number, string> = {
  1: 'Hà Nội', 31: 'Hải Phòng', 46: 'Huế', 48: 'Đà Nẵng', 56: 'Khánh Hòa', 68: 'Lâm Đồng', 79: 'TP. Hồ Chí Minh', 92: 'Cần Thơ',
}
const STREETS = ['Lê Lợi', 'Nguyễn Huệ', 'Trần Phú', 'Hai Bà Trưng', 'Bạch Đằng', 'Phan Chu Trinh', 'Lý Thường Kiệt', 'Hùng Vương']

/* ── Variants ─────────────────────────────────────────────────────── */
const COLORS = ['Đen', 'Trắng', 'Be', 'Xanh rêu', 'Xanh dương', 'Đỏ đô', 'Hồng phấn', 'Nâu', 'Xám']

type Src = (typeof source.products)[number]

function dimsFor(kind: string, images: string[]): VariantDimension[] {
  const colorDim = (n: number): VariantDimension => {
    const start = int(0, COLORS.length - 1)
    return { id: 'mau', name: 'Màu', options: Array.from({ length: n }, (_, i) => ({ id: `c${i}`, label: COLORS[(start + i) % COLORS.length], image: images[i % images.length] })) }
  }
  const sizes = (id: string, name: string, labels: string[]): VariantDimension => ({ id, name, options: labels.map((l, i) => ({ id: `${id}${i}`, label: l })) })
  switch (kind) {
    case 'apparel': return [colorDim(Math.min(3, Math.max(2, images.length))), sizes('size', 'Kích cỡ', ['S', 'M', 'L', 'XL'])]
    case 'shoes-w': return [colorDim(2), sizes('size', 'Size', ['35', '36', '37', '38', '39'])]
    case 'shoes-m': return [colorDim(2), sizes('size', 'Size', ['39', '40', '41', '42', '43'])]
    case 'color': return [colorDim(Math.max(2, Math.min(4, images.length + 1)))]
    case 'weight': return [sizes('kl', 'Khối lượng', ['500g', '1kg'])]
    case 'size': return [sizes('kc', 'Kích cỡ', ['Nhỏ', 'Vừa', 'Lớn'])]
    case 'size-bed': return [sizes('kc', 'Kích thước', ['1m6 × 2m', '1m8 × 2m'])]
    default: return []
  }
}

function combos(dims: VariantDimension[]): string[][] {
  return dims.reduce<string[][]>((acc, d) => acc.flatMap((c) => d.options.map((o) => [...c, o.id])), [[]])
}

function promoFor(p: number): number | undefined {
  if (rnd() > 0.42) return undefined
  const d = pick([0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5])
  return round1000(p / (1 - d)) // rules.md#price-display: never more than 50% off
}

/* ── Copy pools ───────────────────────────────────────────────────── */
const REVIEW_GOOD = [
  'Hàng đẹp y hình, đóng gói kỹ. Sẽ ủng hộ shop tiếp.',
  'Chất lượng tốt so với giá, giao nhanh hơn dự kiến.',
  'Shop tư vấn nhiệt tình, mình đổi size được ngay trong ngày.',
  'Dùng được hai tuần rồi, vẫn ổn. Đáng tiền.',
  'Màu ngoài đời đẹp hơn ảnh một chút, rất thích.',
  'Giao hàng nhanh, shipper thân thiện. Sản phẩm đúng mô tả.',
  'Mua lần thứ hai rồi, chất lượng vẫn đều.',
]
const REVIEW_MID = [
  'Sản phẩm tạm ổn, nhưng hộp hơi móp khi nhận.',
  'Đúng mô tả nhưng chất liệu mỏng hơn mình nghĩ.',
  'Giao chậm hơn dự kiến hai ngày, hàng thì ổn.',
]
const REVIEW_BAD = [
  'Màu không giống ảnh, nhắn shop thì phản hồi chậm.',
  'Hàng bị trầy một góc, đã gửi yêu cầu trả hàng.',
  'Size nhỏ hơn bảng size, không mặc vừa.',
]
const NAMES = ['Ngọc Anh', 'Minh Khoa', 'Thu Trang', 'Hoàng Nam', 'Bảo Ngân', 'Quốc Huy', 'Lan Phương', 'Đức Thịnh', 'Mai Chi', 'Tuấn Kiệt', 'Hà My', 'Gia Bảo']
const mask = (n: string) => `${n[0]}****${n[n.length - 1]}`

/* ── Build ────────────────────────────────────────────────────────── */
export function seedWorld(now: number): World {
  rnd = mulberry32(0x5eed)
  const categories = source.categories as Category[]
  const level1Of = (catId: string): string => {
    let c = categories.find((x) => x.id === catId)!
    while (c.parentId) c = categories.find((x) => x.id === c.parentId)!
    return c.id
  }

  const shops: Shop[] = SHOP_DEFS.map(([handle, name, group, province, official, codOff], i) => {
    const ratingCount = int(80, 9_000)
    return {
      id: `s${i + 1}`,
      handle, name,
      avatar: String(i % 6),
      isOfficial: !!official,
      provinceCode: province,
      provinceName: PROVINCE[province],
      rating: Math.round((4.4 + rnd() * 0.6) * 10) / 10,
      ratingCount,
      followers: ratingCount * int(2, 9),
      responseRate: int(82, 100),
      responseTime: pick(['trong vài phút', 'trong vài giờ', 'trong 1 ngày']),
      joinedAt: now - int(200, 2400) * DAY,
      legalName: official ? `Công ty TNHH ${name.replace(' Official', '')}` : `Hộ kinh doanh ${name}`,
      businessAddress: `${int(3, 210)} ${pick(STREETS)}, ${PROVINCE[province]}`,
      businessCode: String(int(1_000_000_000, 9_999_999_999)),
      codEnabled: !codOff,
      about: `${name} bán ${categories.find((c) => c.id === group)!.name.toLowerCase()} từ năm ${2026 - int(1, 9)}. Hàng có sẵn, đóng gói trong ngày, đổi trả theo chính sách của Market.`,
      shopCategories: [],
      policies: { returnDays: 15, warranty: pick([undefined, 'Bảo hành 6 tháng', 'Bảo hành 12 tháng']) },
    }
  })
  const shopsByGroup = (g: string) => shops.filter((_, i) => SHOP_DEFS[i][2] === g)

  const products: Product[] = []
  const skus: Sku[] = []
  let pn = 0
  const addProduct = (src: Src, shop: Shop, opts: { name?: string; priceFactor?: number; status?: Product['status'] } = {}) => {
    pn += 1
    const id = `p${pn}`
    const base = round1000(src.price * (opts.priceFactor ?? 1))
    const dims = dimsFor(src.kind, src.images)
    const ratingCount = rnd() < 0.08 ? 0 : int(3, 2_400)
    const name = opts.name ?? src.name
    const p: Product = {
      id, slug: `${slugify(name)}-${id}`, shopId: shop.id, categoryId: src.categoryId,
      name, images: src.images, description: describe(name, src.categoryId, categories),
      attributes: attributesFor(src.categoryId, shop),
      dimensions: dims,
      soldCount: ratingCount * int(2, 7),
      rating: ratingCount ? Math.round((3.9 + rnd() * 1.1) * 10) / 10 : 0,
      ratingCount,
      status: opts.status ?? 'active',
      weightGrams: Math.max(100, Math.round((src.weight ?? 1) * 180)),
      freeShipEligible: rnd() < 0.6,
      createdAt: now - int(3, 400) * DAY,
    }
    products.push(p)
    const promo = promoFor(base)
    combos(dims).forEach((optionIds, k) => {
      const bump = optionIds.some((o) => o === 'size3' || o === 'kc2' || o === 'kl1') ? (src.kind === 'weight' ? base * 0.9 : base * 0.12) : optionIds.includes('kc1') ? base * 0.1 : 0
      const unit = round1000(base + bump)
      const before = promo ? round1000(unit * (promo / base)) : undefined
      const colorIdx = optionIds.find((o) => o.startsWith('c'))
      skus.push({
        id: `${id}-k${k}`, productId: id, optionIds, price: unit,
        priceBeforePromo: before && before > unit && unit >= before * 0.5 ? before : undefined,
        stock: rnd() < 0.08 ? 0 : int(1, 60),
        image: colorIdx ? src.images[Number(colorIdx.slice(1)) % src.images.length] : undefined,
      })
    })
    return p
  }

  // Primary listings, one per source product, spread over shops of the matching group.
  const rr: Record<string, number> = {}
  const bySrc: Record<number, Product> = {}
  for (const src of source.products) {
    const g = level1Of(src.categoryId)
    const pool = shopsByGroup(g)
    const shop = pool[(rr[g] = (rr[g] ?? 0) + 1) % pool.length]
    bySrc[src.src] = addProduct(src, shop)
  }
  // Competing listings from a second shop of the same group, with marketplace-style long names.
  for (const src of source.products) {
    if (rnd() > 0.6 || src.images.length < 2) continue
    const pool = shopsByGroup(level1Of(src.categoryId)).filter((s) => s.id !== bySrc[src.src].shopId)
    if (!pool.length) continue
    addProduct({ ...src, images: [...src.images.slice(1), src.images[0]] }, pick(pool), { name: `${src.name} ${pick(['loại 1', 'cao cấp', 'mẫu mới', 'bản tiêu chuẩn', 'giá tốt'])}`, priceFactor: 0.88 + rnd() * 0.24 })
  }

  // ── Hand-made edge cases (mock-data.md) ──
  const sh = (handle: string) => shops.find((s) => s.handle === handle)!
  const pin = (srcId: number) => bySrc[srcId]
  // §4.3 cart: Shop A (Linen Hạ, Đà Nẵng) 298.000₫ + 180.000₫, Shop B (Chảo Gang Bà Bảy, HCM) 245.000₫.
  const shopA = sh('linen-ha'), shopB = sh('chao-gang-ba-bay'), shopC = sh('buoc-chan-sneaker')
  const dress = moveTo(pin(164), shopA), earrings = moveTo(pin(184), shopA), wok = moveTo(pin(52), shopB), sneaker = moveTo(pin(92), shopC)
  setPrice(dress, 298_000, 398_000); setPrice(earrings, 180_000); setPrice(wok, 245_000, 289_000)
  // 2 dimensions × 6 options with gaps: one colour with no stock at all.
  const floral = pin(163)
  floral.dimensions = [
    { id: 'mau', name: 'Màu', options: ['Trắng hoa nhí', 'Xanh hoa nhí', 'Hồng hoa nhí', 'Vàng hoa nhí', 'Đen hoa nhí', 'Be hoa nhí'].map((l, i) => ({ id: `c${i}`, label: l, image: floral.images[i % floral.images.length] })) },
    { id: 'size', name: 'Kích cỡ', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((l, i) => ({ id: `size${i}`, label: l })) },
  ]
  for (let i = skus.length - 1; i >= 0; i--) if (skus[i].productId === floral.id) skus.splice(i, 1)
  combos(floral.dimensions).forEach((optionIds, k) => {
    const c = Number(optionIds[0].slice(1)), s = Number(optionIds[1].slice(4))
    skus.push({
      id: `${floral.id}-k${k}`, productId: floral.id, optionIds, price: s >= 4 ? 319_000 : 299_000, priceBeforePromo: s >= 4 ? 429_000 : 399_000,
      stock: c === 3 ? 0 : (c + s) % 4 === 0 ? 0 : (c * 7 + s * 3) % 9 === 0 ? 3 : 12 + ((c + s) % 20), image: floral.images[c % floral.images.length],
    })
  })
  floral.soldCount = 10_800
  // Overflow names.
  const longName = pin(162)
  longName.name = 'Đầm xòe xanh dương cổ vuông tay phồng dáng dài qua gối, vải đũi lụa mềm mát, phong cách tiểu thư Hàn Quốc đi biển dạo phố'
  const delisted = addProduct(source.products.find((s) => s.src === 166)!, shopA, { name: 'Đầm kẻ caro tartan bản giới hạn', status: 'delisted' })
  const oosSku = skus.find((k) => k.productId === sneaker.id)!
  oosSku.stock = 0
  setPrice(pin(11), 12_499_000) // the 11-character price

  // Shop categories from what each shop sells.
  for (const s of shops) {
    const cats = [...new Set(products.filter((p) => p.shopId === s.id).map((p) => p.categoryId))]
    s.shopCategories = cats.map((c) => ({ id: c, name: categories.find((x) => x.id === c)!.name }))
    const banner = products.find((p) => p.shopId === s.id)
    s.banner = banner?.images[0]
  }

  /* ── Reviews ── */
  const reviews: Review[] = []
  for (const p of products) {
    const n = p.ratingCount === 0 && p.id !== floral.id ? 0 : int(6, 40)
    const pskus = skus.filter((k) => k.productId === p.id)
    for (let i = 0; i < n; i++) {
      const r = rnd() < 0.72 ? 5 : rnd() < 0.6 ? 4 : rnd() < 0.5 ? 3 : int(1, 2)
      const anonymous = rnd() < 0.2
      const name = pick(NAMES)
      reviews.push({
        id: `r${reviews.length + 1}`, productId: p.id, skuId: pick(pskus).id, buyerName: anonymous ? mask(name) : name, anonymous, rating: r,
        text: r >= 4 ? pick(REVIEW_GOOD) : r === 3 ? pick(REVIEW_MID) : pick(REVIEW_BAD),
        tags: r >= 4 ? [pick(['Chất lượng tốt', 'Đúng mô tả', 'Đóng gói cẩn thận', 'Giao hàng nhanh'])] : [],
        photos: rnd() < 0.2 ? p.images.slice(0, int(1, Math.min(3, p.images.length))) : [],
        createdAt: now - int(1, 300) * DAY - int(0, 23) * HOUR, isMine: false,
        shopReply: rnd() < 0.15 ? { text: 'Cảm ơn bạn đã tin chọn shop. Shop rất vui khi bạn hài lòng!', at: now - int(0, 30) * DAY } : undefined,
      })
    }
  }

  // The rating line and the review summary count the same reviews (product page consistency).
  for (const p of products) {
    const rs = reviews.filter((r) => r.productId === p.id)
    p.ratingCount = rs.length
    p.rating = rs.length ? Math.round((rs.reduce((a, r) => a + r.rating, 0) / rs.length) * 10) / 10 : 0
  }

  /* ── Vouchers ── */
  const vouchers: Voucher[] = []
  const vch = (o: Partial<Voucher> & Pick<Voucher, 'id' | 'scope' | 'kind' | 'value' | 'minSpend'>): Voucher => {
    const v: Voucher = { code: o.id.toUpperCase(), startsAt: now - 3 * DAY, endsAt: now + int(4, 20) * DAY, totalQuota: 1000, usedCount: int(10, 600), perBuyerLimit: 1, ...o }
    vouchers.push(v)
    return v
  }
  const vPlat = vch({ id: 'mk15', scope: 'platform', kind: 'percent', value: 15, maxDiscount: 50_000, minSpend: 300_000 })
  vch({ id: 'mk50', scope: 'platform', kind: 'amount', value: 50_000, minSpend: 700_000 })
  vch({ id: 'mkvisen', scope: 'platform', kind: 'percent', value: 10, maxDiscount: 30_000, minSpend: 150_000, paymentMethods: ['wallet'] })
  const v2h = vch({ id: 'mk2gio', scope: 'platform', kind: 'amount', value: 20_000, minSpend: 150_000, endsAt: now + 2 * HOUR })
  vch({ id: 'mkmoi', scope: 'platform', kind: 'amount', value: 30_000, minSpend: 250_000 })
  vch({ id: 'mklon', scope: 'platform', kind: 'percent', value: 8, maxDiscount: 200_000, minSpend: 2_000_000 })
  const vShip = vch({ id: 'fs25', scope: 'shipping', kind: 'amount', value: 25_000, maxPerShop: 25_000, minSpend: 0 })
  vch({ id: 'fs40', scope: 'shipping', kind: 'amount', value: 40_000, maxPerShop: 40_000, minSpend: 300_000 })
  vch({ id: 'fs15', scope: 'shipping', kind: 'amount', value: 15_000, maxPerShop: 15_000, minSpend: 0, totalQuota: 500, usedCount: 500 })
  const shopVoucherOf: Record<string, Voucher[]> = {}
  for (const s of shops) {
    const list: Voucher[] = []
    if (s.id === shopA.id) list.push(vch({ id: 'linen30', scope: 'shop', shopId: s.id, kind: 'amount', value: 30_000, minSpend: 450_000 }))
    else if (s.id === shopB.id) list.push(vch({ id: 'chao20', scope: 'shop', shopId: s.id, kind: 'amount', value: 20_000, minSpend: 299_000 }))
    else {
      const n = int(2, 3)
      for (let i = 0; i < n; i++) {
        const pct = rnd() < 0.4
        list.push(vch({
          id: `${s.handle.slice(0, 8).replace(/-/g, '')}${i}`, scope: 'shop', shopId: s.id,
          kind: pct ? 'percent' : 'amount', value: pct ? pick([5, 8, 10]) : pick([15_000, 20_000, 30_000, 50_000]),
          maxDiscount: pct ? pick([20_000, 30_000, 50_000]) : undefined, minSpend: pick([99_000, 150_000, 250_000, 450_000]),
        }))
      }
    }
    shopVoucherOf[s.id] = list
  }
  const vA = shopVoucherOf[shopA.id][0], vB = shopVoucherOf[shopB.id][0]
  const savedVouchers: SavedVoucher[] = [vPlat, vShip, vA, vB, v2h].map((v, i) => ({ voucherId: v.id, savedAt: now - (i + 1) * DAY, usedCount: 0 }))

  /* ── Flash sale ── */
  const flashSlots: FlashSlot[] = []
  const slotBounds: [number, number][] = [
    [now - 1 * HOUR, now + 2 * HOUR + 17 * MIN],
    [now + 2 * HOUR + 17 * MIN, now + 6 * HOUR],
    [now + 22 * HOUR, now + 25 * HOUR],
    [now + 25 * HOUR, now + 29 * HOUR],
  ]
  const flashPool = products.filter((p) => p.status === 'active' && p.id !== dress.id && p.id !== earrings.id && p.id !== wok.id)
  slotBounds.forEach(([a, b], si) => {
    const items = Array.from({ length: 20 }, () => {
      const p = pick(flashPool)
      const k = skus.find((x) => x.productId === p.id && x.stock > 0) ?? skus.find((x) => x.productId === p.id)!
      const ref = k.priceBeforePromo ?? k.price
      const quota = int(20, 120)
      return { skuId: k.id, productId: p.id, salePrice: Math.max(round1000(ref * (0.55 + rnd() * 0.2)), Math.ceil(ref * 0.5 / 1000) * 1000), quota, sold: si === 0 ? int(Math.floor(quota * 0.2), quota) : 0, perBuyerLimit: pick([1, 2]) }
    }).filter((x, i, xs) => xs.findIndex((y) => y.productId === x.productId) === i)
    flashSlots.push({ id: `fl${si + 1}`, startsAt: a, endsAt: b, items })
  })

  /* ── Persona ── */
  const buyer: Buyer = { name: 'Lê Thu Hà', phone: '0905 123 456', email: 'thuha.demo@example.com', avatarInitials: 'TH', joinedAt: now - 820 * DAY }
  const addresses: Address[] = [
    { id: 'a1', name: 'Lê Thu Hà', phone: '0905 123 456', provinceCode: 48, provinceName: 'Thành phố Đà Nẵng', wardCode: 20242, wardName: 'Phường Hải Châu', detail: '27 Lê Đình Dương', label: 'home', isDefault: true },
    { id: 'a2', name: 'Lê Thu Hà', phone: '0905 123 456', provinceCode: 48, provinceName: 'Thành phố Đà Nẵng', wardCode: 20275, wardName: 'Phường An Hải', detail: 'Tầng 6, 112 Phạm Văn Đồng', label: 'office', isDefault: false },
  ]

  /* ── Cart (mock-data.md: §4.3 shops, COD-off shop, delisted and out-of-stock lines) ── */
  const firstSku = (p: Product, pred: (k: Sku) => boolean = (k) => k.stock > 0) => skus.find((k) => k.productId === p.id && pred(k)) ?? skus.find((k) => k.productId === p.id)!
  const cl = (id: string, k: Sku, qty: number, selected: boolean, agoH: number, priceAtAdd = k.price): CartLine => ({ id, skuId: k.id, qty, selected, addedAt: now - agoH * HOUR, priceAtAdd })
  const dressSku = firstSku(dress, (k) => k.stock > 0 && k.optionIds.includes('size1'))
  const cart: CartLine[] = [
    cl('cl1', dressSku, 1, true, 3),
    cl('cl2', firstSku(earrings), 1, true, 26),
    cl('cl3', firstSku(wok), 1, true, 5),
    cl('cl4', skus.find((k) => k.productId === sneaker.id && k.stock > 0)!, 1, false, 50, 650_000), // price changed since added
    cl('cl5', oosSku, 1, false, 70),
    cl('cl6', firstSku(delisted), 1, false, 200),
  ]

  /* ── Orders ── */
  const orders: Order[] = []
  const payments: Payment[] = []
  const tracking: TrackingEvent[] = []
  const returns: ReturnRequest[] = []
  const reviewsMine: Review[] = []
  let on = 0
  const makeOrder = (status: OrderStatus, opts: { shop?: Shop; agoD: number; method?: PaymentMethod; lines?: number; voucher?: boolean }) => {
    on += 1
    const shop = opts.shop ?? pick(shops.filter((s) => s.codEnabled || opts.method !== 'cod'))
    const pool = products.filter((p) => p.shopId === shop.id && p.status === 'active')
    const chosen = [...new Set(Array.from({ length: opts.lines ?? int(1, 2) }, () => pick(pool)))]
    const lines: OrderLine[] = chosen.map((p, i) => {
      const k = firstSku(p)
      return { id: `ol${on}-${i}`, productId: p.id, skuId: k.id, name: p.name, variantText: variantText(p, k), image: k.image ?? p.images[0], unitPrice: k.price, beforePromo: k.priceBeforePromo, qty: rnd() < 0.2 ? 2 : 1 }
    })
    const created = now - opts.agoD * DAY - int(1, 10) * HOUR
    const q = quoteShipping(shop.provinceCode, 48, lines.length * 600, created).find((x) => x.option === 'fast')!
    const sv = opts.voucher ? shopVoucherOf[shop.id][0] : undefined
    const r = priceSession({
      shops: [{ shopId: shop.id, lines: lines.map((l) => ({ id: l.id, unitPrice: l.unitPrice, qty: l.qty })), shippingFee: q.fee, shopVoucher: sv }],
      shippingVoucher: opts.voucher ? vShip : undefined,
      ctx: { now: created },
    })
    const s0 = r.shops[0]
    const method = opts.method ?? pick<PaymentMethod>(['cod', 'cod', 'vietqr', 'wallet', 'card'])
    const order: Order = {
      id: `MK${String(260_000_000_000 + on * 7_919_113).padStart(12, '0')}`,
      paymentId: `pay${on}`, shopId: shop.id, lines, status,
      goods: s0.goods, shippingFee: s0.shippingFee, shopDiscount: s0.shopDiscount, platformDiscount: 0, shippingDiscount: s0.shippingDiscount, total: s0.total,
      vouchers: [
        ...(s0.shopVoucher ? [{ voucherId: s0.shopVoucher.id, scope: 'shop' as const, label: voucherLabel(s0.shopVoucher), code: s0.shopVoucher.code, amount: s0.shopDiscount }] : []),
        ...(s0.shippingDiscount ? [{ voucherId: vShip.id, scope: 'shipping' as const, label: voucherLabel(vShip), code: vShip.code, amount: s0.shippingDiscount }] : []),
      ],
      address: addresses[0], shippingOption: 'fast', carrier: q.carrier, eta: q.eta, paymentMethod: method,
      paymentStatus: method === 'cod' ? 'unpaid' : 'paid', createdAt: created, at: {}, trackingCode: `CE${int(100_000_000, 999_999_999)}VN`,
    }
    payments.push({ id: order.paymentId, orderIds: [order.id], method, amount: order.total, status: method === 'cod' ? 'pending' : 'paid', createdAt: created, expiresAt: created + 15 * MIN, failures: 0 })
    timeline(order, status, created)
    orders.push(order)
    return order
  }
  const ev = (o: Order, at: number, code: string, text: string, location?: string) => tracking.push({ orderId: o.id, at, code, text, location })
  function timeline(o: Order, status: OrderStatus, t0: number) {
    const shopCity = shops.find((s) => s.id === o.shopId)!.provinceName
    const steps: [OrderStatus | 'paid' | 'picked' | 'out_for_delivery', number, string, string?][] = [
      ['to_confirm', t0, 'Đơn hàng đã đặt'],
      ['to_ship', t0 + 3 * HOUR, 'Shop đã xác nhận đơn, đang chuẩn bị hàng'],
      ['picked', t0 + 20 * HOUR, 'Đơn vị vận chuyển đã lấy hàng', shopCity],
      ['shipping', t0 + 22 * HOUR, 'Đang trung chuyển', 'Kho trung chuyển miền Trung'],
      ['out_for_delivery', t0 + 46 * HOUR, 'Đang giao đến bạn', 'Đà Nẵng'],
      ['delivered', t0 + 50 * HOUR, 'Giao hàng thành công', 'Đà Nẵng'],
    ]
    const order: OrderStatus[] = ['to_confirm', 'to_ship', 'shipping', 'delivered', 'completed']
    const reach = status === 'completed' || status === 'return_requested' || status === 'returned' ? 4 : order.indexOf(status)
    for (const [k, at, text, loc] of steps) {
      const idx = k === 'picked' ? 2 : k === 'out_for_delivery' ? 2.5 : order.indexOf(k as OrderStatus)
      if (idx <= reach && at <= now) {
        o.at[k] = at
        ev(o, at, String(k), text, loc)
      }
    }
    if (o.paymentMethod !== 'cod') o.at.paid = t0 + 2 * MIN
    if (status === 'completed' || status === 'return_requested' || status === 'returned') o.at.completed = (o.at.delivered ?? t0) + 2 * DAY
    if (o.at.delivered && o.paymentMethod === 'cod') o.paymentStatus = 'paid'
  }

  const groups: [OrderStatus, number, Partial<Parameters<typeof makeOrder>[1]>][] = [
    ['to_confirm', 0.1, { method: 'cod' }],
    ['to_confirm', 0.2, { method: 'wallet', voucher: true }],
    ['to_ship', 1, { method: 'cod' }],
    ['to_ship', 1.2, { method: 'card' }],
    ['shipping', 2, { method: 'cod', voucher: true }],
    ['shipping', 2.5, { method: 'vietqr' }],
    ['shipping', 3, { method: 'cod', lines: 3 }],
    ['delivered', 3.5, { method: 'cod' }],
    ['delivered', 6, { method: 'wallet', voucher: true }],
    ['delivered', 9, { method: 'cod', lines: 2 }],
    ['completed', 12, { method: 'cod' }],
    ['completed', 20, { method: 'card' }],
    ['completed', 31, { method: 'cod', voucher: true }],
    ['completed', 45, { method: 'vietqr' }],
    ['completed', 60, { method: 'cod' }],
    ['completed', 90, { method: 'wallet' }],
    ['completed', 130, { method: 'cod' }],
    ['completed', 170, { method: 'cod', lines: 2 }],
    ['cancelled', 4, { method: 'cod' }],
    ['cancelled', 8, { method: 'card' }],
    ['cancelled', 14, { method: 'vietqr' }],
    ['return_requested', 7, { method: 'cod' }],
    ['returned', 25, { method: 'wallet' }],
  ]
  for (const [status, agoD, o] of groups) makeOrder(status, { agoD, ...o })

  // Awaiting payment: one VietQR session, 12 minutes left.
  const unpaid = makeOrder('awaiting_payment', { agoD: 0, method: 'vietqr', shop: sh('nha-xanh-decor') })
  unpaid.createdAt = now - 3 * MIN; unpaid.paymentStatus = 'unpaid'; unpaid.at = {}
  tracking.splice(0, tracking.length, ...tracking.filter((t) => t.orderId !== unpaid.id))
  const up = payments.find((p) => p.id === unpaid.paymentId)!
  Object.assign(up, { status: 'pending', createdAt: unpaid.createdAt, expiresAt: unpaid.createdAt + 15 * MIN })

  // Cancel request pending on the first to_ship order; refused on the second.
  const toShip = orders.filter((o) => o.status === 'to_ship')
  toShip[0].cancelRequest = { status: 'pending', reason: 'Muốn thay đổi địa chỉ giao hàng', at: now - 2 * HOUR }
  toShip[1].cancelRequest = { status: 'refused', reason: 'Đổi ý, không muốn mua nữa', at: now - 20 * HOUR }

  // Cancelled: buyer (COD), failed delivery (card, refund processing), system (payment expired).
  const [c1, c2, c3] = orders.filter((o) => o.status === 'cancelled')
  Object.assign(c1, { cancelledBy: 'buyer', cancelReason: 'Tìm thấy giá rẻ hơn ở chỗ khác' }); c1.at = { to_confirm: c1.createdAt, cancelled: c1.createdAt + HOUR }
  tracking.push({ orderId: c1.id, at: c1.createdAt + HOUR, code: 'cancelled', text: 'Bạn đã hủy đơn hàng' })
  Object.assign(c2, { cancelledBy: 'system', cancelReason: 'Giao hàng không thành công', paymentStatus: 'refunded', refund: { amount: c2.total, to: 'Thẻ đã thanh toán', status: 'processing', at: c2.createdAt + 3 * DAY } })
  c2.at = { ...c2.at, cancelled: c2.createdAt + 3 * DAY }
  tracking.push({ orderId: c2.id, at: c2.createdAt + 3 * DAY, code: 'cancelled', text: 'Giao hàng không thành công sau 3 lần, đơn đã hủy' })
  Object.assign(c3, { cancelledBy: 'system', cancelReason: 'Quá hạn thanh toán', paymentStatus: 'unpaid' }); c3.at = { cancelled: c3.createdAt + 15 * MIN }
  payments.find((p) => p.id === c3.paymentId)!.status = 'expired'
  tracking.splice(0, tracking.length, ...tracking.filter((t) => t.orderId !== c3.id))
  tracking.push({ orderId: c3.id, at: c3.createdAt + 15 * MIN, code: 'cancelled', text: 'Đơn tự hủy vì quá hạn thanh toán' })

  // Return awaiting the shop, and one refunded.
  const [rq] = orders.filter((o) => o.status === 'return_requested')
  rq.statusBeforeReturn = 'delivered'; delete rq.at.completed
  returns.push({
    id: 'RT1', orderId: rq.id, lineIds: [rq.lines[0].id], reason: 'damaged', description: 'Hộp bị móp, sản phẩm trầy một góc.', photos: [rq.lines[0].image],
    solution: 'return_and_refund', refundTo: 'Tài khoản ngân hàng ••••6789', ...splitOf(rq, [rq.lines[0].id]),
    status: 'under_review', createdAt: now - 1 * DAY, timeline: [{ status: 'submitted', at: now - 1 * DAY }, { status: 'under_review', at: now - 20 * HOUR }],
  })
  rq.returnId = 'RT1'
  const [rd] = orders.filter((o) => o.status === 'returned')
  rd.statusBeforeReturn = 'completed'
  returns.push({
    id: 'RT2', orderId: rd.id, lineIds: rd.lines.map((l) => l.id), reason: 'not_as_described', description: 'Màu khác ảnh.', photos: [rd.lines[0].image],
    solution: 'refund_only', refundTo: 'Ví điện tử đã thanh toán', ...splitOf(rd, rd.lines.map((l) => l.id)),
    status: 'refunded', createdAt: rd.at.completed! + DAY, timeline: [{ status: 'submitted', at: rd.at.completed! + DAY }, { status: 'under_review', at: rd.at.completed! + DAY + 2 * HOUR }, { status: 'refunded', at: rd.at.completed! + 3 * DAY }],
  })
  rd.returnId = 'RT2'; rd.paymentStatus = 'refunded'

  // Persona's own reviews on older completed orders.
  for (const o of orders.filter((x) => x.status === 'completed').slice(3, 7)) {
    const l = o.lines[0]
    const rv: Review = {
      id: `rm${reviewsMine.length + 1}`, productId: l.productId, skuId: l.skuId, orderId: o.id, buyerName: 'Thu Hà', anonymous: false, rating: pick([5, 5, 4]),
      sub: { quality: 5, delivery: 4, service: 5 }, text: pick(REVIEW_GOOD), tags: ['Đúng mô tả'], photos: [], createdAt: o.at.completed! + DAY, isMine: true,
    }
    l.reviewId = rv.id
    reviewsMine.push(rv)
  }

  /* ── Notifications ── */
  const notifications: Notification[] = []
  const nt = (kind: Notification['kind'], title: string, body: string, at: number, link?: string) =>
    notifications.push({ id: `n${notifications.length + 1}`, kind, title, body, link, read: true, createdAt: at })
  for (const o of orders) {
    if (o.at.to_ship) nt('order', 'Shop đã xác nhận đơn', `Đơn ${o.id} đang được chuẩn bị.`, o.at.to_ship, `/orders/${o.id}`)
    if (o.at.shipping) nt('order', 'Đơn hàng đang giao', `Đơn ${o.id} đã được giao cho ${o.carrier}.`, o.at.shipping, `/orders/${o.id}`)
    if (o.at.delivered) nt('order', 'Giao hàng thành công', `Đơn ${o.id} đã giao. Kiểm tra hàng và bấm "Đã nhận được hàng".`, o.at.delivered, `/orders/${o.id}`)
  }
  nt('order', 'Yêu cầu hủy bị từ chối', `Shop đã từ chối yêu cầu hủy đơn ${toShip[1].id}. Đơn vẫn được giao.`, now - 18 * HOUR, `/orders/${toShip[1].id}`)
  nt('promotion', 'Voucher sắp hết hạn', `${voucherLabel(v2h)} trong Kho voucher hết hạn sau 2 giờ.`, now - 30 * MIN, '/vouchers?voucher=mk2gio')
  nt('promotion', 'Flash sale đang diễn ra', 'Khung giờ hiện tại còn hơn 2 giờ. Xem các deal đang giảm.', now - 1 * HOUR, '/flash-sale')
  nt('system', 'Cập nhật địa chỉ 2 cấp', 'Địa chỉ giờ chỉ còn Tỉnh/Thành phố và Phường/Xã. Kiểm tra lại sổ địa chỉ của bạn.', now - 40 * DAY, '/me/addresses')
  nt('system', 'Chào mừng đến Market', 'Đây là bản demo với dữ liệu mẫu. Mọi đơn hàng và thanh toán đều là giả lập.', buyer.joinedAt, undefined)
  notifications.sort((a, b) => b.createdAt - a.createdAt)
  notifications.slice(0, 6).forEach((n) => (n.read = false))

  orders.sort((a, b) => b.createdAt - a.createdAt)

  return {
    buyer, categories, shops, products, skus, reviews: [...reviewsMine, ...reviews], vouchers, savedVouchers, flashSlots, cart, addresses,
    orders, payments, tracking, returns, notifications,
    favorites: products.filter((p) => p.status === 'active').slice(5, 13).map((p) => p.id),
    follows: [shopA.id, sh('bep-viet-official').id],
    searchHistory: ['đầm hoa nhí', 'chảo chống dính', 'kính râm'],
    seq: 1000,
  }

  /* helpers that need the closure */
  function moveTo(p: Product, s: Shop) { p.shopId = s.id; return p }
  function setPrice(p: Product, price: number, before?: number) {
    for (const k of skus.filter((x) => x.productId === p.id)) { k.price = price; k.priceBeforePromo = before; if (!k.stock) k.stock = 20 }
  }
}

function splitOf(o: Order, lineIds: string[]) {
  const r = refundSplit(o, lineIds)
  return { cash: r.cash, voucherCredit: r.voucherCredit, shippingRefund: r.shipping }
}

export function variantText(p: Product, k: Sku): string {
  return k.optionIds
    .map((oid) => p.dimensions.flatMap((d) => d.options).find((o) => o.id === oid)?.label)
    .filter(Boolean)
    .join(', ')
}

export function slugify(s: string) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

function describe(name: string, cat: string, cats: Category[]) {
  const c = cats.find((x) => x.id === cat)!.name.toLowerCase()
  return `${name} thuộc nhóm ${c}, được shop chọn kỹ và kiểm tra trước khi giao. Ảnh chụp sản phẩm thật, màu có thể chênh lệch nhẹ do ánh sáng màn hình.\n\nHướng dẫn bảo quản: để nơi khô ráo, tránh ánh nắng trực tiếp. Liên hệ shop nếu cần tư vấn thêm về kích thước hoặc cách dùng.`
}

function attributesFor(cat: string, shop: Shop) {
  const origin = pick(['Việt Nam', 'Việt Nam', 'Trung Quốc', 'Thái Lan', 'Hàn Quốc'])
  return [
    { label: 'Xuất xứ', value: origin },
    { label: 'Nhà sản xuất', value: origin === 'Việt Nam' ? shop.legalName : `Nhập khẩu bởi ${shop.legalName}` },
    { label: 'Chất liệu', value: cat.startsWith('dam') || cat.includes('so-mi') ? pick(['Cotton', 'Đũi', 'Linen', 'Polyester']) : cat.includes('chao') || cat.includes('noi') ? 'Thép carbon' : 'Theo nhãn sản phẩm' },
    { label: 'Hạn sử dụng', value: cat.includes('trai') || cat.includes('rau') || cat.includes('thit') ? '3–7 ngày kể từ ngày giao' : 'Không áp dụng' },
    { label: 'Kho hàng', value: shop.provinceName },
  ]
}
