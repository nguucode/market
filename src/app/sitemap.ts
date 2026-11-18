import { parse } from 'yaml'
import raw from '../../spec/ia/sitemap.yaml?raw'

export type NavItem = { id: string; label?: string; route?: string; priority?: string; demo?: boolean; badge?: string; menu?: string[]; kind?: string; source?: string }
export type Screen = { id: string; route: string; title: string; steps?: string[]; priority?: string; shell?: string; demo?: boolean; tabs?: string[] }
type Sitemap = { header: NavItem[]; categoryRow: NavItem[]; tabBar: NavItem[]; screens: Screen[] }

export const sitemap = parse(raw) as Sitemap
const p0 = (i: { priority?: string }) => i.priority !== 'P1'
export const header = sitemap.header.filter(p0)
export const categoryRow = sitemap.categoryRow.filter(p0)
export const tabBar = sitemap.tabBar.filter(p0)

/** Match a concrete path to its sitemap screen (":param" segments match anything). */
export function screenFor(path: string): Screen | undefined {
  const parts = path.split('?')[0].split('/').filter(Boolean)
  return sitemap.screens.find((s) => {
    if (s.route === '*') return false
    const sp = s.route.split('/').filter(Boolean)
    return sp.length === parts.length && sp.every((seg, i) => seg.startsWith(':') || seg === parts[i])
  })
}
export const TAB_ROOTS = tabBar.map((t) => t.route!)
export const isTabRoot = (path: string) => TAB_ROOTS.includes(path)
