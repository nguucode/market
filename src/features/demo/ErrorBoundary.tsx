// US-FND-006: error boundary so one broken screen never blanks the app.
import { Component, type ReactNode } from 'react'
import { Button, EmptyState } from '@/components/ui'

export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error?: Error }> {
  state: { error?: Error } = {}
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidUpdate(prev: { resetKey?: string }) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: undefined }) }
  render() {
    if (!this.state.error) return this.props.children
    return <EmptyState className="panel my-4" title="Đã có lỗi khi hiển thị màn này" body="Bạn có thể tải lại trang. Dữ liệu mẫu của bạn vẫn được giữ." action={<Button onClick={() => location.reload()}>Tải lại trang</Button>} />
  }
}
