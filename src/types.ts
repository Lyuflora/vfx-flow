export const STAGES = [
  'New Request',
  'Needs Clarification',
  'Ready to Start',
  'Blockout',
  'Waiting for Feedback',
  'Iterating',
  'Ready to Submit',
  'Submitted',
  'Waiting for Verification',
  'Complete',
  'Blocked',
] as const

export type Stage = (typeof STAGES)[number]
export type Priority = 'Critical' | 'High' | 'Normal' | 'Low'
export type Discipline = 'Design' | 'Tech Design' | 'Art' | 'Audio' | 'Production' | 'Nobody'
export type WorkCategory = 'Setup' | 'Blockout' | 'Simulation' | 'Material' | 'Particle work' | 'Hookup' | 'Scriptable work' | 'Optimization' | 'Bug fixing' | 'Testing' | 'Polish' | 'Documentation'
export const NOTE_TYPES = ['Change', 'Issue', 'Test', 'Feedback', 'Decision', 'Todo', 'CL', 'Reference', 'Learning'] as const
export type NoteType = (typeof NOTE_TYPES)[number]
export type FeedbackStatus = 'Draft' | 'Sent' | 'Waiting' | 'Received' | 'Resolved' | 'No longer needed'
export type SubmissionStatus = 'Not ready' | 'Presubmit running' | 'Presubmit failed' | 'Ready to submit' | 'Submitted' | 'Verified' | 'Needs follow-up'
export type FollowUpStatus = 'Open' | 'In progress' | 'Done'
export type MessageTone = 'Friendly and casual' | 'Neutral' | 'Concise' | 'More detailed'
export type MessageFormat = 'Slack' | 'Jira comment' | 'Stand-up note'
export type MessageType = 'Clarification request' | 'First-pass update' | 'Feedback request' | 'Progress update' | 'Blocker update' | 'Ready-for-review update' | 'Changelist submitted' | 'Verification request' | 'Bug reproduction update' | 'Unable-to-reproduce update' | 'SFX notification' | 'Final completion update'
export const WORK_TYPES = ['New VFX', 'Iteration / Polish', 'Bug Fix', 'Optimization', 'Hookup / Integration', 'Research / Prototype'] as const
export type WorkType = (typeof WORK_TYPES)[number] | (string & {})
export type EffectType = 'Charge-up' | 'Transformation' | 'Portal' | 'Environment' | 'Destruction' | 'Gameplay Feedback' | 'Area Warning' | 'Objective' | 'Atmospheric' | 'Character' | 'Vehicle' | 'Material Transition' | 'Full-screen' | 'Other' | (string & {})
export type TaskLifecycle = 'Active' | 'Completed' | 'Archived'
export const RELATION_TYPES = ['Variation of', 'Revisit / Polish of', 'Follow-up to', 'Bug found in', 'Optimization of', 'Uses same pipeline as', 'Shares assets with', 'Depends on', 'Inspired by / References'] as const
export type RelationType = (typeof RELATION_TYPES)[number]
export type VariationDecision = 'Exploring' | 'Preferred' | 'Rejected' | 'Merged' | 'Final'
export type TaskPageDensity = 'Lean' | 'Detailed'
export type WorkPageDefaultTab = 'Overview' | 'Work Page'
export type WorkPageBlockType = 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'numbered' | 'checklist' | 'quote' | 'callout' | 'code' | 'divider' | 'image' | 'gallery' | 'progress' | 'decision' | 'issue' | 'test' | 'reference' | 'linked'
export type WorkPageImageSize = 'small' | 'medium' | 'wide' | 'full'
export type WorkPageImageAlignment = 'left' | 'center' | 'right'
export type WorkPageGalleryLayout = 'two-column' | 'three-column' | 'comparison'
export type WorkPageAttachmentSource = 'Clipboard' | 'Drag and drop' | 'File picker' | 'Imported backup'

export interface WorkPageBlockContent {
  text?: string
  title?: string
  items?: string[]
  checked?: boolean[]
  caption?: string
  altText?: string
  imageSize?: WorkPageImageSize
  alignment?: WorkPageImageAlignment
  attachmentId?: string
  attachmentIds?: string[]
  labels?: string[]
  galleryLayout?: WorkPageGalleryLayout
  changed?: string
  result?: string
  nextStep?: string
  expandedSections?: string[]
  url?: string
  label?: string
  field?: string
  taskId?: string
  staticCopy?: boolean
  sourceBlockId?: string
}

export interface WorkPageBlock {
  id: string
  type: WorkPageBlockType
  content: WorkPageBlockContent
  createdAt: string
  updatedAt: string
  authorLabel?: string
  collapsed?: boolean
  tags?: string[]
  linkedField?: string
  attachmentIds?: string[]
}

export interface WorkPageAttachment {
  id: string
  taskId: string
  fileName: string
  mimeType: string
  fileSize: number
  width?: number
  height?: number
  createdAt: string
  updatedAt: string
  source: WorkPageAttachmentSource
  blob: Blob
  caption?: string
  altText?: string
}

export interface WorkPageRecoveryDraft {
  taskId: string
  savedAt: string
  blocks: WorkPageBlock[]
}

export interface TaskDetailPreferences {
  visibleSections: string[]
  hiddenSections: string[]
  collapsedSections: string[]
  order: string[]
}

export interface TaskUIState {
  expandedSections?: string[]
  expandedSubsections?: string[]
  visibleOptionalFields?: Record<string, string[]>
  advancedDetailsVisible?: boolean
}

export const EFFECT_TYPES: EffectType[] = ['Charge-up', 'Transformation', 'Portal', 'Environment', 'Destruction', 'Gameplay Feedback', 'Area Warning', 'Objective', 'Atmospheric', 'Character', 'Vehicle', 'Material Transition', 'Full-screen', 'Other']
export const EFFECT_TAGS = ['Smoke', 'Fire', 'Energy', 'Ghost', 'Magic', 'Electricity', 'Blood', 'Dust', 'Explosion', 'Trail', 'Decal', 'Full-screen', 'Material', 'Scriptable', 'Houdini', 'Performance', 'Placement', 'Culling', 'Soul', 'Tiered states']
export const REFLECTION_TAGS = ['Requirement unclear', 'Late VFX involvement', 'Design iteration', 'SFX sync', 'Animation sync', 'Scriptable issue', 'Material issue', 'Performance issue', 'Testing difficulty', 'Communication gap', 'Successful workflow', 'Reusable solution', 'Tool opportunity', 'Artistic improvement', 'Technical learning']

export const REQUIRED_STATES = ['Idle', 'Activate', 'Buildup', 'Loop', 'Tier Up', 'Full Charge', 'Impact', 'Success', 'Failure', 'Power Down', 'Interrupted', 'Reset', 'Custom State'] as const
export const MISSING_INFO = ['Trigger is unclear', 'Timing is unclear', 'Location is unclear', 'Gameplay purpose is unclear', 'Visual reference is missing', 'Required states are unclear', 'Owner for final approval is unclear', 'Testing method is unclear', 'Performance target is unclear', 'Audio dependency is unclear'] as const
export const IMPACT_TAGS = ['Timing changed', 'Duration changed', 'Trigger changed', 'Placement changed', 'Scale changed', 'Model swap changed', 'Animation sync changed', 'New state added', 'Existing state removed', 'Material changed', 'Visual polish only', 'Performance optimization only', 'Bug fix only', 'No audio impact'] as const

export interface RequirementBreakdown {
  gameplayPurpose: string
  playerUnderstanding: string
  triggerCondition: string
  startEvent: string
  endEvent: string
  duration: string
  location: string
  viewingDistance: string
  visibility: string
  repeatability: string
  maxSimultaneous: string
  requiredStates: string[]
  existingReference: string
  technicalConstraints: string
  performanceConcerns: string
  dependencies: string
  missingInfo: string[]
}

export interface WorkLog {
  id: string
  at: string
  category: WorkCategory | NoteType
  changed: string
  remains: string
  issue: string
  link: string
  changelist: string
}

export interface FeedbackRequest {
  id: string
  requestedFrom: string
  discipline: string
  dateRequested: string
  build: string
  previewLink: string
  changed: string
  question: string
  status: FeedbackStatus
  response: string
  decision: string
  followUp: string
}

export interface ChecklistItem {
  id: string
  label: string
  done: boolean
  custom?: boolean
}

export interface Submission {
  changelist: string
  description: string
  filesChanged: string
  relatedJira: string
  buildTested: string
  testResult: string
  limitations: string
  reviewers: string
  status: SubmissionStatus
  checklist: ChecklistItem[]
}

export interface TestingInstructions {
  consoleCommand: string
  mapLocation: string
  triggerMethod: string
  requiredWeapon: string
  gameplaySetup: string
  knownIssue: string
}

export interface FollowUp {
  id: string
  owner: string
  createdAt: string
  nextAction: string
  status: FollowUpStatus
  reminderDate: string
  kind: string
}

export interface Reflection {
  completed: boolean
  completedAt: string
  worked: string
  difficult: string
  nextTime: string
  finalResult: string
  gameplayGoal: string
  feedbackImproved: string
  processSlow: string
  missingAtStart: string
  dependencyFriction: string
  avoidableRework: string
  artisticQuality: string
  referenceTechnique: string
  morePolish: string
  technicalUseful: string
  technicalLimitation: string
  reusable: string
  communication: string
  reusableAsset: string
  reusableSetup: string
  reusableMessage: string
  reusableTesting: string
  futureToolIdea: string
  growthAction: string
  tags: string[]
}

export interface CreativeBrief {
  gameplayPurpose: string
  playerUnderstanding: string
  visualDirection: string
  referenceLinks: string
  trigger: string
  requiredStates: string
  duration: string
  location: string
  viewingDistance: string
  dependencies: string
  technicalConstraints: string
  performanceConcerns: string
}

export interface BugFixDetails {
  observedBehavior: string
  expectedBehavior: string
  severity: string
  frequency: 'Always' | 'Often' | 'Sometimes' | 'Rare' | 'Unable to reproduce' | ''
  firstObservedBuild: string
  currentBuild: string
  evidenceLink: string
  reproductionMap: string
  reproductionLocation: string
  triggerMethod: string
  requiredItem: string
  dvar: string
  reproductionSteps: ChecklistItem[]
  reproductionResult: string
  suspectedSystem: string
  investigationNotes: string
  relatedOwner: string
  previousWorkingCl: string
  relatedTasks: string
  fixAttempts: Array<{ id: string; at: string; tried: string; result: string; relatedCl: string; disposition: 'Keep' | 'Revert' | 'Inconclusive' | '' }>
  rootCause: string
  fixSummary: string
  verificationSteps: string
  verifiedBuild: string
  regressionRisk: string
  followUpNeeded: string
  finalStatus: string
}

export interface OptimizationDetails {
  performanceConcern: string
  targetPlatform: string
  graphicsSetting: string
  maxInstances: string
  gameplayDistance: string
  currentIssue: string
  beforeParticleCount: string
  beforeEmitterCount: string
  beforeMaterialComplexity: string
  beforeFrameNote: string
  beforeCaptureLink: string
  changes: string
  afterMetrics: string
  visualDifference: string
  gameplayReadability: string
  remainingLimitation: string
  comparisonCapture: string
  verification: string
}

export interface HookupDetails {
  gameplayEventName: string
  scriptableName: string
  vfxAsset: string
  triggerOwner: string
  requiredStates: string
  modelDependency: string
  animationDependency: string
  sfxDependency: string
  eventTiming: string
  resetBehavior: string
  testingInstructions: string
  currentStatus: string
  blocker: string
  verification: string
}

export interface ResearchDetails {
  question: string
  productionProblem: string
  hypothesis: string
  reference: string
  experiment: string
  result: string
  limitations: string
  reusableOutput: string
  possibleProductionUse: string
  nextExperiment: string
}

export interface TaskRelationship {
  id: string
  sourceTaskId: string
  targetTaskId: string
  relationType: RelationType
  note: string
  createdAt: string
}

export interface TaskFamily {
  id: string
  name: string
  featureOrMap: string
  description: string
  sharedTags: string[]
  sharedReferences: string[]
  sharedAssetLinks: string[]
  sharedPipelineLinks: string[]
  sharedTestingInstructions: string
  sharedDependencies: string
  notes: string
  reusableLessons: string[]
  createdAt: string
  updatedAt: string
}

export interface PipelineCard {
  id: string
  name: string
  purpose: string
  workTypes: WorkType[]
  effectTypes: EffectType[]
  requiredAssetsSystems: string
  setupSteps: string[]
  eventNames: string[]
  commonControls: string
  testingInstructions: string
  knownLimitations: string
  commonFailureCases: string
  reusableNotes: string
  reusableLessons: string[]
  relatedTaskIds: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface PromotedLesson {
  id: string
  scope: 'Family' | 'Pipeline'
  sourceTaskId: string
  familyId?: string
  pipelineId?: string
  at: string
  originalText: string
  summary: string
  tags: string[]
}

export interface HistoryEntry {
  id: string
  at: string
  type: 'Status' | 'Work log' | 'Feedback' | 'Decision' | 'Submission' | 'Message' | 'Follow-up'
  label: string
  detail: string
}

export interface Task {
  id: string
  name: string
  feature: string
  mapMode: string
  jira: string
  source: string
  requestingDiscipline: string
  requester: string
  priority: Priority
  workType: WorkType
  effectType: EffectType
  tags: string[]
  lifecycle: TaskLifecycle
  pinned: boolean
  lastOpenedAt: string
  archivedAt: string
  familyId?: string
  relationships: TaskRelationship[]
  pipelineIds: string[]
  variationDecision?: VariationDecision
  targetDate: string
  rawRequest: string
  requirements: RequirementBreakdown
  stage: Stage
  visualDirection: string
  nextAction: string
  blocker: string
  people: string[]
  links: string[]
  keyRequirements: string[]
  openQuestions: string[]
  latestFeedback: string
  latestChangelist: string
  createdAt: string
  updatedAt: string
  workLogs: WorkLog[]
  feedback: FeedbackRequest[]
  testing: ChecklistItem[]
  testingInstructions: TestingInstructions
  submission: Submission
  impactTags: string[]
  followUps: FollowUp[]
  reflection: Reflection
  creativeBrief: CreativeBrief
  bugFix: BugFixDetails
  optimization: OptimizationDetails
  hookup: HookupDetails
  research: ResearchDetails
  leanCanvas?: Record<string, string>
  detailPreferences?: TaskDetailPreferences
  history: HistoryEntry[]
  workPage?: WorkPageBlock[]
}

export interface TaskTemplate {
  id: string
  name: string
  description: string
  requiredStates: string[]
  requirementQuestions: string[]
  feedbackQuestions: string[]
  impactTags: string[]
  submissionChecklist: string[]
  commonTags?: string[]
  testItems?: string[]
  clarificationQuestions?: string[]
  reflectionPrompts?: string[]
  workType?: WorkType
  effectType?: EffectType
  messageTypes?: string[]
  sections?: string[]
  pipelineId?: string
}

export interface SavedView {
  id: string
  name: string
  filters: Record<string, string>
}

export interface AppData {
  dataVersion?: number
  tasks: Task[]
  templates: TaskTemplate[]
  focusTaskIds: string[]
  savedViews?: SavedView[]
  recentFilters?: Record<string, string>[]
  pinnedTaskIds?: string[]
  recentTaskIds?: string[]
  taskViewState?: Record<string, TaskUIState>
  customWorkTypes?: string[]
  customEffectTypes?: string[]
  preferences?: {
    autoArchiveDays: 0 | 30 | 60 | 90
    taskPageDensity?: TaskPageDensity
    defaultTaskTab?: WorkPageDefaultTab
  }
  families?: TaskFamily[]
  pipelines?: PipelineCard[]
  promotedLessons?: PromotedLesson[]
}
