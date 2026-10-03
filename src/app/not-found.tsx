import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="error-page">
      <span className="eyebrow">404 / ĐI LẠC MỘT CHÚT</span>
      <h1>Về nhà, tiếp giấc Splitly</h1>
      <p>Đường dẫn này chưa có nội dung.</p>
      <Link className="button button-dark" href="/">
        Về trang chủ
      </Link>
    </main>
  )
}
