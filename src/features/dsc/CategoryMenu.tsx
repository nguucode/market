// Stub owned by US-DSC-001 (category browser: web header menu). Minimal working version.
import { Menu } from 'lucide-react'
import { Link } from 'react-router'

export function CategoryMenu() {
  return <Link to="/categories" className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-[14px] font-semibold no-underline hover:bg-well"><Menu size={18} aria-hidden />Danh mục</Link>
}
