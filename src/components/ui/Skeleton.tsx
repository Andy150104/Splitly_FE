export default function Skeleton({
  variant = 'list',
  rows = 3,
  label = 'Đang tải không gian của bạn…',
}: {
  variant?: 'list' | 'cards' | 'page'
  rows?: number
  label?: string
}) {
  return (
    <div className={`splitly-skeleton skeleton-${variant}`} role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      {variant === 'page' && (
        <div className="skeleton-page-heading" aria-hidden="true">
          <span className="skeleton-bar skeleton-short" />
          <span className="skeleton-bar skeleton-title" />
          <span className="skeleton-bar skeleton-description" />
        </div>
      )}
      <div className="skeleton-items" aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          <div className="skeleton-item" key={index}>
            <span className="skeleton-avatar" />
            <div>
              <span className="skeleton-bar" />
              <span className="skeleton-bar skeleton-short" />
            </div>
            <span className="skeleton-badge" />
          </div>
        ))}
      </div>
    </div>
  )
}
