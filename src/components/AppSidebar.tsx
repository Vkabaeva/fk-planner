import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import type { Season, View } from '../domain/types'

type Props = {
  seasons: Season[]
  activeSeasonId: string
  view: View
  showAllSeasons: boolean
  hiddenSeasonCount: number
  participantName: string
  participantInitials: string
  avatarUrl: string
  sidebarWidth: number
  minWidth: number
  maxWidth: number
  openSeasonMenuId: string
  profileMenuOpen: boolean
  authenticated: boolean
  onSelectSeason: (id: string) => void
  onNavigate: (view: View) => void
  onShowAllSeasons: () => void
  onCreateSeason: () => void
  onEditSeason: (id: string) => void
  onDeleteSeason: (id: string) => void
  onToggleSeasonMenu: (id: string) => void
  onToggleProfileMenu: () => void
  onOpenProfile: () => void
  onEditProfile: () => void
  onSignOut: () => void
  onResizeStart: (event: ReactPointerEvent<HTMLDivElement>) => void
  onResizeMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onResizeKeyboard: (event: ReactKeyboardEvent<HTMLDivElement>) => void
}

export default function AppSidebar(props: Props) {
  const { seasons, activeSeasonId, view, showAllSeasons, hiddenSeasonCount, participantName, participantInitials, avatarUrl, sidebarWidth, minWidth, maxWidth, openSeasonMenuId, profileMenuOpen, authenticated } = props
  const style = { '--sidebar-width': `${sidebarWidth}px` } as CSSProperties

  return <aside className="sidebar" style={style}>
    <div className="brand"><div className="brand-mark">fk</div><div><strong>fk planner</strong><span>Твоя мастерская ФБ</span></div></div>
    <div className="side-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
    <button className={`nav-item ${!showAllSeasons && view === 'board' ? 'selected' : ''}`} onClick={() => props.onNavigate('board')}><span className="nav-icon">▦</span>Доска работ</button>
    <button className={`nav-item ${!showAllSeasons && view === 'gantt' ? 'selected' : ''}`} onClick={() => props.onNavigate('gantt')}><span className="nav-icon">▤</span>План и сроки</button>
    <button className={`nav-item ${showAllSeasons ? 'selected' : ''}`} onClick={props.onShowAllSeasons}><span className="nav-icon">▧</span>Все сезоны</button>
    <div className="side-divider" />
    <div className="season-label"><span>СЕЗОНЫ</span><button aria-label="Создать сезон" onClick={props.onCreateSeason}>＋</button></div>
    {seasons.map((season) => <div key={season.id} className={`season-nav-row ${activeSeasonId === season.id && !showAllSeasons ? 'current' : ''}`}>
      <button className="season-nav" onClick={() => props.onSelectSeason(season.id)}><span className="season-dot" />{season.name}</button>
      <div className="season-options">
        <button className="season-menu-trigger" aria-label={`Действия для сезона «${season.name}»`} aria-haspopup="menu" aria-expanded={openSeasonMenuId === season.id} onClick={() => props.onToggleSeasonMenu(season.id)}>···</button>
        {openSeasonMenuId === season.id && <div className="season-menu" role="menu"><button role="menuitem" onClick={() => props.onEditSeason(season.id)}>Редактировать</button><button className="danger" role="menuitem" onClick={() => props.onDeleteSeason(season.id)}>Удалить</button></div>}
      </div>
    </div>)}
    {hiddenSeasonCount > 0 && <button className="more-seasons-link" onClick={props.onShowAllSeasons}>Ещё {hiddenSeasonCount} сезона — все сезоны →</button>}
    {!seasons.length && <p className="no-seasons">Здесь появятся твои сезоны ФБ</p>}
    <div className="sidebar-bottom">
      <button className="profile-summary" onClick={props.onOpenProfile} aria-label="Мой профиль"><div className="avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : participantInitials}</div><span className="profile-copy"><strong>Мастерская ФБ</strong><small>{participantName}</small></span></button>
      <div className="profile-menu-wrap"><button className="profile-menu-trigger" aria-label="Меню профиля" aria-haspopup="menu" aria-expanded={profileMenuOpen} onClick={props.onToggleProfileMenu}>···</button>{profileMenuOpen && <div className="profile-menu" role="menu"><button role="menuitem" onClick={props.onOpenProfile}>Мой профиль</button><button role="menuitem" onClick={props.onEditProfile}>Редактировать</button>{authenticated && <><div className="profile-menu-divider" /><button role="menuitem" onClick={props.onSignOut}>Выйти</button></>}</div>}</div>
    </div>
    <div className="sidebar-resizer" role="separator" aria-orientation="vertical" aria-label="Изменить ширину меню" aria-valuemin={minWidth} aria-valuemax={maxWidth} aria-valuenow={sidebarWidth} tabIndex={0} onPointerDown={props.onResizeStart} onPointerMove={props.onResizeMove} onKeyDown={props.onResizeKeyboard} />
  </aside>
}
