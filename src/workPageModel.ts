import type { Task, WorkPageBlock, WorkPageBlockContent, WorkPageBlockType, WorkPageDefaultTab } from './types'

export const WORK_PAGE_SCHEMA_VERSION = 1
export const WORK_PAGE_RECOVERY_SUFFIX = '.workpage-recovery'
export const WORK_PAGE_AUTHOR = 'Local user'

const now = () => new Date().toISOString()

export const workPageId = (prefix = 'block') => `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36).slice(-5)}`

export const createWorkPageBlock = (type: WorkPageBlockType, content: WorkPageBlockContent = {}, options: Partial<WorkPageBlock> = {}): WorkPageBlock => {
  const timestamp = now()
  return {
    id: options.id ?? workPageId(type),
    type,
    content,
    createdAt: options.createdAt ?? timestamp,
    updatedAt: options.updatedAt ?? timestamp,
    authorLabel: options.authorLabel ?? WORK_PAGE_AUTHOR,
    collapsed: options.collapsed ?? false,
    tags: options.tags ?? [],
    linkedField: options.linkedField,
    attachmentIds: options.attachmentIds ?? content.attachmentIds ?? (content.attachmentId ? [content.attachmentId] : []),
  }
}

const templateBlocks = (task: Task): WorkPageBlock[] => {
  const type = task.workType.toLowerCase()
  if (type.includes('iteration') || type.includes('polish')) {
    return [
      createWorkPageBlock('heading1', { text: 'Polish pass' }),
      createWorkPageBlock('heading2', { text: 'Current issue' }),
      createWorkPageBlock('paragraph', { text: '' }),
      createWorkPageBlock('heading2', { text: 'Changes tried' }),
      createWorkPageBlock('bullet', { items: [''] }),
      createWorkPageBlock('heading2', { text: 'Comparison' }),
      createWorkPageBlock('gallery', { attachmentIds: [], galleryLayout: 'comparison', labels: ['Before', 'After'] }),
      createWorkPageBlock('heading2', { text: 'Latest feedback' }),
      createWorkPageBlock('paragraph', { text: '' }),
      createWorkPageBlock('heading2', { text: 'Next pass' }),
      createWorkPageBlock('paragraph', { text: task.nextAction || '' }),
    ]
  }
  if (type.includes('bug')) {
    return ['Bug report', 'Reproduction', 'Investigation log', 'Fix attempts', 'Verification'].flatMap((heading) => [createWorkPageBlock('heading2', { text: heading }), createWorkPageBlock('paragraph', { text: '' })])
  }
  if (type.includes('optimization')) {
    return [
      createWorkPageBlock('heading1', { text: 'Optimization pass' }),
      createWorkPageBlock('progress', { changed: task.optimization?.changes ?? '', result: task.optimization?.visualDifference ?? '', nextStep: task.nextAction ?? '', expandedSections: ['changed'] }),
      createWorkPageBlock('heading2', { text: 'Before / after comparison' }),
      createWorkPageBlock('gallery', { attachmentIds: [], galleryLayout: 'comparison', labels: ['Before optimization', 'After optimization'] }),
      createWorkPageBlock('heading2', { text: 'Visual trade-off' }),
      createWorkPageBlock('paragraph', { text: task.optimization?.visualDifference ?? '' }),
      createWorkPageBlock('heading2', { text: 'Verification' }),
      createWorkPageBlock('test', { text: task.optimization?.verification ?? '' }),
      createWorkPageBlock('issue', { text: task.optimization?.remainingLimitation ?? '' }),
      createWorkPageBlock('heading2', { text: 'Next step' }),
      createWorkPageBlock('paragraph', { text: task.nextAction ?? '' }),
    ]
  }
  if (type.includes('hookup') || type.includes('integration')) {
    return ['Expected event', 'Current hookup', 'Trigger notes', 'Test result', 'Open dependency'].flatMap((heading) => [createWorkPageBlock('heading2', { text: heading }), createWorkPageBlock('paragraph', { text: '' })])
  }
  if (type.includes('research') || type.includes('prototype')) {
    return ['Question', 'References', 'Experiments', 'Results', 'Potential production use'].flatMap((heading) => [createWorkPageBlock('heading2', { text: heading }), createWorkPageBlock('paragraph', { text: '' })])
  }
  return [
    createWorkPageBlock('heading1', { text: 'First-pass notes' }),
    createWorkPageBlock('heading2', { text: 'Intended read' }),
    createWorkPageBlock('paragraph', { text: task.requirements?.playerUnderstanding ?? '' }),
    createWorkPageBlock('heading2', { text: 'Visual direction' }),
    createWorkPageBlock('paragraph', { text: task.visualDirection ?? '' }),
    createWorkPageBlock('heading2', { text: 'References' }),
    createWorkPageBlock('reference', { text: '', label: 'Add a reference link' }),
    createWorkPageBlock('heading2', { text: 'Open questions' }),
    createWorkPageBlock('checklist', { items: task.requirements?.missingInfo ?? [], checked: (task.requirements?.missingInfo ?? []).map(() => false) }),
  ]
}

export const suggestedWorkPage = (task: Task): WorkPageBlock[] => templateBlocks(task)

const validTypes = new Set<WorkPageBlockType>(['paragraph', 'heading1', 'heading2', 'heading3', 'bullet', 'numbered', 'checklist', 'quote', 'callout', 'code', 'divider', 'image', 'gallery', 'progress', 'decision', 'issue', 'test', 'reference', 'linked'])

export const normalizeWorkPage = (raw: unknown, task: Task): WorkPageBlock[] => {
  if (!Array.isArray(raw)) return suggestedWorkPage(task)
  return raw.flatMap((value) => {
    if (!value || typeof value !== 'object') return []
    const item = value as Partial<WorkPageBlock>
    const type = validTypes.has(item.type as WorkPageBlockType) ? item.type as WorkPageBlockType : 'paragraph'
    const content = item.content && typeof item.content === 'object' ? item.content as WorkPageBlockContent : { text: typeof item.content === 'string' ? item.content : '' }
    return [createWorkPageBlock(type, content, {
      id: typeof item.id === 'string' && item.id ? item.id : undefined,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
      authorLabel: typeof item.authorLabel === 'string' ? item.authorLabel : WORK_PAGE_AUTHOR,
      collapsed: Boolean(item.collapsed),
      tags: Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === 'string') : [],
      linkedField: typeof item.linkedField === 'string' ? item.linkedField : undefined,
      attachmentIds: Array.isArray(item.attachmentIds) ? item.attachmentIds.filter((id): id is string => typeof id === 'string') : undefined,
    })]
  })
}

export const ensureWorkPage = (task: Task): Task => ({ ...task, workPage: task.workPage === undefined ? suggestedWorkPage(task) : normalizeWorkPage(task.workPage, task) })

export const defaultWorkPageTab = (value: unknown): WorkPageDefaultTab => value === 'Work Page' ? 'Work Page' : 'Overview'
