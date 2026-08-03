import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, ChevronDown, ChevronRight, Clipboard, Code2, Copy, Download, FileImage, GripVertical, Image as ImageIcon, Images, Link2, List, ListChecks, ListOrdered, Maximize2, MoreHorizontal, Paperclip, Plus, Quote, Redo2, RefreshCw, Search, Trash2, Type, Undo2, Upload, X } from 'lucide-react'
import type { AppData, Task, WorkPageAttachment, WorkPageBlock, WorkPageBlockContent, WorkPageBlockType, WorkPageDefaultTab, WorkPageGalleryLayout, WorkPageImageAlignment, WorkPageImageSize } from './types'
import { deleteAttachment, estimateAttachmentStorage, getAttachment, listAttachments, makeAttachment, putAttachment } from './attachmentStore'
import { createWorkPageBlock, defaultWorkPageTab, suggestedWorkPage, workPageId, WORK_PAGE_AUTHOR } from './workPageModel'
import { APP_MODE } from './appMode'
import { cn } from './utils'

export type WorkPagePromotionTarget = 'Next action' | 'Main blocker' | 'Current finding' | 'Feedback question' | 'Feedback decision' | 'Test result' | 'Submission summary' | 'Reflection lesson' | 'Family lesson' | 'Pipeline lesson'

interface WorkPageProps {
  task: Task
  data: AppData
  updateTask: (id: string, updater: (task: Task) => Task) => void
  onToast: (message: string) => void
  onPromote: (taskId: string, blockId: string, target: WorkPagePromotionTarget, text: string) => void
  onSetDefaultTab: (tab: WorkPageDefaultTab) => void
  onExportFullBackup?: () => void
  onImportFullBackup?: (file: File) => void
}

const BLOCK_LABELS: Array<{ type: WorkPageBlockType; label: string; icon: ReactNode }> = [
  { type: 'paragraph', label: 'Text', icon: <Type size={14} /> },
  { type: 'heading1', label: 'Heading 1', icon: <strong>H1</strong> },
  { type: 'heading2', label: 'Heading 2', icon: <strong>H2</strong> },
  { type: 'heading3', label: 'Heading 3', icon: <strong>H3</strong> },
  { type: 'bullet', label: 'Bulleted list', icon: <List size={14} /> },
  { type: 'numbered', label: 'Numbered list', icon: <ListOrdered size={14} /> },
  { type: 'checklist', label: 'Checklist', icon: <ListChecks size={14} /> },
  { type: 'quote', label: 'Quote', icon: <Quote size={14} /> },
  { type: 'callout', label: 'Callout', icon: <Paperclip size={14} /> },
  { type: 'code', label: 'Code / command', icon: <Code2 size={14} /> },
  { type: 'divider', label: 'Divider', icon: <MoreHorizontal size={14} /> },
  { type: 'progress', label: 'Progress update', icon: <RefreshCw size={14} /> },
  { type: 'decision', label: 'Decision', icon: <Clipboard size={14} /> },
  { type: 'issue', label: 'Issue', icon: <X size={14} /> },
  { type: 'test', label: 'Test result', icon: <ListChecks size={14} /> },
  { type: 'reference', label: 'Reference link', icon: <Link2 size={14} /> },
  { type: 'linked', label: 'Linked task data', icon: <Link2 size={14} /> },
]

const SLASH_COMMANDS = [
  ['text', 'paragraph'], ['h1', 'heading1'], ['h2', 'heading2'], ['h3', 'heading3'], ['bullet', 'bullet'], ['number', 'numbered'], ['todo', 'checklist'], ['callout', 'callout'], ['code', 'code'], ['divider', 'divider'], ['image', 'image'], ['gallery', 'gallery'], ['progress', 'progress'], ['decision', 'decision'], ['issue', 'issue'], ['test', 'test'], ['reference', 'reference'],
] as const

const PROMOTION_TARGETS: WorkPagePromotionTarget[] = ['Next action', 'Main blocker', 'Current finding', 'Feedback question', 'Feedback decision', 'Test result', 'Submission summary', 'Reflection lesson', 'Family lesson', 'Pipeline lesson']
const LINK_FIELDS = [
  ['Latest feedback', 'latestFeedback'], ['Latest changelist', 'latestChangelist'], ['Next action', 'nextAction'], ['Current blocker', 'blocker'], ['Test result', 'testing'], ['Submission summary', 'submission'],
] as const

const textFromBlock = (block: WorkPageBlock) => block.content.text || block.content.changed || block.content.result || block.content.nextStep || block.content.caption || block.content.url || block.content.label || ''

const contentForType = (type: WorkPageBlockType): WorkPageBlockContent => {
  if (type === 'bullet' || type === 'numbered' || type === 'checklist') return { items: [''], checked: [false] }
  if (type === 'progress') return { changed: '', result: '', nextStep: '', expandedSections: ['changed'] }
  if (type === 'divider') return {}
  if (type === 'image') return { attachmentId: '', imageSize: 'wide', alignment: 'center' }
  if (type === 'gallery') return { attachmentIds: [], galleryLayout: 'two-column' }
  if (type === 'reference') return { label: '', url: '' }
  if (type === 'linked') return { field: 'latestFeedback', staticCopy: false }
  return { text: '' }
}

const blockLabel = (type: WorkPageBlockType) => BLOCK_LABELS.find((item) => item.type === type)?.label ?? 'Block'

export default function WorkPage({ task, data, updateTask, onToast, onPromote, onSetDefaultTab, onExportFullBackup, onImportFullBackup }: WorkPageProps) {
  const [blocks, setBlocks] = useState<WorkPageBlock[]>(() => task.workPage ?? [])
  const [editingId, setEditingId] = useState('')
  const [saveState, setSaveState] = useState<'Saved locally' | 'Saving' | 'Save failed'>('Saved locally')
  const [outlineOpen, setOutlineOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [slash, setSlash] = useState<{ blockId: string; query: string; index: number } | null>(null)
  const [attachments, setAttachments] = useState<WorkPageAttachment[]>([])
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({})
  const [lightboxId, setLightboxId] = useState('')
  const [storageUsage, setStorageUsage] = useState<number | undefined>(undefined)
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(() => APP_MODE.publicDemo && localStorage.getItem(`${APP_MODE.storageKey}.workpage-privacy`) !== 'dismissed')
  const [recovery, setRecovery] = useState(false)
  const [draggedId, setDraggedId] = useState('')
  const [history, setHistory] = useState<WorkPageBlock[][]>([])
  const [future, setFuture] = useState<WorkPageBlock[][]>([])
  const blocksRef = useRef(blocks)
  const saveTimer = useRef<number | undefined>(undefined)
  const recoveryTimer = useRef<number | undefined>(undefined)
  const textRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    setBlocks(task.workPage ?? [])
    blocksRef.current = task.workPage ?? []
    setEditingId('')
    setHistory([])
    setFuture([])
    const recoveryKey = `${APP_MODE.storageKey}.workpage-recovery`
    try {
      const saved = JSON.parse(localStorage.getItem(recoveryKey) || 'null')
      setRecovery(Boolean(saved?.taskId === task.id && Array.isArray(saved?.blocks) && saved.blocks.length))
    } catch { setRecovery(false) }
    void listAttachments(task.id).then((items) => { if (!cancelled) setAttachments(items) }).catch(() => { if (!cancelled) onToast('Attachments are unavailable in this browser') })
    void estimateAttachmentStorage().then((usage) => { if (!cancelled) setStorageUsage(usage) })
    return () => { cancelled = true }
  }, [task.id])

  useEffect(() => {
    const nextUrls: Record<string, string> = {}
    attachments.forEach((attachment) => { nextUrls[attachment.id] = URL.createObjectURL(attachment.blob) })
    setAttachmentUrls(nextUrls)
    return () => Object.values(nextUrls).forEach((url) => URL.revokeObjectURL(url))
  }, [attachments])

  useEffect(() => () => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    if (recoveryTimer.current) window.clearTimeout(recoveryTimer.current)
    Object.values(attachmentUrls).forEach((url) => URL.revokeObjectURL(url))
  }, [attachmentUrls])

  const persist = (next: WorkPageBlock[], immediate = false) => {
    blocksRef.current = next
    setBlocks(next)
    setSaveState('Saving')
    const recoveryKey = `${APP_MODE.storageKey}.workpage-recovery`
    if (recoveryTimer.current) window.clearTimeout(recoveryTimer.current)
    recoveryTimer.current = window.setTimeout(() => {
      localStorage.setItem(recoveryKey, JSON.stringify({ taskId: task.id, savedAt: new Date().toISOString(), blocks: next }))
    }, 500)
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    const save = () => {
      try {
        updateTask(task.id, (current) => ({ ...current, workPage: next, updatedAt: new Date().toISOString() }))
        localStorage.removeItem(recoveryKey)
        setRecovery(false)
        setSaveState('Saved locally')
      } catch { setSaveState('Save failed') }
    }
    if (immediate) save()
    else saveTimer.current = window.setTimeout(save, 350)
  }

  const recordChange = (next: WorkPageBlock[], immediate = false) => {
    setHistory((current) => [...current.slice(-40), blocksRef.current])
    setFuture([])
    persist(next, immediate)
  }

  const undo = () => {
    const previous = history.at(-1)
    if (!previous) return
    setHistory((current) => current.slice(0, -1))
    setFuture((current) => [...current, blocksRef.current])
    persist(previous, true)
  }

  const redo = () => {
    const next = future.at(-1)
    if (!next) return
    setFuture((current) => current.slice(0, -1))
    setHistory((current) => [...current, blocksRef.current])
    persist(next, true)
  }

  const replaceBlock = (id: string, patch: Partial<WorkPageBlock> & { content?: WorkPageBlockContent }, immediate = false) => recordChange(blocksRef.current.map((block) => block.id === id ? { ...block, ...patch, content: patch.content ? { ...block.content, ...patch.content } : block.content, updatedAt: new Date().toISOString() } : block), immediate)
  const addBlock = (type: WorkPageBlockType, afterId?: string, content = contentForType(type)) => {
    const block = createWorkPageBlock(type, content)
    const index = afterId ? blocksRef.current.findIndex((item) => item.id === afterId) + 1 : blocksRef.current.length
    const next = [...blocksRef.current]
    next.splice(Math.max(0, index), 0, block)
    recordChange(next, true)
    setEditingId(block.id)
    setAddOpen(false)
    setTimeout(() => textRefs.current[block.id]?.focus(), 0)
  }

  const removeBlock = async (block: WorkPageBlock) => {
    const ids = block.attachmentIds ?? block.content.attachmentIds ?? (block.content.attachmentId ? [block.content.attachmentId] : [])
    if (ids.length) {
      const choice = window.prompt('Remove this image block: type KEEP to keep the attachment, or DELETE to permanently delete it.')?.toUpperCase()
      if (choice !== 'KEEP' && choice !== 'DELETE') return
      if (choice === 'DELETE') await Promise.all(ids.map((id) => deleteAttachment(id)))
    } else if (!window.confirm('Remove this block?')) return
    setAttachments((current) => ids.length ? current.filter((item) => !ids.includes(item.id)) : current)
    recordChange(blocksRef.current.filter((item) => item.id !== block.id), true)
    setEditingId('')
  }

  const moveBlock = (id: string, direction: -1 | 1) => {
    const index = blocksRef.current.findIndex((block) => block.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= blocksRef.current.length) return
    const next = [...blocksRef.current]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    recordChange(next, true)
  }

  const reorderBlock = (id: string, targetId: string) => {
    if (id === targetId) return
    const next = [...blocksRef.current]
    const from = next.findIndex((item) => item.id === id)
    const to = next.findIndex((item) => item.id === targetId)
    if (from < 0 || to < 0) return
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    recordChange(next, true)
  }

  const updateText = (block: WorkPageBlock, text: string) => {
    const content = block.type === 'progress' ? { changed: text } : { text }
    replaceBlock(block.id, { content })
    const queryMatch = text.match(/(?:^|\n)\s*\/([a-z]*)$/i)
    setSlash(queryMatch ? { blockId: block.id, query: queryMatch[1].toLowerCase(), index: 0 } : null)
  }

  const splitBlock = (block: WorkPageBlock, textarea: HTMLTextAreaElement) => {
    const value = textarea.value
    const before = value.slice(0, textarea.selectionStart)
    const after = value.slice(textarea.selectionEnd)
    replaceBlock(block.id, { content: { text: before } }, true)
    const next = createWorkPageBlock(block.type, { ...block.content, text: after })
    const index = blocksRef.current.findIndex((item) => item.id === block.id)
    const list = [...blocksRef.current]
    list.splice(index + 1, 0, next)
    recordChange(list, true)
    setEditingId(next.id)
    setTimeout(() => textRefs.current[next.id]?.focus(), 0)
  }

  const onTextKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>, block: WorkPageBlock, index: number) => {
    if (slash && slash.blockId === block.id) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setSlash({ ...slash, index: Math.max(0, Math.min(filteredSlash.length - 1, slash.index + (event.key === 'ArrowDown' ? 1 : -1))) }); return }
      if (event.key === 'Enter') { event.preventDefault(); const command = filteredSlash[slash.index]; if (command) applySlash(command[1] as WorkPageBlockType, block); return }
      if (event.key === 'Escape') { event.preventDefault(); setSlash(null); return }
    }
    if (event.key === 'Enter' && !event.shiftKey && block.type !== 'code') { event.preventDefault(); splitBlock(block, event.currentTarget); return }
    if (event.key === 'Backspace' && !event.currentTarget.value && index > 0) { event.preventDefault(); removeBlock(block); setEditingId(blocksRef.current[index - 1].id); setTimeout(() => textRefs.current[blocksRef.current[index - 1].id]?.focus(), 0) }
  }

  const filteredSlash = useMemo(() => SLASH_COMMANDS.filter(([name]) => name.includes(slash?.query ?? '')), [slash?.query])
  const applySlash = (type: WorkPageBlockType, source?: WorkPageBlock) => {
    if (source) {
      const sourceIndex = blocksRef.current.findIndex((item) => item.id === source.id)
      const list = [...blocksRef.current]
      list.splice(sourceIndex, 1, createWorkPageBlock(type, contentForType(type), { id: source.id, createdAt: source.createdAt }))
      recordChange(list, true)
    } else addBlock(type)
    setSlash(null)
  }

  const loadImageDimensions = (file: Blob): Promise<{ width?: number; height?: number }> => new Promise((resolve) => {
    if (!file.type.startsWith('image/')) { resolve({}); return }
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => { resolve({ width: image.naturalWidth, height: image.naturalHeight }); URL.revokeObjectURL(url) }
    image.onerror = () => { URL.revokeObjectURL(url); resolve({}) }
    image.src = url
  })

  const insertFiles = async (files: File[], source: WorkPageAttachment['source']) => {
    const images = files.filter((file) => file.type.startsWith('image/'))
    if (!images.length) { onToast('Only PNG, JPEG, WebP, and GIF images can be added'); return }
    try {
      const stored = await Promise.all(images.map(async (file) => makeAttachment(task.id, file, source, { fileName: file.name, ...(await loadImageDimensions(file)) })))
      await Promise.all(stored.map(putAttachment))
      setAttachments((current) => [...current, ...stored])
      const ids = stored.map((item) => item.id)
      if (ids.length === 1) addBlock('image', editingId || undefined, { attachmentId: ids[0], attachmentIds: ids, imageSize: 'wide', alignment: 'center', caption: stored[0].fileName, altText: stored[0].fileName })
      else addBlock('gallery', editingId || undefined, { attachmentIds: ids, galleryLayout: 'two-column', labels: ids.map((_, index) => index === 0 ? 'Before' : index === 1 ? 'After' : '') })
      setStorageUsage(await estimateAttachmentStorage())
      onToast(`${stored.length} image${stored.length === 1 ? '' : 's'} added to Work Page`)
    } catch { onToast('The image could not be saved locally') }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const files = Array.from(event.clipboardData.files)
    if (files.length) { event.preventDefault(); void insertFiles(files, 'Clipboard') }
  }
  const handleDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); void insertFiles(Array.from(event.dataTransfer.files), 'Drag and drop') }

  const linkedValue = (field: string) => {
    if (field === 'latestFeedback') return task.latestFeedback || 'No feedback recorded yet.'
    if (field === 'latestChangelist') return task.latestChangelist || task.submission.changelist || 'No changelist recorded yet.'
    if (field === 'nextAction') return task.nextAction || 'No next action recorded yet.'
    if (field === 'blocker') return task.blocker || 'No current blocker recorded.'
    if (field === 'testing') return task.submission.testResult || task.testingInstructions.knownIssue || 'No test result recorded yet.'
    if (field === 'submission') return task.submission.description || 'No submission summary recorded yet.'
    return 'No linked value recorded yet.'
  }

  const addLinkedBlock = (field: string) => { addBlock('linked', undefined, { field, label: LINK_FIELDS.find((item) => item[1] === field)?.[0] ?? field, taskId: task.id, staticCopy: false }); setLinkOpen(false) }
  const copyBlockToRelatedTask = async (block: WorkPageBlock) => {
    const related = data.tasks.filter((candidate) => candidate.id !== task.id && ((candidate.familyId && candidate.familyId === task.familyId) || task.relationships.some((relation) => relation.targetTaskId === candidate.id || relation.sourceTaskId === candidate.id)))
    const candidates = related.length ? related : data.tasks.filter((candidate) => candidate.id !== task.id)
    if (!candidates.length) { onToast('Create a related task before copying this block'); return }
    const targetId = window.prompt(`Copy this block to a task. Enter a task ID:\n\n${candidates.map((candidate) => `${candidate.id} — ${candidate.name}`).join('\n')}`, candidates[0].id)?.trim()
    const target = candidates.find((candidate) => candidate.id === targetId)
    if (!target) return
    const sourceIds = block.attachmentIds ?? block.content.attachmentIds ?? (block.content.attachmentId ? [block.content.attachmentId] : [])
    const mapping = new Map<string, string>()
    const copiedAttachments = attachments.filter((attachment) => sourceIds.includes(attachment.id)).map((attachment) => { const id = `attachment-${Math.random().toString(36).slice(2, 10)}`; mapping.set(attachment.id, id); return { ...attachment, id, taskId: target.id, source: 'Imported backup' as const, updatedAt: new Date().toISOString() } })
    await Promise.all(copiedAttachments.map(putAttachment))
    const copied: WorkPageBlock = { ...block, id: workPageId('block-copy'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), attachmentIds: sourceIds.map((id) => mapping.get(id) ?? id), content: { ...block.content, attachmentId: block.content.attachmentId ? mapping.get(block.content.attachmentId) ?? block.content.attachmentId : block.content.attachmentId, attachmentIds: block.content.attachmentIds?.map((id) => mapping.get(id) ?? id) } }
    updateTask(target.id, (current) => ({ ...current, workPage: [...(current.workPage ?? []), copied], updatedAt: new Date().toISOString() }))
    onToast(`Copied block to ${target.name}`)
  }
  const referencedIds = useMemo(() => new Set(blocks.flatMap((block) => block.attachmentIds ?? block.content.attachmentIds ?? (block.content.attachmentId ? [block.content.attachmentId] : []))), [blocks])
  const unusedAttachments = attachments.filter((attachment) => !referencedIds.has(attachment.id))
  const headings = blocks.filter((block) => ['heading1', 'heading2', 'heading3'].includes(block.type) && textFromBlock(block).trim())
  const lightboxAttachment = attachments.find((attachment) => attachment.id === lightboxId)

  const recoverDraft = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(`${APP_MODE.storageKey}.workpage-recovery`) || 'null')
      if (saved?.taskId === task.id && Array.isArray(saved.blocks)) { recordChange(saved.blocks, true); setRecovery(false); onToast('Recovered unsaved Work Page edits') }
    } catch { onToast('The recovery draft could not be restored') }
  }

  const renderTextBlock = (block: WorkPageBlock, index: number) => {
    const value = block.type === 'progress' ? block.content.changed ?? '' : block.content.text ?? ''
    const placeholder = block.type.startsWith('heading') ? 'Untitled heading' : block.type === 'code' ? 'Paste a command or code note' : 'Type here, or use / for a block command'
    if (editingId === block.id || !value.trim()) return <><textarea ref={(element) => { textRefs.current[block.id] = element }} autoFocus={editingId === block.id} value={value} onChange={(event) => updateText(block, event.target.value)} onKeyDown={(event) => onTextKeyDown(event, block, index)} onPaste={(event) => { if (event.clipboardData.files.length) { event.preventDefault(); void insertFiles(Array.from(event.clipboardData.files), 'Clipboard') } }} onBlur={() => { setEditingId(''); setSlash(null) }} placeholder={placeholder} rows={block.type === 'code' ? 4 : block.type.startsWith('heading') ? 1 : 3} className={cn('workpage-textarea', block.type)} />{slash?.blockId === block.id && <SlashMenu commands={filteredSlash} activeIndex={slash.index} onChoose={(type) => applySlash(type, block)} />}</>
    return <button className={cn('workpage-display', block.type)} onClick={() => setEditingId(block.id)}>{value || <span className="muted">{placeholder}</span>}</button>
  }

  const renderListBlock = (block: WorkPageBlock) => {
    const items = block.content.items ?? ['']
    const checked = block.content.checked ?? items.map(() => false)
    return <div className={cn('workpage-list', block.type)}>{items.map((item, index) => <div className="workpage-list-row" key={`${block.id}-${index}`}>{block.type === 'checklist' ? <input type="checkbox" checked={Boolean(checked[index])} onChange={(event) => replaceBlock(block.id, { content: { checked: checked.map((value, itemIndex) => itemIndex === index ? event.target.checked : value) } })} /> : <span>{block.type === 'numbered' ? `${index + 1}.` : '•'}</span>}<input value={item} onChange={(event) => replaceBlock(block.id, { content: { items: items.map((value, itemIndex) => itemIndex === index ? event.target.value : value) } })} placeholder="List item" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); replaceBlock(block.id, { content: { items: [...items, ''], checked: [...checked, false] } }, true) } if (event.key === 'Backspace' && !item && items.length > 1) { event.preventDefault(); replaceBlock(block.id, { content: { items: items.filter((_, itemIndex) => itemIndex !== index), checked: checked.filter((_, itemIndex) => itemIndex !== index) } }, true) } }} /></div>)}</div>
  }

  const renderProgress = (block: WorkPageBlock) => {
    const expanded = block.content.expandedSections ?? ['changed']
    const toggle = (section: string) => replaceBlock(block.id, { content: { expandedSections: expanded.includes(section) ? expanded.filter((item) => item !== section) : [...expanded, section] } }, true)
    return <div className="workpage-progress"><div className="workpage-progress-title"><RefreshCw size={14} /><strong>Progress update · {new Date(block.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong></div>{(['changed', 'result', 'nextStep'] as const).map((section) => <div className={cn('progress-section', expanded.includes(section) && 'open')} key={section}><button onClick={() => toggle(section)}><ChevronRight size={13} />{section === 'changed' ? 'What I changed' : section === 'result' ? 'Result' : 'Next step'}</button>{expanded.includes(section) && <textarea value={block.content[section] ?? ''} onChange={(event) => replaceBlock(block.id, { content: { [section]: event.target.value } })} placeholder={section === 'changed' ? 'Describe the useful change…' : section === 'result' ? 'What did you learn or observe?' : 'What happens next?'} rows={3} />}</div>)}</div>
  }

  const renderImage = (block: WorkPageBlock) => {
    const id = block.content.attachmentId
    const attachment = attachments.find((item) => item.id === id)
    const url = id ? attachmentUrls[id] : undefined
    return <div className={cn('workpage-image-block', block.content.imageSize ?? 'wide', block.content.alignment ?? 'center')}>
      {url ? <button className="workpage-image-button" onClick={() => id && setLightboxId(id)}><img src={url} loading="lazy" alt={block.content.altText || attachment?.altText || block.content.caption || attachment?.fileName || 'Work Page image'} /></button> : <button className="workpage-image-empty" onClick={() => fileInputRef.current?.click()}><ImageIcon size={22} /><span>Add an image from clipboard, drop, or file picker</span></button>}
      <input value={block.content.caption ?? ''} onChange={(event) => replaceBlock(block.id, { content: { caption: event.target.value } })} placeholder="Caption" />
      <input value={block.content.altText ?? ''} onChange={(event) => replaceBlock(block.id, { content: { altText: event.target.value } })} placeholder="Alt text" />
      <div className="workpage-image-tools"><SelectCompact value={block.content.imageSize ?? 'wide'} options={['small', 'medium', 'wide', 'full']} onChange={(value) => replaceBlock(block.id, { content: { imageSize: value as WorkPageImageSize } }, true)} /><span className="image-align-tools"><button title="Align left" onClick={() => replaceBlock(block.id, { content: { alignment: 'left' } }, true)}><AlignLeft size={13} /></button><button title="Align center" onClick={() => replaceBlock(block.id, { content: { alignment: 'center' } }, true)}><AlignCenter size={13} /></button><button title="Align right" onClick={() => replaceBlock(block.id, { content: { alignment: 'right' } }, true)}><AlignRight size={13} /></button></span>{url && <><button title="Download original" onClick={() => downloadFile(url, attachment?.fileName || 'vfx-capture')}><Download size={13} /></button><button title="Copy image" onClick={() => void copyImage(attachment?.blob, onToast)}><Copy size={13} /></button></>}</div>
    </div>
  }

  const renderGallery = (block: WorkPageBlock) => <div className={cn('workpage-gallery', block.content.galleryLayout ?? 'two-column')}>
    {(block.content.attachmentIds ?? []).map((id, index) => { const attachment = attachments.find((item) => item.id === id); const url = attachmentUrls[id]; return <figure key={id}>{url ? <button onClick={() => setLightboxId(id)}><img src={url} loading="lazy" alt={attachment?.altText || attachment?.fileName || 'Gallery image'} /></button> : <div className="workpage-image-empty"><ImageIcon size={18} /></div>}<input value={block.content.labels?.[index] ?? ''} onChange={(event) => replaceBlock(block.id, { content: { labels: (block.content.labels ?? []).map((value, labelIndex) => labelIndex === index ? event.target.value : value) } })} placeholder="Label" /><figcaption><input value={attachment?.caption ?? ''} onChange={(event) => { if (!attachment) return; const next = { ...attachment, caption: event.target.value, updatedAt: new Date().toISOString() }; setAttachments((current) => current.map((item) => item.id === id ? next : item)); void putAttachment(next) }} placeholder="Caption" /></figcaption></figure> })}
    {!block.content.attachmentIds?.length && <button className="workpage-image-empty" onClick={() => fileInputRef.current?.click()}><Images size={20} /><span>Add multiple images for a comparison</span></button>}
    <SelectCompact value={block.content.galleryLayout ?? 'two-column'} options={['two-column', 'three-column', 'comparison']} onChange={(value) => replaceBlock(block.id, { content: { galleryLayout: value as WorkPageGalleryLayout } }, true)} />
  </div>

  const renderBlock = (block: WorkPageBlock, index: number) => {
    if (block.type === 'divider') return <div className="workpage-divider" />
    if (block.type === 'image') return renderImage(block)
    if (block.type === 'gallery') return renderGallery(block)
    if (block.type === 'progress') return renderProgress(block)
    if (['bullet', 'numbered', 'checklist'].includes(block.type)) return renderListBlock(block)
    if (block.type === 'linked') return <div className="workpage-linked-block"><Link2 size={15} /><div><span>{block.content.label || 'Linked task data'}</span><strong>{block.content.staticCopy ? textFromBlock(block) : linkedValue(block.content.field || '')}</strong></div><button onClick={() => replaceBlock(block.id, { content: { staticCopy: !block.content.staticCopy, text: linkedValue(block.content.field || '') } }, true)}>{block.content.staticCopy ? 'Make live' : 'Make static'}</button></div>
    return renderTextBlock(block, index)
  }

  const isHiddenByHeading = (index: number) => {
    let hidden = false
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      const previous = blocks[cursor]
      if (previous.type === 'heading1' || previous.type === 'heading2' || previous.type === 'heading3') {
        hidden = Boolean(previous.collapsed)
        break
      }
    }
    return hidden
  }

  return <div className="workpage-shell" onPaste={handlePaste} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
    {showPrivacyNotice && <div className="workpage-privacy-notice"><Paperclip size={15} /><span>Work Pages and pasted images stay only in this browser. Avoid confidential production information in a publicly hosted copy.</span><button onClick={() => { localStorage.setItem(`${APP_MODE.storageKey}.workpage-privacy`, 'dismissed'); setShowPrivacyNotice(false) }}>Dismiss</button></div>}
    <div className="workpage-toolbar"><div><p className="panel-kicker">WORK PAGE</p><h2>Working documentation</h2><p className="muted-copy">Capture experiments, screenshots, findings, and decisions without forcing them into a form.</p></div><div className="workpage-toolbar-actions"><span className={cn('workpage-save-state', saveState === 'Save failed' && 'failed')}><span />{saveState}</span><label className="workpage-default-tab"><span>Open task with</span><select value={defaultWorkPageTab(data.preferences?.defaultTaskTab)} onChange={(event) => onSetDefaultTab(event.target.value as WorkPageDefaultTab)}><option>Overview</option><option>Work Page</option></select></label><button className="secondary-button" onClick={() => setOutlineOpen(!outlineOpen)}><List size={14} />Outline</button><button className="secondary-button" onClick={undo} disabled={!history.length}><Undo2 size={14} /></button><button className="secondary-button" onClick={redo} disabled={!future.length}><Redo2 size={14} /></button><button className="primary-button" onClick={() => addBlock('progress')}><Plus size={14} />Add progress update</button></div></div>
    {recovery && <div className="workpage-recovery"><RefreshCw size={15} /><span>Unsaved Work Page edits were recovered from this browser.</span><button className="primary-button" onClick={recoverDraft}>Restore</button><button className="ghost-button" onClick={() => { localStorage.removeItem(`${APP_MODE.storageKey}.workpage-recovery`); setRecovery(false) }}>Discard</button></div>}
    <div className="workpage-layout"><main className="workpage-document"><div className="workpage-empty-actions">{!blocks.length && <><p>Start this Work Page blank, or use a lightweight layout for {task.workType}.</p><button className="secondary-button" onClick={() => recordChange(suggestedWorkPage(task), true)}>Use suggested layout</button><button className="ghost-button" onClick={() => addBlock('paragraph')}>Start blank</button></>}</div>{blocks.map((block, index) => isHiddenByHeading(index) ? null : <article key={block.id} className={cn('workpage-block', block.type, editingId === block.id && 'editing')} draggable onDragStart={() => setDraggedId(block.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.stopPropagation(); if (draggedId) reorderBlock(draggedId, block.id); setDraggedId('') }}><div className="workpage-block-gutter"><button className="workpage-drag-handle" title="Drag to reorder"><GripVertical size={15} /></button><span>{blockLabel(block.type)}</span></div><div className="workpage-block-content">{['heading1', 'heading2', 'heading3'].includes(block.type) && <button className="workpage-collapse-button" title={block.collapsed ? 'Expand section' : 'Collapse section'} onClick={() => replaceBlock(block.id, { collapsed: !block.collapsed }, true)}>{block.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}</button>}{renderBlock(block, index)}<div className="workpage-block-actions"><button title="Move up" onClick={() => moveBlock(block.id, -1)}><ArrowUp size={12} /></button><button title="Move down" onClick={() => moveBlock(block.id, 1)}><ArrowDown size={12} /></button><select aria-label="Promote block" value="" onChange={(event) => { if (event.target.value) onPromote(task.id, block.id, event.target.value as WorkPagePromotionTarget, textFromBlock(block)) }}><option value="">Promote to…</option>{PROMOTION_TARGETS.map((target) => <option key={target}>{target}</option>)}</select><button title="Delete block" onClick={() => void removeBlock(block)}><Trash2 size={12} /></button></div></div></article>)}<button className="workpage-add-block" onClick={() => setAddOpen(!addOpen)}><Plus size={15} />Add block</button>{addOpen && <div className="workpage-add-menu">{BLOCK_LABELS.map((item) => <button key={item.type} onClick={() => addBlock(item.type)}>{item.icon}<span>{item.label}</span></button>)}</div>}<div className="workpage-insert-row"><button className="secondary-button" onClick={() => setLinkOpen(!linkOpen)}><Link2 size={14} />Insert linked information</button>{linkOpen && <div className="workpage-link-menu">{LINK_FIELDS.map(([label, field]) => <button key={field} onClick={() => addLinkedBlock(field)}>{label}</button>)}</div>}<label className="secondary-button workpage-file-button"><Upload size={14} />Add images<input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={(event: ChangeEvent<HTMLInputElement>) => { if (event.target.files) void insertFiles(Array.from(event.target.files), 'File picker'); event.target.value = '' }} /></label></div><div className="workpage-storage-strip"><span><Images size={13} />{attachments.length} attachment{attachments.length === 1 ? '' : 's'} · {storageUsage ? `${Math.round(storageUsage / 1024 / 1024)} MB browser storage used` : 'IndexedDB local storage'}</span>{unusedAttachments.length > 0 && <button className="ghost-button" onClick={async () => { if (!window.confirm(`Delete ${unusedAttachments.length} unused attachment${unusedAttachments.length === 1 ? '' : 's'}?`)) return; await Promise.all(unusedAttachments.map((item) => deleteAttachment(item.id))); setAttachments((current) => current.filter((item) => referencedIds.has(item.id))); setStorageUsage(await estimateAttachmentStorage()); onToast('Unused attachments deleted') }}>Find and remove unused</button>}{onExportFullBackup && <button className="ghost-button" onClick={onExportFullBackup}>Export full backup</button>}{onImportFullBackup && <label className="ghost-button workpage-file-button">Import full backup<input type="file" accept=".zip,application/zip" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImportFullBackup(file); event.target.value = '' }} /></label>}</div></main>{outlineOpen && <aside className="workpage-outline"><div className="workpage-outline-head"><strong>Outline</strong><button onClick={() => setOutlineOpen(false)}><X size={14} /></button></div>{headings.length ? headings.map((heading) => <button key={heading.id} className={heading.type} onClick={() => { document.getElementById(`workpage-${heading.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setEditingId(heading.id) }}>{textFromBlock(heading)}</button>) : <p className="muted-copy">Add headings to create an outline.</p>}<button className="ghost-button" onClick={() => recordChange(blocks.map((block) => ['heading1', 'heading2', 'heading3'].includes(block.type) ? { ...block, collapsed: false } : block), true)}>Expand all sections</button><button className="ghost-button" onClick={() => recordChange(blocks.map((block) => ['heading1', 'heading2', 'heading3'].includes(block.type) ? { ...block, collapsed: true } : block), true)}>Collapse all sections</button></aside>}</div>{lightboxAttachment && attachmentUrls[lightboxAttachment.id] && <div className="workpage-lightbox" role="dialog" aria-modal="true" onClick={() => setLightboxId('')}><button onClick={() => setLightboxId('')}><X size={18} /></button><img src={attachmentUrls[lightboxAttachment.id]} alt={lightboxAttachment.altText || lightboxAttachment.fileName} onClick={(event) => event.stopPropagation()} /></div>}</div>
}

function SlashMenu({ commands, activeIndex, onChoose }: { commands: readonly (readonly [string, string])[]; activeIndex: number; onChoose: (type: WorkPageBlockType) => void }) { return <div className="workpage-slash-menu">{commands.length ? commands.map(([name, type], index) => <button className={cn(index === activeIndex && 'active')} key={name} onMouseDown={(event) => event.preventDefault()} onClick={() => onChoose(type as WorkPageBlockType)}><span>/{name}</span><small>{blockLabel(type as WorkPageBlockType)}</small></button>) : <span>No matching blocks</span>}</div> }
function SelectCompact({ value, options, onChange }: { value: string; options: readonly string[]; onChange: (value: string) => void }) { return <select className="workpage-compact-select" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select> }
function downloadFile(url: string, fileName: string) { const anchor = document.createElement('a'); anchor.href = url; anchor.download = fileName; anchor.click() }
async function copyImage(blob: Blob | undefined, onToast: (message: string) => void) { if (!blob || !navigator.clipboard?.write || typeof ClipboardItem === 'undefined') { onToast('Image copy is unavailable in this browser'); return } try { await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]); onToast('Image copied') } catch { onToast('Image copy is unavailable in this browser') } }
