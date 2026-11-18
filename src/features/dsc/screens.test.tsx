// Smoke: each DSC/SHP screen renders its main content (app layout in jsdom) without loops or crashes.
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { setSettings } from '@/app/store'
import ShopPage from '@/features/shp/ShopPage'
import CategoriesPage from './CategoriesPage'
import CategoryPage from './CategoryPage'
import SearchPage from './SearchPage'

setSettings({ latency: 'none' })
const at = (url: string) => render(
  <MemoryRouter initialEntries={[url]}>
    <Routes>
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/c/:slug" element={<CategoryPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/s/:handle" element={<ShopPage />} />
    </Routes>
  </MemoryRouter>,
)

describe('screens', () => {
  it('category browser', () => { at('/categories'); expect(document.querySelectorAll('[aria-current="true"]')).toHaveLength(1) })
  it('category page and unknown slug', async () => {
    at('/c/do-bep'); expect(await screen.findByRole('heading', { level: 1, name: 'Đồ bếp' })).toBeInTheDocument()
    expect(await screen.findByText(/\d+ sản phẩm/)).toBeInTheDocument()
  })
  it('unknown category', () => { at('/c/khong-co'); expect(screen.getByText(/Không tìm thấy danh mục/)).toBeInTheDocument() })
  it('search results with chips', async () => {
    at('/search?q=chảo&rating=9')
    expect(await screen.findByRole('heading', { level: 1, name: /Kết quả tìm kiếm cho “chảo”/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bộ lọc/ })).toBeInTheDocument()
  })
  it('search no results', async () => {
    at('/search?q=zzqx'); expect(await screen.findByText('Không tìm thấy kết quả nào cho “zzqx”')).toBeInTheDocument()
  })
  it('search input state', () => { at('/search'); expect(screen.getByRole('combobox')).toBeInTheDocument(); expect(screen.getByText('Tìm kiếm phổ biến')).toBeInTheDocument() })
  it('shop tabs', async () => {
    at('/s/bep-viet-official'); expect(await screen.findByRole('heading', { level: 1, name: /Bếp Việt Official/ })).toBeInTheDocument()
    at('/s/bep-viet-official?tab=about'); expect(screen.getAllByText('Thông tin người bán').length).toBeGreaterThan(0)
    at('/s/bep-viet-official?tab=reviews'); at('/s/bep-viet-official?tab=products&q=chao'); at('/s/bep-viet-official?tab=categories')
  })
  it('unknown shop', () => { at('/s/nope'); expect(screen.getByText(/Không tìm thấy Shop/)).toBeInTheDocument() })
})
