import type { CSSProperties, ReactNode } from 'react'

type Props = {
  projectCount: number
  children: ReactNode
  onAdd: () => void
}

export default function LaneCards({ projectCount, children, onAdd }: Props) {
  const columns = projectCount >= 4 ? 4 : 3
  const style = { '--project-columns': columns } as CSSProperties

  return <div className="lane-cards" style={style}>
    {children}
    <button className="add-card" aria-label="Добавить работу" onClick={onAdd}>＋</button>
  </div>
}
