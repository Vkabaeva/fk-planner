import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { saveCloudStore } from './data/cloudStore'
import { isSupabaseConfigured, supabase } from './data/supabaseClient'
import { workflows } from './domain/constants'
import { APP_CONFIG } from './config/appConfig'
import { usePlannerData } from './hooks/usePlannerData'
import { usePlannerController } from './hooks/usePlannerController'
import type { ConfirmationRequest, ModalName, View } from './domain/types'
import AppSidebar from './components/AppSidebar'
import AppDialogs from './components/AppDialogs'
import SeasonWorkspace from './components/SeasonWorkspace'
import AuthScreen, { PasswordRecoveryScreen } from './components/AuthScreen'
import SeasonsPage from './components/SeasonsPage'
import { useProfile } from './hooks/useProfile'
import { useSidebarWidth } from './hooks/useSidebarWidth'
import { useToast } from './hooks/useToast'
import type { User } from '@supabase/supabase-js'

function App() {
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [todayLabel] = useState(() => new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' }).format(new Date()))
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const { store, setStore, storeReady, cloudError, setCloudError, saveState, retryCloudLoad } = usePlannerData(authUser?.id ?? null)
  const [activeSeasonId, setActiveSeasonId] = useState('')
  const [view, setView] = useState<View>('board')
  const [showAllSeasons, setShowAllSeasons] = useState(false)
  const [modal, setModal] = useState<ModalName | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [draggedProjectId, setDraggedProjectId] = useState('')
  const [dragOverNominationId, setDragOverNominationId] = useState('')
  const [selectedNominationId, setSelectedNominationId] = useState('')
  const [editingSeasonId, setEditingSeasonId] = useState('')
  const [openSeasonMenuId, setOpenSeasonMenuId] = useState('')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<ConfirmationRequest | null>(null)
  const { width: sidebarWidth, beginResize: beginSidebarResize, moveResize: moveSidebarResize, resizeWithKeyboard: resizeSidebarWithKeyboard } = useSidebarWidth()
  const { toast, notify } = useToast()
  const { name: participantName, initials: participantInitials, avatarUrl: profileAvatarUrl, saveName: saveProfileName, uploadAvatar: uploadProfileAvatar, changePassword, canChangePassword } = useProfile(authUser, setAuthUser, notify)

  useEffect(() => {
    if (!supabase) return
    let alive = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      setAuthUser(session?.user ?? null)
      setAuthReady(true)
    })
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return
      if (error) setCloudError(error.message)
      setAuthUser(data.session?.user ?? null)
      setAuthReady(true)
    })
    return () => { alive = false; subscription.unsubscribe() }
  }, [setCloudError])
  useEffect(() => {
    if (!openSeasonMenuId) return
    const closeMenu = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('.season-nav-row')) setOpenSeasonMenuId('')
    }
    document.addEventListener('pointerdown', closeMenu)
    return () => document.removeEventListener('pointerdown', closeMenu)
  }, [openSeasonMenuId])
  useEffect(() => {
    if (!profileMenuOpen) return
    const closeMenu = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('.profile-menu-wrap')) setProfileMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setProfileMenuOpen(false) }
    document.addEventListener('pointerdown', closeMenu)
    window.addEventListener('keydown', closeOnEscape)
    return () => { document.removeEventListener('pointerdown', closeMenu); window.removeEventListener('keydown', closeOnEscape) }
  }, [profileMenuOpen])
  useEffect(() => {
    if (!deleteConfirmation) return
    const cancelOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setDeleteConfirmation(null) }
    window.addEventListener('keydown', cancelOnEscape)
    return () => window.removeEventListener('keydown', cancelOnEscape)
  }, [deleteConfirmation])
  const effectiveActiveSeasonId = store.seasons.some((item) => item.id === activeSeasonId) ? activeSeasonId : store.seasons[0]?.id ?? ''
  const season = store.seasons.find((item) => item.id === effectiveActiveSeasonId)
  const seasonProjects = useMemo(() => store.projects.filter((project) => season?.nominations.some((nomination) => nomination.id === project.nominationId)), [store.projects, season])
  const activeProjectCount = seasonProjects.filter((project) => project.stageIndex > 0 && project.stageIndex < workflows[project.category].length).length
  const wordsDone = seasonProjects.reduce((sum, project) => sum + project.logs.reduce((count, log) => count + log.amount, 0), 0)
  const actions = usePlannerController({ store, setStore, season, seasonProjects, activeSeasonId: effectiveActiveSeasonId, setActiveSeasonId, setShowAllSeasons, setView, setModal, setSelectedProjectId, setSelectedNominationId, selectedNominationId, setEditingSeasonId, draggedProjectId, setDraggedProjectId, setDragOverNominationId, authUserId: authUser?.id, notify, setDeleteConfirmation })
  const { addSeason, deleteSeason, updateSeason, addNomination, updateNomination, deleteNomination, importTemplate, addProject, openNewProject, updateProject, openProjectEdit, openProjectDetails, saveProjectNotes, attachProjectImages, removeProjectImage, dragProjectOverLane, dropProjectOnLane, openProjectMove, moveProject, advanceProject, logWords, removeProject, changeProjectWindow } = actions

  const selectedProject = store.projects.find((project) => project.id === selectedProjectId)
  const recentSidebarSeasons = store.seasons.slice(-APP_CONFIG.sidebar.visibleSeasons)
  const sidebarSeasons = effectiveActiveSeasonId && !recentSidebarSeasons.some((item) => item.id === effectiveActiveSeasonId)
    ? [...recentSidebarSeasons, store.seasons.find((item) => item.id === effectiveActiveSeasonId)!].sort((a, b) => store.seasons.indexOf(a) - store.seasons.indexOf(b))
    : recentSidebarSeasons
  const hiddenSeasonCount = store.seasons.length - sidebarSeasons.length


  if (supabase && !authReady) return <main className="auth-page"><div className="auth-loading">Загружаем твою мастерскую…</div></main>
  if (supabase && passwordRecovery && authUser) return <PasswordRecoveryScreen supabase={supabase} onComplete={() => setPasswordRecovery(false)} />
  if (supabase && authReady && !authUser) return <AuthScreen supabase={supabase} />
  if (supabase && authUser && !storeReady) return <main className="auth-page"><section className="auth-card auth-status-card"><div className="brand-mark">fk</div><h1>{cloudError ? 'Не удалось загрузить данные' : 'Загружаем мастерскую…'}</h1>{cloudError ? <><p className="auth-error">{cloudError}</p><div className="auth-status-actions"><button className="button primary" onClick={retryCloudLoad}>Попробовать ещё раз</button><button className="button outline" onClick={() => { void supabase?.auth.signOut() }}>Выйти</button></div></> : <p className="auth-description">Секунду, получаем сезоны и работы из облака.</p>}</section></main>

  return (
    <div className="app-shell">
      <AppSidebar
        seasons={sidebarSeasons}
        activeSeasonId={effectiveActiveSeasonId}
        view={view}
        showAllSeasons={showAllSeasons}
        hiddenSeasonCount={hiddenSeasonCount}
        participantName={participantName}
        participantInitials={participantInitials}
        avatarUrl={profileAvatarUrl}
        sidebarWidth={sidebarWidth}
        minWidth={APP_CONFIG.sidebar.minWidth}
        maxWidth={APP_CONFIG.sidebar.maxWidth}
        openSeasonMenuId={openSeasonMenuId}
        profileMenuOpen={profileMenuOpen}
        authenticated={!!supabase && !!authUser}
        onSelectSeason={(id) => { setActiveSeasonId(id); setShowAllSeasons(false); setOpenSeasonMenuId('') }}
        onNavigate={(nextView) => { setShowAllSeasons(false); setView(nextView) }}
        onShowAllSeasons={() => setShowAllSeasons(true)}
        onCreateSeason={() => setModal('season')}
        onEditSeason={(id) => { setEditingSeasonId(id); setOpenSeasonMenuId(''); setModal('edit-season') }}
        onDeleteSeason={(id) => { setOpenSeasonMenuId(''); deleteSeason(id) }}
        onToggleSeasonMenu={(id) => setOpenSeasonMenuId((current) => current === id ? '' : id)}
        onToggleProfileMenu={() => setProfileMenuOpen((open) => !open)}
        onOpenProfile={() => { setProfileMenuOpen(false); setModal('profile') }}
        onEditProfile={() => { setProfileMenuOpen(false); setModal('edit-profile') }}
        onSignOut={() => { setProfileMenuOpen(false); void supabase?.auth.signOut() }}
        onResizeStart={beginSidebarResize}
        onResizeMove={moveSidebarResize}
        onResizeKeyboard={resizeSidebarWithKeyboard}
      />

      <main className="main-area">
        <header className="topbar">
          <div className="crumb"><span>FK PLANNER</span><b>/</b><strong>{showAllSeasons ? 'Все сезоны' : season?.name ?? 'Мастерская ФБ'}</strong></div>
          <div className="top-actions"><span className="today-label">{todayLabel}</span></div>
        </header>
        {showAllSeasons ? <SeasonsPage seasons={store.seasons} projects={store.projects} activeSeasonId={effectiveActiveSeasonId} onCreate={() => setModal('season')} onDelete={deleteSeason} onOpen={(id) => { setActiveSeasonId(id); setShowAllSeasons(false); setView('board') }} /> : season ? <SeasonWorkspace
          season={season}
          projects={seasonProjects}
          activeProjectCount={activeProjectCount}
          wordsDone={wordsDone}
          view={view}
          dragOverNominationId={dragOverNominationId}
          cloudError={cloudError}
          cloudEnabled={!!supabase}
          saveState={saveState}
          onViewChange={setView}
          onOpenNewProject={openNewProject}
          onSetModal={setModal}
          onEditNomination={(id) => { setSelectedNominationId(id); setModal('edit-nomination') }}
          onAdvance={advanceProject}
          onLog={(id) => { setSelectedProjectId(id); setModal('log') }}
          onMove={openProjectMove}
          onEdit={openProjectEdit}
          onOpen={openProjectDetails}
          onDelete={removeProject}
          onDragStart={setDraggedProjectId}
          onDragEnd={() => { setDraggedProjectId(''); setDragOverNominationId('') }}
          onDragOver={dragProjectOverLane}
          onDragLeave={(event) => { if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setDragOverNominationId('') }}
          onDrop={dropProjectOnLane}
          onWindowChange={changeProjectWindow}
          onRetrySync={() => { if (!authUser) return; void saveCloudStore(authUser.id, store).then(() => setCloudError('')).catch((error: unknown) => setCloudError(error instanceof Error ? `Не удалось сохранить данные: ${error.message}` : 'Не удалось сохранить данные в облаке.')) }}
        /> : (
          <div className="first-run"><div className="first-run-art"><span>✦</span><span>✿</span><span>✧</span><div className="first-run-card"><b>Идея</b><i /><i /><i /></div></div><div className="eyebrow">ТВОЁ ПРОСТРАНСТВО ДЛЯ ФБ</div><h1>Пусть идеи<br />дойдут до финиша.</h1><p>Создай сезон, добавь левелы и собирай проекты в одном спокойном месте. Мы поможем видеть этапы, сроки и ежедневный прогресс.</p><button className="button primary large" onClick={() => setModal('season')}>Создать первый сезон <span>→</span></button><small className="privacy-note">{supabase ? 'Данные хранятся в твоём аккаунте.' : 'Локальный режим: данные хранятся в этом браузере. Настрой Supabase для входа и облачной синхронизации.'}</small></div>
        )}
      </main>

      <AppDialogs
        modal={modal}
        store={store}
        season={season}
        selectedProject={selectedProject}
        selectedNominationId={selectedNominationId}
        editingSeasonId={editingSeasonId}
        participantName={participantName}
        avatarUrl={profileAvatarUrl}
        userEmail={authUser?.email}
        userId={authUser?.id}
        canChangePassword={canChangePassword}
        deleteConfirmation={deleteConfirmation}
        toast={toast}
        onClose={() => setModal(null)}
        onDeleteCancel={() => setDeleteConfirmation(null)}
        onDeleteConfirm={() => { const action = deleteConfirmation?.onConfirm; setDeleteConfirmation(null); action?.() }}
        onAddSeason={addSeason}
        onUpdateSeason={updateSeason}
        onAddNomination={addNomination}
        onUpdateNomination={updateNomination}
        onDeleteNomination={() => deleteNomination(selectedNominationId)}
        onImportTemplate={importTemplate}
        onAddProject={addProject}
        onUpdateProject={updateProject}
        onAttachImages={(id, files) => { void attachProjectImages(id, files) }}
        onRemoveImage={(projectId, imageId) => { void removeProjectImage(projectId, imageId) }}
        onSaveNotes={saveProjectNotes}
        onMoveProject={moveProject}
        onLogWords={logWords}
        onSaveName={saveProfileName}
        onAvatarChange={uploadProfileAvatar}
        onChangePassword={changePassword}
      />
    </div>
  )
}

export default App
