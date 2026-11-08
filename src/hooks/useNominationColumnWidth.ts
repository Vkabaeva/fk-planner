import { useEffect, useState, type RefObject } from 'react'
import type { Nomination, Project } from '../domain/types'

function createTextMeasureProbe(source: HTMLElement) {
  const sourceStyle = getComputedStyle(source)
  const probe = source.cloneNode(false) as HTMLElement
  probe.removeAttribute('class')
  Object.assign(probe.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    display: 'inline-block',
    width: 'max-content',
    minWidth: '0',
    maxWidth: 'none',
    flex: 'none',
    whiteSpace: 'nowrap',
    visibility: 'hidden',
    pointerEvents: 'none',
    margin: '0',
    font: sourceStyle.font,
    letterSpacing: sourceStyle.letterSpacing,
    wordSpacing: sourceStyle.wordSpacing,
    textTransform: sourceStyle.textTransform,
    paddingLeft: sourceStyle.paddingLeft,
    paddingRight: sourceStyle.paddingRight,
    borderLeftWidth: sourceStyle.borderLeftWidth,
    borderRightWidth: sourceStyle.borderRightWidth,
    borderLeftStyle: sourceStyle.borderLeftStyle,
    borderRightStyle: sourceStyle.borderRightStyle,
    boxSizing: sourceStyle.boxSizing,
  })
  document.body.append(probe)

  return {
    measure(text: string) {
      probe.textContent = text
      return probe.getBoundingClientRect().width
    },
    remove() {
      probe.remove()
    },
  }
}

export function useNominationColumnWidth(
  boardRef: RefObject<HTMLElementTagNameMap['section'] | null>,
  nominations: Nomination[],
  projects: Project[],
) {
  const [width, setWidth] = useState(190)
  const contentKey = nominations.map((item) => `${item.id}:${item.name}:${projects.filter((project) => project.nominationId === item.id).length}`).join('|')

  useEffect(() => {
    const board = boardRef.current
    if (!board || !nominations.length) return

    const measure = () => {
      const title = board.querySelector<HTMLElement>('.lane-name strong')
      const count = board.querySelector<HTMLElement>('.count-pill')
      const dot = board.querySelector<HTMLElement>('.lane-dot')
      const heading = board.querySelector<HTMLElement>('.lane-heading')
      const actions = board.querySelector<HTMLElement>('.lane-actions .icon-button')
      const name = board.querySelector<HTMLElement>('.lane-name')
      if (!title || !count || !dot || !heading || !name) return

      const titleProbe = createTextMeasureProbe(title)
      const countProbe = createTextMeasureProbe(count)
      const longestTitle = Math.max(...nominations.map((item) => titleProbe.measure(item.name)))
      const widestCount = Math.max(...nominations.map((item) => countProbe.measure(String(projects.filter((project) => project.nominationId === item.id).length))))
      titleProbe.remove()
      countProbe.remove()

      const dotWidth = dot.getBoundingClientRect().width || 8
      const nameGap = parseFloat(getComputedStyle(name).columnGap) || 8
      const headingGap = parseFloat(getComputedStyle(heading).columnGap) || 6
      const actionWidth = actions?.getBoundingClientRect().width || 24
      const nextWidth = Math.ceil(dotWidth + nameGap * 2 + longestTitle + widestCount + headingGap + actionWidth + 2)
      setWidth((current) => current === nextWidth ? current : nextWidth)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(board)
    let cancelled = false
    void document.fonts.ready.then(() => { if (!cancelled) measure() })
    return () => { cancelled = true; observer.disconnect() }
  }, [boardRef, contentKey, nominations, nominations.length, projects])

  return width
}
