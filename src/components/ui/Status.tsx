const statuses: Record<string, string> = {
  Draft: 'Bản nháp',
  Published: 'Đang thu tiền',
  Paid: 'Đã thanh toán',
  Completed: 'Hoàn tất',
  Cancelled: 'Đã hủy',
  Overdue: 'Quá hạn',
  Active: 'Đang hoạt động',
  Closed: 'Đã đóng',
  AwaitingPayment: 'Chờ thanh toán',
  PartiallyPaid: 'Đã trả một phần',
  Blocked: 'Đã chặn',
  Pending: 'Chờ tiếp nhận',
  InReview: 'Đang xử lý',
  Resolved: 'Đã giải quyết',
  Dismissed: 'Từ chối',
}
export function Status({ value }: { value: string | null }) {
  const success = ['Paid', 'Completed'].includes(value || '')
  return (
    <span
      className={`ws-status ${success ? 'is-paid' : ''} ${value === 'Draft' || value === 'Closed' || value === 'Cancelled' ? 'is-neutral' : ''}`}
    >
      {statuses[value || ''] || value || 'Chưa cập nhật'}
    </span>
  )
}
