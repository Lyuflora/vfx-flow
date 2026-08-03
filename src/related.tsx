import { useMemo, useState } from 'react'
import { ArrowRight, Check, ChevronRight, Copy, GitBranch, Layers3, Link2, Plus, RotateCcw, Search, X } from 'lucide-react'
import type { AppData, EffectType, PipelineCard, RelationType, Task, TaskFamily, VariationDecision, WorkType } from './types'
import { EFFECT_TYPES, RELATION_TYPES, WORK_TYPES } from './types'
import { cn, formatDate, formatRelative, stageClass } from './utils'

export interface RelatedTaskDraft {
  name: string
  relationType: RelationType
  workType: WorkType
  effectType: EffectType
  familyId: string
  note: string
  inherit: {
    map: boolean
    effect: boolean
    tags: boolean
    pipeline: boolean
    assets: boolean
    references: boolean
    testing: boolean
    technical: boolean
    dependencies: boolean
  }
}

const relationGroup = (relation: RelationType) => {
  if (relation === 'Variation of') return 'Variations'
  if (relation === 'Revisit / Polish of') return 'Revisions and polish'
  if (relation === 'Bug found in') return 'Bugs'
  if (relation === 'Optimization of') return 'Optimizations'
  if (relation === 'Follow-up to') return 'Follow-ups'
  if (relation === 'Depends on') return 'Dependencies'
  return 'Shared pipeline and references'
}

const relationTone = (relation: RelationType) => relation === 'Bug found in' ? 'danger' : relation === 'Optimization of' ? 'amber' : relation === 'Variation of' ? 'violet' : 'cyan'

const familyFor = (data: AppData, id?: string) => id ? (data.families ?? []).find((family) => family.id === id) : undefined
const pipelineFor = (data: AppData, id: string) => (data.pipelines ?? []).find((pipeline) => pipeline.id === id)

export function TaskContextBar({ task, data, onOpenFamily, onOpenPipeline, onOpenRelated, onCreateRelated }: { task: Task; data: AppData; onOpenFamily: (id: string) => void; onOpenPipeline: (id: string) => void; onOpenRelated: () => void; onCreateRelated: () => void }) {
  const family = familyFor(data, task.familyId)
  const relations = task.relationships ?? []
  return <section className="task-context-bar">
    <div className="task-context-label"><GitBranch size={14} /><span>RELATED CONTEXT</span></div>
    <div className="context-chip-row">
      {family && <button className="context-chip" onClick={() => onOpenFamily(family.id)}><Layers3 size={13} />Family: {family.name}</button>}
      {(task.pipelineIds ?? []).map((id) => { const pipeline = pipelineFor(data, id); return pipeline ? <button className="context-chip" key={id} onClick={() => onOpenPipeline(id)}><Link2 size={13} />Pipeline: {pipeline.name}</button> : null })}
      {relations.slice(0, 3).map((relation) => <span className={cn('context-chip', relationTone(relation.relationType))} key={relation.id}>{relation.relationType}</span>)}
      {!family && !(task.pipelineIds ?? []).length && !relations.length && <span className="muted">No family, pipeline, or relation linked yet.</span>}
    </div>
    <div className="task-context-actions"><button className="secondary-button" onClick={onOpenRelated}><GitBranch size={13} />Related work</button><button className="primary-button compact" onClick={onCreateRelated}><Plus size={13} />Create related task</button></div>
  </section>
}

export function RelatedTaskDialog({ task, data, open, onClose, onCreate }: { task: Task; data: AppData; open: boolean; onClose: () => void; onCreate: (draft: RelatedTaskDraft) => void }) {
  const [draft, setDraft] = useState<RelatedTaskDraft>(() => makeRelatedDraft(task))
  if (!open) return null
  const set = <K extends keyof RelatedTaskDraft>(key: K, value: RelatedTaskDraft[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const setInherit = (key: keyof RelatedTaskDraft['inherit']) => setDraft((current) => ({ ...current, inherit: { ...current.inherit, [key]: !current.inherit[key] } }))
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="related-modal" role="dialog" aria-modal="true">
    <div className="modal-heading"><div><span className="panel-kicker">RELATED TASK</span><h2>Create a focused branch of {task.name}</h2><p>Carry forward useful context without copying workflow state, history, reflection, or submission data.</p></div><button className="icon-button" onClick={onClose}><X size={16} /></button></div>
    <div className="form-grid two related-form-grid">
      <label className="field-block"><span className="field-label">New task name</span><input autoFocus value={draft.name} onChange={(event) => set('name', event.target.value)} placeholder="e.g. Portal blue variation" /></label>
      <label className="field-block"><span className="field-label">Relation</span><select value={draft.relationType} onChange={(event) => set('relationType', event.target.value as RelationType)}>{RELATION_TYPES.map((relation) => <option key={relation}>{relation}</option>)}</select></label>
      <label className="field-block"><span className="field-label">Work Type</span><select value={draft.workType} onChange={(event) => set('workType', event.target.value as WorkType)}>{WORK_TYPES.map((workType) => <option key={workType}>{workType}</option>)}</select></label>
      <label className="field-block"><span className="field-label">Effect Type</span><select value={draft.effectType} onChange={(event) => set('effectType', event.target.value as EffectType)}><option value="">No effect change</option>{EFFECT_TYPES.map((effect) => <option key={effect}>{effect}</option>)}</select></label>
      <label className="field-block"><span className="field-label">Task Family</span><select value={draft.familyId} onChange={(event) => set('familyId', event.target.value)}><option value="">No family</option>{(data.families ?? []).map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}</select></label>
      <label className="field-block"><span className="field-label">Relation note</span><input value={draft.note} onChange={(event) => set('note', event.target.value)} placeholder="What makes this branch useful?" /></label>
    </div>
    <div className="inherit-panel"><div><span className="panel-kicker">INHERIT CONTEXT</span><p className="muted">Choose only the fields that should seed the new task.</p></div><div className="inherit-grid">{([['map', 'Map / mode'], ['effect', 'Effect type'], ['tags', 'Tags'], ['pipeline', 'Pipeline links'], ['assets', 'Asset links'], ['references', 'References'], ['testing', 'Testing instructions'], ['technical', 'Technical constraints'], ['dependencies', 'Dependencies']] as const).map(([key, label]) => <button type="button" key={key} className={cn('inherit-option', draft.inherit[key] && 'selected')} onClick={() => setInherit(key)}>{draft.inherit[key] ? <Check size={13} /> : <span className="choice-box" />}{label}</button>)}</div></div>
    <div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={!draft.name.trim()} onClick={() => onCreate({ ...draft, name: draft.name.trim() })}><Plus size={14} />Create related task</button></div>
  </section></div>
}

function makeRelatedDraft(task: Task): RelatedTaskDraft {
  return { name: `${task.name} variation`, relationType: 'Variation of', workType: 'Iteration / Polish', effectType: task.effectType, familyId: task.familyId ?? '', note: '', inherit: { map: true, effect: true, tags: true, pipeline: true, assets: true, references: true, testing: true, technical: true, dependencies: true } }
}

export function RelatedWorkDrawer({ task, data, open, onClose, onOpenTask, onOpenFamily, onOpenPipeline, onCreateRelated, onRemoveRelationship, onLinkExisting, onMoveFamily, onFamilyContext, onUpdateDecision }: { task: Task; data: AppData; open: boolean; onClose: () => void; onOpenTask: (id: string) => void; onOpenFamily: (id: string) => void; onOpenPipeline: (id: string) => void; onCreateRelated: () => void; onRemoveRelationship: (taskId: string, relationshipId: string) => void; onLinkExisting: (taskId: string, type: RelationType, note: string) => void; onMoveFamily: (taskId: string, familyId: string) => void; onFamilyContext: (action: 'copy' | 'update' | 'keep') => void; onUpdateDecision: (taskId: string, decision: VariationDecision) => void }) {
  const [linkOpen, setLinkOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [linkTarget, setLinkTarget] = useState('')
  const [linkType, setLinkType] = useState<RelationType>('Inspired by / References')
  const [linkNote, setLinkNote] = useState('')
  const [familyMenuOpen, setFamilyMenuOpen] = useState(false)
  if (!open) return null
  const related = (data.tasks ?? []).flatMap((candidate) => (candidate.relationships ?? []).filter((relation) => relation.sourceTaskId === task.id || relation.targetTaskId === task.id).map((relation) => ({ relation, other: relation.sourceTaskId === task.id ? data.tasks.find((item) => item.id === relation.targetTaskId) : data.tasks.find((item) => item.id === relation.sourceTaskId), outgoing: relation.sourceTaskId === task.id }))).filter((item): item is { relation: Task['relationships'][number]; other: Task | undefined; outgoing: boolean } => Boolean(item.other))
  const groups = Array.from(new Set(related.map((item) => relationGroup(item.relation.relationType))))
  const variations = related.filter((item) => item.relation.relationType === 'Variation of').map((item) => item.other).filter((item): item is Task => Boolean(item))
  const family = familyFor(data, task.familyId)
  return <aside className="related-drawer">
    <div className="drawer-heading"><div><span className="panel-kicker">RELATED WORK</span><h2>{task.name}</h2><p className="muted">Typed links, family context, and reusable setup around this task.</p></div><button className="icon-button" onClick={onClose}><X size={16} /></button></div>
    <div className="drawer-actions"><button className="primary-button compact" onClick={onCreateRelated}><Plus size={13} />Create related</button><button className="secondary-button" onClick={() => setLinkOpen(!linkOpen)}><Link2 size={13} />Link existing</button></div>
    {linkOpen && <div className="link-existing-panel"><label className="field-block"><span className="field-label">Existing task</span><select value={linkTarget} onChange={(event) => setLinkTarget(event.target.value)}><option value="">Choose a task</option>{data.tasks.filter((candidate) => candidate.id !== task.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label><label className="field-block"><span className="field-label">Relation</span><select value={linkType} onChange={(event) => setLinkType(event.target.value as RelationType)}>{RELATION_TYPES.map((relation) => <option key={relation}>{relation}</option>)}</select></label><input value={linkNote} onChange={(event) => setLinkNote(event.target.value)} placeholder="Optional note" /><button className="secondary-button" disabled={!linkTarget} onClick={() => { onLinkExisting(linkTarget, linkType, linkNote); setLinkTarget(''); setLinkNote(''); setLinkOpen(false) }}><Link2 size={13} />Save link</button></div>}
    {family && <section className="family-context-card"><div className="family-context-heading"><div><span className="panel-kicker">FAMILY CONTEXT</span><button className="plain-link" onClick={() => onOpenFamily(family.id)}>{family.name}</button></div><button className="icon-button" onClick={() => setFamilyMenuOpen(!familyMenuOpen)}><ChevronRight className={cn(familyMenuOpen && 'rotate-90')} size={15} /></button></div><p>{family.description}</p><div className="chip-grid compact-chips">{family.sharedTags.map((tag) => <span className="impact-chip selected" key={tag}>{tag}</span>)}</div>{familyMenuOpen && <div className="family-context-actions"><button onClick={() => onFamilyContext('copy')}><Copy size={13} />Copy from family</button><button onClick={() => onFamilyContext('update')}><RotateCcw size={13} />Update family from task</button><button onClick={() => onFamilyContext('keep')}><X size={13} />Keep task-specific</button></div>}</section>}
    <div className="related-list">{!related.length && <div className="empty-inline"><GitBranch size={16} /><span>No related work yet. Link an existing task or create a focused branch.</span></div>}{groups.map((group) => <section key={group} className="related-group"><div className="group-heading"><span>{group}</span><small>{related.filter((item) => relationGroup(item.relation.relationType) === group).length}</small></div>{related.filter((item) => relationGroup(item.relation.relationType) === group).map(({ relation, other, outgoing }) => <article className="related-row" key={relation.id}><div className="related-row-main"><button className="plain-link" onClick={() => onOpenTask(other!.id)}>{other!.name}</button><span className={cn('context-chip small', relationTone(relation.relationType))}>{relation.relationType}{!outgoing && ' · incoming'}</span><small>{other!.workType} · {other!.stage} · {formatRelative(other!.updatedAt)}</small>{relation.note && <p>{relation.note}</p>}</div>{outgoing && <button className="icon-button" title="Remove relationship" onClick={() => onRemoveRelationship(task.id, relation.id)}><X size={13} /></button>}</article>)}</section>)}</div>
    {variations.length > 1 && <section className="compare-launch"><div><span className="panel-kicker">VARIATION REVIEW</span><strong>{variations.length} variations linked</strong></div><button className="secondary-button" onClick={() => setCompareOpen(!compareOpen)}>{compareOpen ? 'Hide comparison' : 'Compare variations'}</button></section>}
    {compareOpen && <ComparisonPanel tasks={[task, ...variations]} onUpdateDecision={onUpdateDecision} />}
    <section className="family-move-panel"><span className="field-label">Move task to family</span><select value={task.familyId ?? ''} onChange={(event) => onMoveFamily(task.id, event.target.value)}><option value="">Keep ungrouped</option>{(data.families ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></section>
  </aside>
}

function ComparisonPanel({ tasks, onUpdateDecision }: { tasks: Task[]; onUpdateDecision: (taskId: string, decision: VariationDecision) => void }) {
  return <section className="comparison-panel"><div className="panel-heading-row"><div><span className="panel-kicker">COMPARE VARIATIONS</span><h3>Direction, timing, and decision</h3></div><span className="muted">Side-by-side</span></div><div className="compare-grid">{tasks.map((task) => <article className="compare-card" key={task.id}><strong>{task.name}</strong><span>{task.workType} · {task.effectType}</span><p>{task.visualDirection || 'No visual direction yet.'}</p><dl><div><dt>Duration</dt><dd>{task.requirements.duration || 'Not set'}</dd></div><div><dt>Feedback</dt><dd>{task.latestFeedback || 'No feedback yet'}</dd></div><div><dt>Preview</dt><dd>{task.links[0] ? <a href={task.links[0]} target="_blank" rel="noreferrer">Open link</a> : 'No preview link'}</dd></div></dl><label className="field-block"><span className="field-label">Decision</span><select value={task.variationDecision ?? 'Exploring'} onChange={(event) => onUpdateDecision(task.id, event.target.value as VariationDecision)}>{['Exploring', 'Preferred', 'Rejected', 'Merged', 'Final'].map((decision) => <option key={decision}>{decision}</option>)}</select></label></article>)}</div></section>
}

export function FamiliesPage({ data, selectedFamilyId, onSelectFamily, onOpenTask, onOpenPipeline }: { data: AppData; selectedFamilyId: string; onSelectFamily: (id: string) => void; onOpenTask: (id: string) => void; onOpenPipeline: (id: string) => void }) {
  const families = data.families ?? []
  const selected = families.find((family) => family.id === selectedFamilyId) ?? families[0]
  const familyTasks = selected ? data.tasks.filter((task) => task.familyId === selected.id) : []
  const familyPipelines = selected ? (data.pipelines ?? []).filter((pipeline) => pipeline.relatedTaskIds.some((id) => familyTasks.some((task) => task.id === id)) || selected.sharedPipelineLinks.includes(pipeline.id)) : []
  return <div className="library-page family-page"><div className="page-heading"><div><span className="panel-kicker">TASK FAMILIES</span><h1>Family overview</h1><p>Keep related work connected without turning the workspace into a graph.</p></div><span className="count-badge">{families.length} families</span></div><div className="family-layout"><div className="family-list">{families.map((family) => <button key={family.id} className={cn('family-card', selected?.id === family.id && 'selected')} onClick={() => onSelectFamily(family.id)}><strong>{family.name}</strong><span>{family.featureOrMap}</span><small>{data.tasks.filter((task) => task.familyId === family.id).length} linked tasks · {family.sharedTags.slice(0, 3).join(' · ')}</small></button>)}{!families.length && <EmptyRelated title="No task families yet" detail="Create a family from a related task context when a body of work starts to repeat." />}</div>{selected && <section className="family-detail panel"><div className="page-heading compact-heading"><div><span className="panel-kicker">FAMILY OVERVIEW</span><h2>{selected.name}</h2><p>{selected.description}</p></div><span className="muted">Updated {formatDate(selected.updatedAt)}</span></div><div className="context-chip-row">{selected.sharedTags.map((tag) => <span className="context-chip" key={tag}>{tag}</span>)}</div><div className="overview-stats"><div><strong>{familyTasks.filter((task) => task.lifecycle === 'Active').length}</strong><span>Active</span></div><div><strong>{familyTasks.filter((task) => task.stage === 'Blocked' || task.blocker).length}</strong><span>Waiting / blocked</span></div><div><strong>{familyTasks.filter((task) => task.variationDecision).length}</strong><span>Variations</span></div><div><strong>{familyTasks.filter((task) => task.workType === 'Bug Fix').length}</strong><span>Bugs</span></div><div><strong>{familyTasks.filter((task) => task.workType === 'Optimization').length}</strong><span>Optimizations</span></div></div><section className="family-detail-section"><SectionTitle text="Related tasks" />{familyTasks.map((task) => <button className="family-task-row" key={task.id} onClick={() => onOpenTask(task.id)}><span><strong>{task.name}</strong><small>{task.workType} · {task.effectType} · {task.stage}</small></span><ArrowRight size={14} /></button>)}</section><section className="family-detail-section"><SectionTitle text="Reusable pipelines" />{familyPipelines.map((pipeline) => <button className="family-task-row" key={pipeline.id} onClick={() => onOpenPipeline(pipeline.id)}><span><strong>{pipeline.name}</strong><small>{pipeline.purpose}</small></span><ArrowRight size={14} /></button>)}{!familyPipelines.length && <p className="muted">No reusable pipeline linked yet.</p>}</section><section className="family-detail-section"><SectionTitle text="Shared context" /><div className="detail-columns"><DetailList label="References" values={selected.sharedReferences} /><DetailList label="Assets" values={selected.sharedAssetLinks} /><DetailList label="Testing" values={[selected.sharedTestingInstructions]} /><DetailList label="Dependencies" values={[selected.sharedDependencies]} /></div></section><section className="family-detail-section"><SectionTitle text="Reusable lessons" />{selected.reusableLessons.map((lesson) => <p className="lesson-card" key={lesson}>{lesson}</p>)}{!selected.reusableLessons.length && <p className="muted">No family lessons promoted yet.</p>}</section></section>}</div></div>
}

export function PipelinesPage({ data, selectedPipelineId, onSelectPipeline, onOpenTask, onCreatePipeline }: { data: AppData; selectedPipelineId: string; onSelectPipeline: (id: string) => void; onOpenTask: (id: string) => void; onCreatePipeline: () => void }) {
  const pipelines = data.pipelines ?? []
  const selected = pipelines.find((pipeline) => pipeline.id === selectedPipelineId) ?? pipelines[0]
  const pipelineTasks = selected ? data.tasks.filter((task) => task.pipelineIds?.includes(selected.id) || selected.relatedTaskIds.includes(task.id)) : []
  return <div className="library-page pipeline-page"><div className="page-heading"><div><span className="panel-kicker">REUSABLE PIPELINES</span><h1>Pipeline cards</h1><p>Save repeatable setup knowledge and link it to tasks instead of duplicating it.</p></div><button className="primary-button compact" onClick={onCreatePipeline}><Plus size={13} />New pipeline</button></div><div className="pipeline-layout"><div className="pipeline-list">{pipelines.map((pipeline) => <button key={pipeline.id} className={cn('pipeline-card', selected?.id === pipeline.id && 'selected')} onClick={() => onSelectPipeline(pipeline.id)}><strong>{pipeline.name}</strong><span>{pipeline.purpose}</span><small>{pipelineTasks.length} linked tasks · {pipeline.tags.slice(0, 3).join(' · ')}</small></button>)}{!pipelines.length && <EmptyRelated title="No pipeline cards yet" detail="Create one when a setup repeats across related VFX work." />}</div>{selected && <section className="pipeline-detail panel"><div className="page-heading compact-heading"><div><span className="panel-kicker">PIPELINE CARD</span><h2>{selected.name}</h2><p>{selected.purpose}</p></div><span className="muted">Updated {formatDate(selected.updatedAt)}</span></div><div className="context-chip-row">{selected.tags.map((tag) => <span className="context-chip" key={tag}>{tag}</span>)}</div><div className="detail-columns"><DetailList label="Work types" values={selected.workTypes} /><DetailList label="Effect types" values={selected.effectTypes} /><DetailList label="Assets / systems" values={selected.requiredAssetsSystems.split(',').map((item) => item.trim()).filter(Boolean)} /><DetailList label="Event names" values={selected.eventNames} /></div><section className="pipeline-detail-section"><SectionTitle text="Setup steps" /><ol className="pipeline-steps">{selected.setupSteps.map((step) => <li key={step}>{step}</li>)}</ol></section><div className="detail-columns"><DetailList label="Controls" values={[selected.commonControls]} /><DetailList label="Testing" values={[selected.testingInstructions]} /><DetailList label="Known limitations" values={[selected.knownLimitations]} /><DetailList label="Failure cases" values={[selected.commonFailureCases]} /></div><section className="pipeline-detail-section"><SectionTitle text="Linked tasks" />{pipelineTasks.map((task) => <button className="family-task-row" key={task.id} onClick={() => onOpenTask(task.id)}><span><strong>{task.name}</strong><small>{task.workType} · {task.stage}</small></span><ArrowRight size={14} /></button>)}</section><section className="pipeline-detail-section"><SectionTitle text="Reusable lessons" />{selected.reusableLessons.map((lesson) => <p className="lesson-card" key={lesson}>{lesson}</p>)}{!selected.reusableLessons.length && <p className="muted">No pipeline lessons promoted yet.</p>}</section></section>}</div></div>
}

export function ReflectionPromotionBar({ task, onPromote, onUseAsStartingPoint }: { task: Task; onPromote: (scope: 'Family' | 'Pipeline', originalText: string, summary: string) => void; onUseAsStartingPoint: () => void }) {
  const reflection = task.reflection
  const originalText = [reflection.worked, reflection.difficult, reflection.nextTime, reflection.reusable, reflection.reusableSetup, reflection.reusableTesting].filter(Boolean).join('\n')
  if (!originalText) return null
  return <section className="lesson-promotion-bar"><div><span className="panel-kicker">PROMOTE A LESSON</span><strong>Turn this reflection into reusable context</strong><p className="muted">The original reflection stays attached to {task.name}.</p></div><div className="inline-controls"><button className="secondary-button" onClick={() => onPromote('Family', originalText, reflection.reusable || reflection.reusableSetup || reflection.worked)}><Layers3 size={13} />Family lesson</button><button className="secondary-button" onClick={() => onPromote('Pipeline', originalText, reflection.reusableSetup || reflection.reusableTesting || reflection.technicalUseful)}><GitBranch size={13} />Pipeline lesson</button><button className="secondary-button" onClick={onUseAsStartingPoint}><Copy size={13} />Use as starting point</button></div></section>
}

function SectionTitle({ text }: { text: string }) { return <div className="section-title-row"><span className="panel-kicker">{text.toUpperCase()}</span></div> }
function DetailList({ label, values }: { label: string; values: string[] }) { const filtered = values.filter(Boolean); return <div className="detail-list"><span className="field-label">{label}</span>{filtered.length ? filtered.map((value) => <p key={value}>{value}</p>) : <p className="muted">Not set</p>}</div> }
function EmptyRelated({ title, detail }: { title: string; detail: string }) { return <div className="empty-state"><Search size={18} /><strong>{title}</strong><p>{detail}</p></div> }
