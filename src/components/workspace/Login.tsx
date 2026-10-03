'use client'

import Link from 'next/link'
import Script from 'next/script'
import dynamic from 'next/dynamic'
import { useSplitlyNavigation } from '../RouteTransition'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { send } from '../../lib/api/client'
import { Field } from '../ui/Field'
import { Notice } from '../ui/Feedback'
import { Reveal } from '../ui/Motion'
import Brand from '../ui/Brand'
import Atmosphere from '../ui/Atmosphere'

const LoginScene = dynamic(() => import('./LoginScene'), {
  ssr: false,
  loading: () => (
    <div className="login-sculpture login-spatial-scene login-scene-loading" aria-hidden="true">
      <div className="login-sculpture-fallback">
        <Brand compact />
      </div>
    </div>
  ),
})

type GoogleWindow = Window & {
  google?: {
    accounts: {
      id: {
        initialize: (options: {
          client_id: string
          callback: (value: { credential: string }) => void
        }) => void
        renderButton: (element: HTMLElement, options: Record<string, unknown>) => void
      }
    }
  }
}
export default function Login({
  destination,
  email: initialEmail,
  googleClientId,
  devEnabled,
}: {
  destination: string
  email: string
  googleClientId: string
  devEnabled: boolean
}) {
  const navigate = useSplitlyNavigation()
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)
  const [googleFailed, setGoogleFailed] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const googleRef = useRef<HTMLDivElement>(null)
  const sceneFrame = useRef<HTMLDivElement>(null)
  const lock = useRef(false)
  async function act(path: string, body: unknown, finish = true) {
    if (lock.current) return
    lock.current = true
    setPending(true)
    setError('')
    setSuccess('')
    try {
      await send(path, body)
      if (finish) {
        navigate(destination, { replace: true, refresh: true })
      } else {
        setSent(true)
        setSuccess('Mã đăng nhập đã được gửi. Kiểm tra hộp thư và thư rác nhé.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể đăng nhập.')
    } finally {
      lock.current = false
      setPending(false)
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void act(
      sent ? 'auth/verify-login-code' : 'auth/send-login-code',
      sent
        ? { email: email.trim().toLowerCase(), code: code.trim().toUpperCase() }
        : { email: email.trim().toLowerCase() },
      sent,
    )
  }
  function initGoogle() {
    const id = (window as GoogleWindow).google?.accounts.id
    if (!id || !googleRef.current) return
    id.initialize({
      client_id: googleClientId,
      callback: ({ credential }) => {
        if (credential) void act('auth/google', { idToken: credential })
        else setError('Google chưa xác nhận tài khoản. Hãy thử lại hoặc dùng mã email.')
      },
    })
    id.renderButton(googleRef.current, {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'continue_with',
      width: Math.min(380, googleRef.current.clientWidth || 300),
      locale: 'vi',
    })
  }
  return (
    <main className="ws-login">
      <Atmosphere />
      <div className="ws-login-layout">
        <div className="ws-login-scene-backdrop" ref={sceneFrame} aria-hidden="true" />
        <section className="ws-login-story">
          <Link href="/" className="ws-brand" aria-label="Splitly — Trang chủ">
            <Brand />
          </Link>
          <Reveal className="ws-login-intro" delay={0.08}>
            <span className="ws-eyebrow">KHOẢN CHUNG, CÙNG NHAU.</span>
            <h1>
              Tiền chung.
              <br />
              <em>Chuyện rõ ràng.</em>
            </h1>
            <p>
              Từ một bữa ăn đến những chuyến đi xa.
              <br />
              Splitly giữ mọi khoản chung thật rõ ràng.
            </p>
            <div className="ws-login-spatial-space">
              <LoginScene frameRef={sceneFrame} />
            </div>
            <div className="ws-login-ledger">
              <div>
                <span>01</span>
                <strong>Chia một khoản</strong>
              </div>
              <div>
                <span>02</span>
                <strong>Theo dõi từng phần</strong>
              </div>
              <div>
                <span>03</span>
                <strong>Giữ trọn niềm vui</strong>
              </div>
            </div>
          </Reveal>
          <small>TIỀN GỌN GÀNG. ĐỜI THẢNH THƠI.</small>
        </section>
        <section className="ws-login-form">
          <Link href="/" className="ws-back">
            ← Về trang chủ
          </Link>
          <Reveal className="ws-auth-card">
            <span className="ws-eyebrow">KHÔNG GIAN CỦA BẠN</span>
            <h2>Đăng nhập.</h2>
            <p>Tiếp tục với Google hoặc nhận mã qua email.</p>
            <Notice message={error} />
            <Notice message={success} success />
            {googleClientId && (
              <>
                <Script
                  src="https://accounts.google.com/gsi/client"
                  strategy="afterInteractive"
                  onReady={initGoogle}
                  onError={() => {
                    setGoogleFailed(true)
                    setError('Chưa tải được đăng nhập Google. Bạn có thể dùng email bên dưới.')
                  }}
                />
                <div
                  ref={googleRef}
                  className={`ws-google ${pending ? 'is-pending' : ''} ${googleFailed ? 'is-unavailable' : ''}`}
                />
                <div className="ws-or">hoặc tiếp tục bằng email</div>
              </>
            )}
            <form onSubmit={submit}>
              <Field label="Email của bạn">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="ban@email.com"
                  value={email}
                  disabled={pending || sent}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              {sent && (
                <Field
                  label="Mã đăng nhập"
                  hint="Dán nguyên mã trong email. Mã có hiệu lực 15 phút."
                >
                  <input
                    required
                    minLength={4}
                    maxLength={64}
                    autoComplete="one-time-code"
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Mã đăng nhập trong email"
                  />
                </Field>
              )}
              <button className="ws-button ws-full" disabled={pending} aria-busy={pending}>
                {pending
                  ? 'Đang xử lý…'
                  : sent
                    ? 'Bước vào không gian của bạn'
                    : 'Gửi mã đăng nhập'}
              </button>
              {sent && (
                <div className="ws-auth-actions">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setSent(false)
                      setCode('')
                      setSuccess('')
                    }}
                  >
                    Đổi email
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void act('auth/send-login-code', { email }, false)}
                  >
                    Gửi lại mã
                  </button>
                </div>
              )}
            </form>
            {devEnabled && (
              <div className="ws-dev-login">
                <p>Đang chạy bản local</p>
                <button
                  className="ws-button ws-button-secondary ws-full"
                  disabled={pending}
                  onClick={() => void act('auth/dev-login', { email: 'admin@example.com' })}
                >
                  Vào bằng tài khoản phát triển
                </button>
              </div>
            )}
            <div className="ws-auth-note">Phiên đăng nhập được bảo vệ. Không cần mật khẩu.</div>
          </Reveal>
          <small className="ws-login-bottom">Một bước nhỏ, để mọi khoản chung dễ dàng hơn.</small>
        </section>
      </div>
    </main>
  )
}
