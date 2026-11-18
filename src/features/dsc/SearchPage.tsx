// US-DSC-003/004/005/006: /search. Without a query: the input state. With one: results.
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { PageTitle } from '@/components/ui'
import { Results, SearchHeading } from './Results'
import { SearchCombo } from './SearchBox'

export default function SearchPage() {
  const layout = useLayout()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const empty = !sp.toString()
  const q = sp.get('q') ?? ''
  const [editing, setEditing] = useState(empty)
  useEffect(() => { setEditing(empty) }, [sp, empty])
  useEffect(() => { document.title = `${q ? `${q} · ` : ''}Tìm kiếm · Market` }, [q])

  if (layout === 'web' && empty)
    return (
      <div className="panel mx-auto max-w-[760px] p-6">
        <PageTitle className="mb-5">Tìm kiếm</PageTitle>
        <SearchCombo mode="page" autoFocus />
      </div>
    )

  if (layout === 'app' && editing)
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-ground px-4 pt-[max(8px,env(safe-area-inset-top))] pb-8">
        <PageTitle className="sr-only">Tìm kiếm</PageTitle>
        <SearchCombo mode="page" autoFocus onCancel={() => (empty ? (history.length > 1 ? nav(-1) : nav('/')) : setEditing(false))} onDone={() => setEditing(false)} />
      </div>
    )

  return (
    <Results
      title={(count) => (
        <>
          {layout === 'app' && (
            <button type="button" onClick={() => setEditing(true)} className="mb-3 flex h-11 w-full items-center gap-2.5 rounded-[var(--radius-control)] bg-surface px-3.5 text-left text-[15px] ring-2 ring-inset ring-accent" aria-label={`Sửa tìm kiếm: ${q}`}>
              <Search size={18} aria-hidden className="shrink-0 text-muted" /><span className="min-w-0 truncate">{q || 'Tìm sản phẩm, shop…'}</span>
            </button>
          )}
          <SearchHeading q={q} count={layout === 'app' ? count : undefined} />
        </>
      )}
    />
  )
}
