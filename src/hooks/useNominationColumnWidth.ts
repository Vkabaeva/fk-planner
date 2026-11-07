import { useEffect, useState, type RefObject } from 'react'
import type { Nomination, Project } from '../domain/types'

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
      const context = document.createElement('canvas').getContext('2d')
      if (!title || !count || !dot || !heading || !name || !context) return

      context.font = getComputedStyle(title).font
      const longestTitle = Math.max(...nominations.map((item) => context.measureText(item.name).width))
      context.font = getComputedStyle(count).font
      const widestCount = Math.max(...nominations.map((item) => context.measureText(String(projects.filter((project) => project.nominationId === item.id).length)).width))
      const countStyle = getComputedStyle(count)
      const countWidth = widestCount + (parseFloat(countStyle.paddingLeft) || 0) + (parseFloat(countStyle.paddingRight) || 0)
      const dotWidth = parseFloat(getComputedStyle(dot).width) || 8
      const nameGap = parseFloat(getComputedStyle(name).columnGap) || 8
      const headingGap = parseFloat(getComputedStyle(heading).columnGap) || 6
      const actionWidth = actions?.getBoundingClientRect().width || 24
      const nextWidth = Math.ceil(dotWidth + nameGap * 2 + longestTitle + countWidth + headingGap + actionWidth)
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
