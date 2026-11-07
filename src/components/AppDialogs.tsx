import type { ConfirmationRequest, ModalName, Project, Season, Store } from '../domain/types'
import { modalTitle } from '../domain/labels'
import { DeleteConfirmationDialog, Dialog, EditNominationForm, LogForm, MoveProjectForm, NominationForm, ProjectDetailsForm, ProjectForm, SeasonForm, TemplatePicker } from './Dialogs'
import { ProfileDetails, ProfileEditForm } from './profile/ProfileDialogs'

type Props = {
  modal: ModalName | null
  store: Store
  season?: Season
  selectedProject?: Project
  selectedNominationId: string
  editingSeasonId: string
  participantName: string
  avatarUrl: string
  userEmail?: string
  userId?: string
  canChangePassword: boolean
  deleteConfirmation: ConfirmationRequest | null
  toast: string
  onClose: () => void
  onDeleteCancel: () => void
  onDeleteConfirm: () => void
  onAddSeason: (name: string, start: string, end: string) => void
  onUpdateSeason: (id: string, name: string, start: string, end: string) => void
  onAddNomination: (name: string, deadline: string) => void
  onUpdateNomination: (name: string, deadline: string) => void
  onDeleteNomination: () => void
  onImportTemplate: (template: 'winter' | 'summer') => void
  onAddProject: (project: Omit<Project, 'id' | 'stageIndex' | 'logs'>) => void
  onUpdateProject: (id: string, changes: Omit<Project, 'id' | 'stageIndex' | 'logs'>) => void
  onAttachImages: (id: string, files: File[]) => void
  onRemoveImage: (projectId: string, imageId: string) => void
  onSaveNotes: (id: string, notes: string) => void
  onMoveProject: (id: string, seasonId: string, nominationId: string, start: string, end: string) => void
  onLogWords: (id: string, amount: number) => void
  onSaveName: (name: string) => Promise<void>
  onAvatarChange: (file: File) => Promise<void>
  onChangePassword: (password: string) => Promise<void>
}

export default function AppDialogs(props: Props) {
  const { modal, store, season, selectedProject, selectedNominationId, editingSeasonId, participantName, avatarUrl, userEmail, userId, canChangePassword, deleteConfirmation } = props
  const selectedNomination = season?.nominations.find((item) => item.id === selectedNominationId)
  const editingSeason = store.seasons.find((item) => item.id === editingSeasonId)
  const sourceSeason = selectedProject && store.seasons.find((item) => item.nominations.some((nomination) => nomination.id === selectedProject.nominationId))
  const targetNomination = selectedProject && store.seasons.flatMap((item) => item.nominations).find((item) => item.id === selectedProject.nominationId)

  return <>
    {modal && <Dialog title={modal === 'project-details' ? selectedProject?.title ?? 'Карточка работы' : modalTitle(modal)} onClose={props.onClose} confirmDiscard={['season', 'nomination', 'project', 'edit-project', 'project-details', 'edit-profile'].includes(modal)}>
      {modal === 'season' && <SeasonForm onSave={props.onAddSeason} />}
      {modal === 'edit-season' && editingSeason && <SeasonForm initial={editingSeason} onSave={(name, start, end) => props.onUpdateSeason(editingSeason.id, name, start, end)} />}
      {modal === 'nomination' && <NominationForm onSave={props.onAddNomination} />}
      {modal === 'edit-nomination' && selectedNomination && <EditNominationForm nomination={selectedNomination} onSave={props.onUpdateNomination} onDelete={props.onDeleteNomination} />}
      {modal === 'templates' && season && <TemplatePicker onChoose={props.onImportTemplate} existingNames={season.nominations.map((item) => item.name)} />}
      {modal === 'project' && season && <ProjectForm season={season} initialNominationId={selectedNominationId || undefined} onSave={props.onAddProject} />}
      {modal === 'edit-project' && selectedProject && season && <ProjectForm key={selectedProject.id} season={season} initial={selectedProject} onSave={(changes) => props.onUpdateProject(selectedProject.id, changes)} />}
      {modal === 'project-details' && selectedProject && <ProjectDetailsForm key={selectedProject.id} project={selectedProject} levelName={targetNomination?.name ?? ''} hardDeadline={targetNomination?.deadline ?? ''} attachments={selectedProject.attachments ?? []} storageUserId={userId} onAttachImages={(files) => props.onAttachImages(selectedProject.id, files)} onRemoveImage={(id) => props.onRemoveImage(selectedProject.id, id)} onSave={(notes) => props.onSaveNotes(selectedProject.id, notes)} />}
      {modal === 'move-project' && selectedProject && <MoveProjectForm project={selectedProject} seasons={store.seasons} sourceSeason={sourceSeason} onSave={(seasonId, nominationId, start, end) => props.onMoveProject(selectedProject.id, seasonId, nominationId, start, end)} />}
      {modal === 'log' && selectedProject && <LogForm project={selectedProject} onSave={(amount) => props.onLogWords(selectedProject.id, amount)} />}
      {modal === 'profile' && <ProfileDetails name={participantName} email={userEmail} avatarUrl={avatarUrl} />}
      {modal === 'edit-profile' && <ProfileEditForm key={participantName} initialName={participantName} email={userEmail} avatarUrl={avatarUrl} canChangePassword={canChangePassword} onSave={props.onSaveName} onAvatarChange={props.onAvatarChange} onChangePassword={props.onChangePassword} />}
    </Dialog>}
    {deleteConfirmation && <DeleteConfirmationDialog request={deleteConfirmation} onCancel={props.onDeleteCancel} onConfirm={props.onDeleteConfirm} />}
    {props.toast && <div className="toast">✓ &nbsp;{props.toast}</div>}
  </>
}
