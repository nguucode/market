// US-NTF-001: notifications by tab, unread by weight and a dot, mark one/all read, link through. US-NTF-002 rows come from the store.
import { CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { markAllRead, markRead, useNow, useWorld } from '@/app/store'
import { Button, cx, EmptyState, IconButton, Img, PageTitle, Skeleton, Tabs, useLoaded } from '@/components/ui'
import type { Notification } from '@/domain/types'
import { groupUnread, listFor, notificationThumb, NTF_TABS, tabLabel, type NtfTab } from './notifications'
import { relativeTime } from './time'

const PAGE = 20

function Thumb({ n }: { n: Notification }) {
  const w = useWorld()
  const th = notificationThumb(n, w)
  const box = 'size-12 shrink-0 overflow-hidden rounded-[var(--radius-control)] lg:size-14'
  if (th.kind === 'image') return <Img src={th.src} alt="" className={box} />
  if (th.kind === 'voucher') return <span aria-hidden className={cx(box, 'flex items-center justify-center bg-accent-soft px-1 text-center text-[11px] leading-tight font-bold text-accent-ink')}>{th.text}</span>
  return <span aria-hidden className={cx(box, 'flex items-center justify-center bg-well')}><img src="/icon.svg" alt="" className="size-6" /></span>
}

export default function NotificationsPage() {
  const w = useWorld()
  const t = useNow()
  const layout = useLayout()
  const ready = useLoaded()
  const [sp, setSp] = useSearchParams()
  const raw = sp.get('tab')
  const tab = NTF_TABS.find((x) => x.id === raw) ?? NTF_TABS[0]
  const [shown, setShown] = useState({ tab: tab.id, n: PAGE })
  const n = shown.tab === tab.id ? shown.n : PAGE
  const unread = groupUnread(w.notifications)
  const list = listFor(w.notifications, tab.kind)
  const tabUnread = unread[tab.kind]

  const rowClass = (read: boolean) => cx('flex w-full items-start gap-3 px-3 py-3.5 text-left no-underline transition-colors hover:bg-well lg:px-5 lg:py-4', !read && 'bg-accent-soft/40')
  const rowBody = (x: Notification) => (
    <>
      <Thumb n={x} />
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span className={cx('min-w-0 flex-1 text-[14px] leading-5 break-words', x.read ? 'text-ink-2' : 'font-semibold text-ink')}>
            {!x.read && <span className="sr-only">Chưa đọc: </span>}{x.title}
          </span>
          {!x.read && <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[13px] leading-5 text-ink-2">{x.body}</span>
        <span className="mt-1 block text-[12px] text-muted"><time dateTime={new Date(x.createdAt).toISOString()}>{relativeTime(x.createdAt, t)}</time></span>
      </span>
    </>
  )
  const markAll = tabUnread > 0 ? () => markAllRead(tab.kind) : undefined

  return (
    <div className="mx-auto max-w-[800px] pb-8">
      <PageTitle className="mb-3 max-lg:sr-only">Thông báo</PageTitle>
      <div className="panel overflow-clip">
      <div className="sticky top-14 z-30 flex items-center gap-2 border-b border-line bg-surface px-1 lg:static lg:px-3">
        <Tabs<NtfTab> label="Loại thông báo" className="min-w-0 flex-1 border-b-0!" value={tab.id}
          items={NTF_TABS.map((x) => ({ id: x.id, label: tabLabel(x.label, unread[x.kind]) }))}
          onChange={(id) => setSp((p) => { p.set('tab', id); return p }, { replace: true })} />
        {layout === 'web'
          ? <Button variant="ghost" size="sm" className="text-accent-ink" disabled={!markAll} onClick={markAll}><CheckCheck size={16} aria-hidden />Đánh dấu đã đọc</Button>
          : <IconButton label="Đánh dấu đã đọc" disabled={!markAll} onClick={markAll} className="disabled:text-line-strong"><CheckCheck size={20} aria-hidden /></IconButton>}
      </div>
      <div role="tabpanel" aria-label={tab.label} className="bg-surface">
        {!ready ? (
          <ul role="list" aria-busy="true" aria-label="Đang tải">
            {Array.from({ length: 8 }, (_, i) => (
              <li key={i} className="flex gap-3 border-b border-line px-3 py-3.5 last:border-0 lg:px-5 lg:py-4"><Skeleton className="size-12 lg:size-14" /><span className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3.5 w-full" /><Skeleton className="h-3 w-20" /></span></li>
            ))}
          </ul>
        ) : list.length === 0 ? (
          <EmptyState title="Chưa có thông báo nào" body={tab.empty} />
        ) : (
          <>
            <ul role="list">
              {list.slice(0, n).map((x) => (
                <li key={x.id} className="border-b border-line last:border-0">
                  {x.link
                    ? <Link to={x.link} onClick={() => markRead(x.id)} className={rowClass(x.read)}>{rowBody(x)}</Link>
                    : <button type="button" onClick={() => markRead(x.id)} className={rowClass(x.read)}>{rowBody(x)}</button>}
                </li>
              ))}
            </ul>
            {list.length > n && (
              <div className="flex justify-center border-t border-line p-4">
                <Button variant="secondary" className="w-full lg:w-auto lg:min-w-[240px]" onClick={() => setShown({ tab: tab.id, n: n + PAGE })}>Xem thêm</Button>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  )
}
