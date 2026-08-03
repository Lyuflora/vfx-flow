import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import type { AppData, WorkPageAttachment } from './types'
import { listAttachments } from './attachmentStore'

export const WORKSPACE_BACKUP_SCHEMA = 1

export interface BackupAttachmentManifest {
  id: string
  taskId: string
  fileName: string
  mimeType: string
  fileSize: number
  width?: number
  height?: number
  createdAt: string
  updatedAt: string
  source: WorkPageAttachment['source']
  caption?: string
  altText?: string
  path: string
}

export interface FullWorkspaceBackup {
  data: unknown
  attachments: WorkPageAttachment[]
  manifest: BackupAttachmentManifest[]
}

const safeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]+/g, '_') || 'attachment.bin'

export const buildFullWorkspaceBackup = async (data: AppData, applicationVersion: string): Promise<Blob> => {
  const attachments = await listAttachments()
  const manifest: BackupAttachmentManifest[] = attachments.map((attachment) => ({
    id: attachment.id,
    taskId: attachment.taskId,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    fileSize: attachment.fileSize,
    width: attachment.width,
    height: attachment.height,
    createdAt: attachment.createdAt,
    updatedAt: attachment.updatedAt,
    source: attachment.source,
    caption: attachment.caption,
    altText: attachment.altText,
    path: `vfx-flow-backup/attachments/${attachment.id}-${safeFileName(attachment.fileName)}`,
  }))
  const files: Record<string, Uint8Array> = {
    'vfx-flow-backup/workspace.json': strToU8(JSON.stringify({ exportDate: new Date().toISOString(), applicationVersion, schemaVersion: WORKSPACE_BACKUP_SCHEMA, ...data }, null, 2)),
    'vfx-flow-backup/attachments-manifest.json': strToU8(JSON.stringify({ schemaVersion: WORKSPACE_BACKUP_SCHEMA, attachments: manifest }, null, 2)),
  }
  await Promise.all(attachments.map(async (attachment, index) => { files[manifest[index].path] = new Uint8Array(await attachment.blob.arrayBuffer()) }))
  return new Blob([zipSync(files, { level: 6 })], { type: 'application/zip' })
}

export const readFullWorkspaceBackup = async (file: File): Promise<FullWorkspaceBackup> => {
  const archive = unzipSync(new Uint8Array(await file.arrayBuffer()))
  const workspaceEntry = Object.entries(archive).find(([path]) => path.endsWith('/workspace.json') || path === 'workspace.json')?.[1]
  if (!workspaceEntry) throw new Error('This backup does not contain workspace.json')
  const data = JSON.parse(strFromU8(workspaceEntry)) as Record<string, unknown>
  if (!Array.isArray(data.tasks) || !Array.isArray(data.templates)) throw new Error('The workspace metadata is invalid')
  const manifestEntry = Object.entries(archive).find(([path]) => path.endsWith('/attachments-manifest.json') || path === 'attachments-manifest.json')?.[1]
  const manifestValue = manifestEntry ? JSON.parse(strFromU8(manifestEntry)) as { attachments?: BackupAttachmentManifest[] } : { attachments: [] }
  const attachments = (manifestValue.attachments ?? []).flatMap((item) => {
    const bytes = archive[item.path]
    if (!bytes) return []
    return [{ id: item.id, taskId: item.taskId, fileName: item.fileName, mimeType: item.mimeType, fileSize: item.fileSize, width: item.width, height: item.height, createdAt: item.createdAt, updatedAt: item.updatedAt, source: 'Imported backup' as const, blob: new Blob([bytes], { type: item.mimeType }), caption: item.caption, altText: item.altText }]
  })
  return { data, attachments, manifest: manifestValue.attachments ?? [] }
}

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const remapAttachmentReferences = (data: AppData, attachments: WorkPageAttachment[], existingIds: Set<string>) => {
  const mapping = new Map<string, string>()
  const nextAttachments = attachments.map((attachment) => {
    let id = attachment.id
    while (existingIds.has(id) || mappingHasValue(mapping, id)) id = `${attachment.id}-${Math.random().toString(36).slice(2, 7)}`
    mapping.set(attachment.id, id)
    existingIds.add(id)
    return { ...attachment, id }
  })
  const nextData: AppData = JSON.parse(JSON.stringify(data)) as AppData
  nextData.tasks = nextData.tasks.map((task) => ({ ...task, workPage: task.workPage?.map((block) => ({ ...block, attachmentIds: block.attachmentIds?.map((id) => mapping.get(id) ?? id), content: { ...block.content, attachmentId: block.content.attachmentId ? mapping.get(block.content.attachmentId) ?? block.content.attachmentId : block.content.attachmentId, attachmentIds: block.content.attachmentIds?.map((id) => mapping.get(id) ?? id) } })) }))
  return { data: nextData, attachments: nextAttachments }
}

const mappingHasValue = (mapping: Map<string, string>, value: string) => Array.from(mapping.values()).includes(value)
