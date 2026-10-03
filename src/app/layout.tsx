import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import RouteTransition from '../components/RouteTransition'
import Notifications from '../components/ui/Notifications'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/latin-500.css'
import '@fontsource/be-vietnam-pro/vietnamese-500.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/vietnamese-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/barlow-condensed/vietnamese-700.css'
import 'react-day-picker/style.css'
import '../styles.css'
import '../story.css'
import '../navbar.css'
import '../experience.css'
import '../workspace.css'
import '../splitly.css'
import '../refinement.css'
import '../universe.css'

export const metadata: Metadata = {
  title: 'Splitly — Tiền gọn gàng. Đời thảnh thơi.',
  description:
    'Không gian quản lý tiền, chia khoản chung và dành dụm điều riêng. Mỗi ngày một chút, thảnh thơi thêm nhiều.',
  icons: { icon: '/favicon.svg' },
}

export const viewport: Viewport = { themeColor: '#0b0b12' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Notifications>
          <RouteTransition>{children}</RouteTransition>
        </Notifications>
      </body>
    </html>
  )
}
