import { leavesUnder } from '@/app/catalog'
import type { World } from '@/mock/seed'

/** One image per category: the best-selling active product in its subtree (the mock has no category images). */
export function categoryImages(w: World): Map<string, string> {
  const out = new Map<string, string>()
  const best = new Map<string, { img: string; sold: number }>()
  for (const p of w.products) if (p.status === 'active' && p.images[0]) {
    const b = best.get(p.categoryId)
    if (!b || p.soldCount > b.sold) best.set(p.categoryId, { img: p.images[0], sold: p.soldCount })
  }
  for (const c of w.categories) {
    const leaf = leavesUnder(w, c.id).map((id) => best.get(id)).filter(Boolean).sort((a, b) => b!.sold - a!.sold)[0]
    if (leaf) out.set(c.id, leaf.img)
  }
  return out
}

/** Arrow keys move focus within a column of links (US-DSC-001). */
export function arrowNav(e: React.KeyboardEvent<HTMLElement>) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  const items = [...e.currentTarget.querySelectorAll<HTMLElement>('a,button')]
  const i = items.indexOf(document.activeElement as HTMLElement)
  if (i < 0) return
  e.preventDefault()
  items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus()
}
