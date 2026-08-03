import type { MessageFormat, MessageTone, MessageType, Task } from './types'

export const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ')

export const formatRelative = (iso: string) => {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export const formatDate = (value: string) => value ? new Date(`${value.includes('T') ? value : `${value}T12:00:00`}`).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

export const dueLabel = (value: string) => {
  if (!value) return 'No target date'
  const date = new Date(`${value}T12:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.ceil((date.getTime() - today.getTime()) / 86400000)
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days}d`
}

export const stageClass = (stage: string) => stage.toLowerCase().replaceAll(' ', '-').replaceAll('—', '')

export const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()

export const buildClarificationMessage = (task: Task) => {
  const labels = task.requirements.missingInfo
  if (!labels.length) return 'The request is clear enough to start the first pass. I’ll follow up if anything changes during implementation.'
  const phrases = labels.slice(0, 4).map((label) => {
    const map: Record<string, string> = {
      'Trigger is unclear': 'the exact trigger event',
      'Timing is unclear': 'the intended timing',
      'Location is unclear': 'the exact location',
      'Gameplay purpose is unclear': 'what the player should understand',
      'Visual reference is missing': 'a visual reference',
      'Required states are unclear': 'the required states',
      'Owner for final approval is unclear': 'who owns final approval',
      'Testing method is unclear': 'how this should be tested',
      'Performance target is unclear': 'the performance target',
      'Audio dependency is unclear': 'the audio dependency',
    }
    return map[label] ?? label.toLowerCase()
  })
  const list = phrases.length === 1 ? phrases[0] : `${phrases.slice(0, -1).join(', ')}, and ${phrases.at(-1)}`
  return `Before I start the pass, could you confirm ${list}? This will help me scope the first implementation correctly.`
}

export const buildFeedbackMessage = (task: Task, feedback?: Task['feedback'][number]) => {
  const item = feedback ?? task.feedback[0]
  const question = item?.question || 'whether the gameplay timing and readability feel correct'
  return `Hey${item?.requestedFrom ? ` ${item.requestedFrom}` : ''}, I have a focused pass on ${task.name} ready. I mainly want to confirm ${question.replace(/[?]+$/, '')}. ${item?.previewLink || 'Preview link: [link]'}`
}

export const buildChangelistDescription = (task: Task) => {
  const main = task.submission.description || task.visualDirection || `Updated the ${task.name} effect.`
  const testing = task.submission.testResult || 'Tested the effect in-game.'
  return `${main.trim().replace(/[.]+$/, '')}. ${testing.trim().replace(/[.]+$/, '')}.`
}

const toneTail = (tone: MessageTone) => ({
  'Friendly and casual': ' Let me know if anything else comes up.',
  Neutral: '',
  Concise: '',
  'More detailed': ' I’ve captured the current scope and next check in the task workspace.',
}[tone])

export const buildMessage = (task: Task, type: MessageType, tone: MessageTone, format: MessageFormat) => {
  const submission = task.submission.changelist ? ` CL ${task.submission.changelist}` : ' the latest changelist'
  const base = (() => {
    switch (type) {
      case 'Clarification request': return buildClarificationMessage(task)
      case 'First-pass update': return `First pass is ready for ${task.name}. I focused on ${task.visualDirection || 'the core gameplay read'} and captured the current testing path.`
      case 'Feedback request': return buildFeedbackMessage(task)
      case 'Progress update': return `${task.name} is currently in ${task.stage}. ${task.nextAction || 'I’m continuing the current pass.'}`
      case 'Blocker update': return `${task.name} is blocked on ${task.blocker || 'an open dependency'}. Next action is ${task.nextAction || 'to get the missing information.'}`
      case 'Ready-for-review update': return `${task.name} is ready for focused review. Please check ${task.latestFeedback || 'timing, readability, and the intended gameplay state'}.`
      case 'Changelist submitted': return `Submitted the latest ${task.feature || task.name} update in${submission}. ${task.submission.description || 'The latest changes are captured in the task workspace.'}`
      case 'Verification request': return `${task.name} is submitted and ready for verification in${submission}. Please confirm the effect triggers, resets, and reads correctly in the latest build.`
      case 'Bug reproduction update': return `I reproduced the ${task.name} issue in ${task.mapMode || 'the current test setup'}. ${task.blocker || task.nextAction}`
      case 'Unable-to-reproduce update': return `I couldn’t reproduce the ${task.name} issue on the latest build. I tested ${task.testingInstructions.triggerMethod || 'the recorded trigger path'} and captured the current result for follow-up.`
      case 'SFX notification': return `Small update on ${task.name}: ${task.impactTags.some((tag) => tag === 'Timing changed' || tag === 'Duration changed') ? 'the timing or duration changed, so the audio timing may need another sync check.' : 'the latest VFX pass is ready for an audio dependency check.'}${task.submission.changelist ? ` Latest CL: ${task.submission.changelist}.` : ''}`
      case 'Final completion update': return `${task.name} is complete. The final pass is verified in ${task.submission.buildTested || 'the latest game build'} and the follow-up items are closed.`
    }
  })()

  if (format === 'Jira comment') return `${type}: ${base}${toneTail(tone)}`
  if (format === 'Stand-up note') return `${task.name} — ${base}${toneTail(tone)}`
  return `${base}${toneTail(tone)}`
}

export const impactReminders = (tags: string[]) => {
  const reminders: string[] = []
  if (tags.includes('Timing changed') || tags.includes('Duration changed')) reminders.push('Consider updating SFX.')
  if (tags.includes('Trigger changed')) reminders.push('Confirm the latest trigger with Design or Tech Design.')
  if (tags.includes('Placement changed')) reminders.push('Confirm placement with Design and check audio location.')
  if (tags.includes('Model swap changed') || tags.includes('Animation sync changed')) reminders.push('Recheck Animation, Scriptable, VFX, and SFX synchronization.')
  if (tags.includes('New state added')) reminders.push('Confirm whether the new state needs separate audio and gameplay feedback.')
  if (tags.includes('Visual polish only')) reminders.push('A full cross-discipline review may not be necessary.')
  if (tags.includes('Performance optimization only')) reminders.push('Verify that the visual result remains acceptable at gameplay distance.')
  if (tags.includes('No audio impact')) reminders.push('No audio impact expected based on the selected reminder tag.')
  return reminders
}

export const searchTask = (task: Task, query: string) => {
  if (!query.trim()) return true
  const haystack = JSON.stringify(task).toLowerCase()
  return haystack.includes(query.toLowerCase().trim())
}
