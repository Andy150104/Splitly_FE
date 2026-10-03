import { describe, expect, it } from 'vitest'
import { flightY, storyChapter, storyChapters, storyOpacity, storyTarget } from './story'

describe('vertical scroll story', () => {
  it.each([
    [0.165, 0.245, 0.345, 0.425],
    [0.355, 0.44, 0.535, 0.625],
    [0.545, 0.63, 0.735, 0.815],
  ])('flies from above to below without ever reversing direction', (from, settle, depart, to) => {
    const positions = Array.from({ length: 201 }, (_, i) =>
      flightY(from + (i / 200) * (to - from), from, settle, depart, to),
    )
    expect(positions[0]).toBeGreaterThan(5)
    expect(positions.at(-1)).toBeLessThan(-5)
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeLessThanOrEqual(positions[i - 1])
    }
  })

  it('maps the five storytelling chapters deterministically', () => {
    expect([
      storyChapter(0),
      storyChapter(0.2),
      storyChapter(0.42),
      storyChapter(0.62),
      storyChapter(0.88),
    ]).toEqual([0, 1, 2, 3, 4])
  })

  it('keeps the same chapter and pose when revisiting a scroll position', () => {
    const forwards = [0, 0.2, 0.33, 0.46, 0.64, 0.82, 1]
    const result = forwards.map((p) => [storyChapter(p), flightY(p, 0.355, 0.44, 0.535, 0.625)])
    expect(
      [...forwards]
        .reverse()
        .map((p) => [storyChapter(p), flightY(p, 0.355, 0.44, 0.535, 0.625)])
        .reverse(),
    ).toEqual(result)
  })

  it('never shows two chapter headlines together during a transition', () => {
    for (let step = 0; step <= 1000; step++) {
      const visible = storyChapters.filter((_, index) => storyOpacity(step / 1000, index) > 0)
      expect(visible.length).toBeLessThanOrEqual(1)
    }
    expect(storyOpacity(1, 4)).toBe(1)
  })

  it('chapter links land on a fully readable message in the selected chapter', () => {
    storyChapters.forEach((_, index) => {
      expect(storyChapter(storyTarget(index))).toBe(index)
      expect(storyOpacity(storyTarget(index), index)).toBe(1)
    })
  })
})
