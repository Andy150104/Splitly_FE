'use client'

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <a className="brand" href="/" aria-label="Splitly — Trang chủ">
        Splitly
      </a>
      <h1>Một nhịp nghỉ nhỏ.</h1>
      <p>Trang chưa tải xong. Thử lại để tiếp tục câu chuyện của bạn.</p>
      <button className="button button-dark" onClick={reset}>
        Thử lại
      </button>
    </main>
  )
}
