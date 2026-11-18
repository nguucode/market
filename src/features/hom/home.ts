// Home content and selectors: US-HOM-001, -002, -005. Pure.
import { activeProducts, childrenOf, leavesUnder, priceView } from '@/app/catalog'
import type { Category, Product } from '@/domain/types'
import type { World } from '@/mock/seed'

/** The one editorial block (US-HOM-001). Product ids from the deterministic seed. */
export const HERO = {
  headline: 'Góc bếp ấm cho mùa cuối năm',
  subhead: 'Nồi, chảo và đồ dùng bếp được chọn từ các shop uy tín.',
  cta: { label: 'Khám phá đồ bếp', category: 'do-bep' },
  mosaic: ['p62', 'p65', 'p69', 'p53', 'p59', 'p58'],
  fallbacks: ['p47', 'p63', 'p57', 'p67', 'p45'],
}

/** `n` active products from the mosaic list, skipping delisted or missing ones, topped up from the fallbacks. */
export function pickMosaic(ids: string[], fallbacks: string[], products: Product[], n = ids.length): Product[] {
  const byId = new Map(products.map((p) => [p.id, p]))
  return [...new Set([...ids, ...fallbacks])]
    .map((id) => byId.get(id))
    .filter((p): p is Product => !!p && p.status === 'active')
    .slice(0, n)
}

/** Hero mosaic for the kitchen story: the six best-selling primary kitchen listings (ids would drift with the catalogue). */
export function kitchenMosaic(w: World, n = 6): Product[] {
  const leaves = new Set(leavesUnder(w, 'do-bep'))
  return activeProducts(w)
    .filter((p) => leaves.has(p.categoryId))
    .sort((a, b) => b.soldCount - a.soldCount || a.id.localeCompare(b.id))
    .filter((p, i, xs) => xs.findIndex((x) => x.images[0] === p.images[0]) === i)
    .slice(0, n)
}

/** Level-1 categories with one product photo each (US-HOM-002). */
export function categoryTiles(w: World): { category: Category; image?: string }[] {
  const active = activeProducts(w)
  return childrenOf(w).map((c) => {
    const leaves = leavesUnder(w, c.id)
    return { category: c, image: active.find((p) => leaves.includes(p.categoryId))?.images[0] }
  })
}

export type RailDef = { title: string; href: string; cat?: string; priceMax?: number; official?: boolean; newest?: boolean }
export const RAILS: RailDef[] = [
  { title: 'Đồ bếp dưới 200K', cat: 'do-bep', priceMax: 200_000, href: '/search?cat=do-bep&price_max=200000' },
  { title: 'Mới từ Shop chính hãng', official: true, newest: true, href: '/search?official=1&sort=new' },
  { title: 'Phụ kiện dưới 150K', cat: 'phu-kien', priceMax: 150_000, href: '/search?cat=phu-kien&price_max=150000' },
]

/** Up to 12 active matches in seeded order (newest first when asked); fewer than 4 → none, the rail is omitted. */
export function railProducts(w: World, def: RailDef, t: number): Product[] {
  const leaves = def.cat ? new Set(leavesUnder(w, def.cat)) : undefined
  const official = new Set(w.shops.filter((s) => s.isOfficial).map((s) => s.id))
  let list = activeProducts(w).filter((p) =>
    (!leaves || leaves.has(p.categoryId)) && (!def.official || official.has(p.shopId)) && (!def.priceMax || priceView(w, p, t).min <= def.priceMax))
  if (def.newest) list = [...list].sort((a, b) => b.createdAt - a.createdAt)
  return list.length < 4 ? [] : list.slice(0, 12)
}

export const REC_PAGE = 20
/** Recommendations page `page` (0-based): seeded order, excludes `exclude` and delisted, no duplicates. */
export function recommendationPage(products: Product[], exclude: Set<string>, page: number, size = REC_PAGE) {
  const seen = new Set<string>()
  const pool: Product[] = []
  for (const p of products) if (p.status === 'active' && !exclude.has(p.id) && !seen.has(p.id)) { seen.add(p.id); pool.push(p) }
  return { items: pool.slice(page * size, (page + 1) * size), hasMore: pool.length > (page + 1) * size }
}
/** Auto-load the first 3 pages, then "Xem thêm". */
export const autoLoadAllowed = (pagesLoaded: number) => pagesLoaded < 3
