/** All model poses and editorial copy share one reversible scroll timeline. */
export const storyRange = (value: number, from: number, to: number) => {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)))
  return t * t * (3 - 2 * t)
}

/** Three.js Y points up: each object arrives from above and leaves below. */
export function flightY(
  progress: number,
  from: number,
  settle: number,
  depart: number,
  to: number,
) {
  const enter = storyRange(progress, from, settle)
  const drift = storyRange(progress, settle, depart)
  const leave = storyRange(progress, depart, to)
  return 5.5 * (1 - enter) + 0.35 - drift * 0.65 - leave * 5.8
}

export const storyChapters = [
  {
    id: 'wallet',
    nav: 'Mở ví',
    label: 'TỪ RỐI ĐẾN GỌN',
    word: 'RỐI.',
    title: ['TIỀN BẠC, ĐÔI KHI', 'HƠI NHIỀU THỨ.'],
    description:
      'Một hóa đơn, một khoản chung, một mục tiêu. Tất cả bắt đầu từ việc gom chúng về đúng chỗ.',
    aside: ['CHƯA CẦN HOÀN HẢO.', 'CHỈ CẦN BẮT ĐẦU.'],
    from: 0,
    to: 0.18,
  },
  {
    id: 'sharing',
    nav: 'Chia tiền',
    label: 'CHIA TIỀN, GIỮ NIỀM VUI',
    word: 'CHIA.',
    title: ['MỘT BỮA ĂN.', 'KHÔNG AI PHẢI NHỚ HẾT.'],
    description:
      'Khoản chung tự tách thành phần của từng người. Gọn phần tiền, giữ nguyên phần vui.',
    aside: ['720.000 ₫ / 3 NGƯỜI', '240.000 ₫ MỖI NGƯỜI'],
    from: 0.18,
    to: 0.38,
  },
  {
    id: 'bills',
    nav: 'Hóa đơn',
    label: 'BỚT ĐIỀU PHẢI NHỚ',
    word: 'GỌN.',
    title: ['VIỆC ĐẾN HẠN.', 'ĐỂ SPLITLY NHỚ GIÚP.'],
    description: 'Điện, nước, internet và những khoản lặp lại được xếp đúng chỗ, đúng lúc.',
    aside: ['ĐÚNG HẠN. ĐỦ PHẦN.', 'THÊM MỘT ĐIỀU BỚT LO.'],
    from: 0.38,
    to: 0.57,
  },
  {
    id: 'insight',
    nav: 'Nhìn rõ',
    label: 'HIỂU DÒNG TIỀN',
    word: 'RÕ.',
    title: ['NHÌN MỘT LẦN.', 'HIỂU CẢ THÁNG.'],
    description:
      'Không phải thêm một dashboard để nhìn. Chỉ là vừa đủ để biết tiền đang đi đâu và còn bao nhiêu khoảng thở.',
    aside: ['ĂN UỐNG · 34%', 'DÀNH DỤM · 22%'],
    from: 0.57,
    to: 0.77,
  },
  {
    id: 'saving',
    nav: 'Để dành',
    label: 'DÀNH CHỖ CHO TƯƠNG LAI',
    word: 'VUI.',
    title: ['MỘT CHÚT HÔM NAY.', 'MỘT KHOẢNG THỞ NGÀY MAI.'],
    description:
      'Những khoản nhỏ không biến mất. Chúng đi về phía một chuyến đi, một góc nhà, hoặc đơn giản là cảm giác yên tâm.',
    aside: ['KHÔNG CẦN VỘI.', 'ĐIỀU ĐẸP ĐẼ ĐANG TỚI.'],
    from: 0.77,
    to: 1.01,
  },
] as const

export const storyChapter = (progress: number) =>
  progress < 0.18 ? 0 : progress < 0.38 ? 1 : progress < 0.57 ? 2 : progress < 0.77 ? 3 : 4

export type StoryDemo = { people: 2 | 3 | 4; paid: boolean; saved: number }

/** Land in the reading interval, after the model has arrived. */
export const storyTarget = (index: number) => (index === 0 ? 0 : storyChapters[index].from + 0.095)

/** Adjacent headlines never overlap; the final message stays until the section ends. */
export function storyOpacity(progress: number, index: number) {
  const chapter = storyChapters[index]
  const enter = index === 0 ? 1 : storyRange(progress, chapter.from + 0.005, chapter.from + 0.035)
  const leave =
    index === storyChapters.length - 1
      ? 0
      : storyRange(progress, chapter.to - 0.05, chapter.to - 0.005)
  return enter * (1 - leave)
}
