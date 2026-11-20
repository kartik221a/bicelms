"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  GripVertical,
  Loader2,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { LessonDoc, SectionDoc } from "@/services/course.service";
import { formatDuration } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialogButton } from "@/components/admin/confirm-dialog";
import { StatusPill } from "@/components/admin/status-pill";
import { cn } from "@/lib/utils";

type SectionWithLessons = SectionDoc & { lessons: LessonDoc[] };

export interface CurriculumBuilderProps {
  courseId: string;
  sections: SectionWithLessons[];
  addSection: (title: string) => Promise<unknown>;
  renameSection: (sectionId: string, title: string) => Promise<unknown>;
  deleteSection: (sectionId: string) => Promise<unknown>;
  reorderSections: (sectionIds: string[]) => Promise<unknown>;
  addLesson: (sectionId: string, formData: FormData) => Promise<unknown>;
  updateLesson: (lessonId: string, formData: FormData) => Promise<unknown>;
  deleteLesson: (lessonId: string) => Promise<unknown>;
  reorderLessons: (sectionId: string, lessonIds: string[]) => Promise<unknown>;
  toggleFreePreview: (lessonId: string, isFree: boolean) => Promise<unknown>;
}

interface LessonDialogState {
  mode: "create" | "edit";
  sectionId: string;
  sectionTitle: string;
  lesson?: LessonDoc;
}

function initialLessonOrder(sections: SectionWithLessons[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const s of sections) out[s.id] = s.lessons.map((l) => l.id);
  return out;
}

export function CurriculumBuilder(props: CurriculumBuilderProps) {
  const { sections } = props;
  const [pending, startTransition] = useTransition();
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => sections.map((s) => s.id));
  const [lessonOrder, setLessonOrder] = useState<Record<string, string[]>>(() => initialLessonOrder(sections));
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(sections.slice(0, 1).map((s) => s.id)));
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [dialog, setDialog] = useState<LessonDialogState | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sectionKey = sections.map((s) => s.id).join(",");
  const lessonKey = sections.map((s) => `${s.id}:${s.lessons.map((l) => l.id).join(".")}`).join("|");

  // Re-sync local order state when the server list changes (revalidation after
  // mutations). Derived-state reset during render — the recommended alternative
  // to setState-in-effect.
  const [syncKeys, setSyncKeys] = useState({ sectionKey, lessonKey });
  if (syncKeys.sectionKey !== sectionKey) {
    setSyncKeys((prev) => ({ ...prev, sectionKey }));
    setSectionOrder(sections.map((s) => s.id));
  }
  if (syncKeys.lessonKey !== lessonKey) {
    setSyncKeys((prev) => ({ ...prev, lessonKey }));
    setLessonOrder(initialLessonOrder(sections));
  }

  const sectionsById = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);

  const orderedSections: SectionWithLessons[] = useMemo(() => {
    const known = sectionOrder.filter((id) => sectionsById.has(id)).map((id) => sectionsById.get(id)!);
    const fresh = sections.filter((s) => !sectionOrder.includes(s.id));
    return [...known, ...fresh];
  }, [sectionOrder, sectionsById, sections]);

  function run(fn: () => Promise<unknown>, successMsg?: string) {
    startTransition(async () => {
      try {
        await fn();
        if (successMsg) toast.success(successMsg);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function displayedLessons(section: SectionWithLessons): LessonDoc[] {
    const order = lessonOrder[section.id] ?? [];
    const byId = new Map(section.lessons.map((l) => [l.id, l]));
    const known = order.filter((id) => byId.has(id)).map((id) => byId.get(id)!);
    const fresh = section.lessons.filter((l) => !order.includes(l.id));
    return [...known, ...fresh];
  }

  function handleSectionDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = sectionOrder.indexOf(String(active.id));
    const newIndex = sectionOrder.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(sectionOrder, oldIndex, newIndex);
    setSectionOrder(next);
    run(() => props.reorderSections(next));
  }

  function handleLessonDragEnd(sectionId: string, current: LessonDoc[], e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = current.map((l) => l.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    setLessonOrder((prev) => ({ ...prev, [sectionId]: next }));
    run(() => props.reorderLessons(sectionId, next));
  }

  function submitNewSection() {
    const title = newSectionTitle.trim();
    if (!title) return;
    setAddingSection(false);
    setNewSectionTitle("");
    run(async () => {
      const created = (await props.addSection(title)) as SectionDoc;
      if (created?.id) {
        setSectionOrder((prev) => [...prev, created.id]);
        setExpanded((prev) => new Set(prev).add(created.id));
      }
    }, "Section added");
  }

  const totals = sections.reduce(
    (acc, s) => ({
      lessons: acc.lessons + s.lessons.length,
      seconds: acc.seconds + s.lessons.reduce((a, l) => a + (l.durationSeconds || 0), 0),
    }),
    { lessons: 0, seconds: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-600">
          <span>
            <span className="font-semibold text-slate-900">{sections.length}</span> sections
          </span>
          <span>
            <span className="font-semibold text-slate-900">{totals.lessons}</span> lessons
          </span>
          <span>
            <span className="font-semibold text-slate-900">{Math.round(totals.seconds / 60)}</span> min total
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <GripVertical className="h-3.5 w-3.5" /> Drag handles to reorder
          </span>
          {pending ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#4f46e5]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
            </span>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setAddingSection(true)}
          className="bg-[#4f46e5] text-white hover:bg-[#4338ca]"
        >
          <Plus className="h-4 w-4" /> Add section
        </Button>
      </div>

      {addingSection ? (
        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-[#c7d2fe] bg-[#eef2ff]/50 p-4 sm:flex-row">
          <Input
            autoFocus
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitNewSection();
              }
            }}
            placeholder="Section title, e.g. Getting started with Excel"
            className="flex-1"
          />
          <div className="flex gap-2">
            <Button type="button" onClick={submitNewSection} className="bg-[#4f46e5] text-white hover:bg-[#4338ca]">
              Add
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAddingSection(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {orderedSections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          <p className="font-medium text-slate-900">No sections yet</p>
          <p className="mt-1 text-sm text-slate-500">Start the curriculum by adding the first section above.</p>
        </div>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={orderedSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {orderedSections.map((section, index) => (
              <SectionCard
                key={section.id}
                index={index}
                section={section}
                displayedLessons={displayedLessons(section)}
                sensors={sensors}
                expanded={expanded.has(section.id)}
                onToggleExpanded={() =>
                  setExpanded((prev) => {
                    const next = new Set(prev);
                    if (next.has(section.id)) next.delete(section.id);
                    else next.add(section.id);
                    return next;
                  })
                }
                onRename={(title) => run(() => props.renameSection(section.id, title), "Section renamed")}
                onDelete={() => run(() => props.deleteSection(section.id), "Section deleted")}
                onAddLesson={() =>
                  setDialog({ mode: "create", sectionId: section.id, sectionTitle: section.title })
                }
                onEditLesson={(lesson) =>
                  setDialog({ mode: "edit", sectionId: section.id, sectionTitle: section.title, lesson })
                }
                onDeleteLesson={(lessonId) => run(() => props.deleteLesson(lessonId), "Lesson deleted")}
                onToggleFree={(lessonId, isFree) => run(() => props.toggleFreePreview(lessonId, isFree))}
                onLessonsReordered={(current, e) => handleLessonDragEnd(section.id, current, e)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {dialog ? (
        <LessonEditorDialog
          key={dialog.lesson?.id ?? `new-${dialog.sectionId}`}
          state={dialog}
          onClose={() => setDialog(null)}
          onCreate={(fd) =>
            run(async () => {
              const created = (await props.addLesson(dialog.sectionId, fd)) as LessonDoc;
              if (created?.id) {
                setLessonOrder((prev) => ({
                  ...prev,
                  [dialog.sectionId]: [...(prev[dialog.sectionId] ?? []), created.id],
                }));
                setExpanded((prev) => new Set(prev).add(dialog.sectionId));
              }
              toast.success("Lesson added");
              setDialog(null);
            })
          }
          onEdit={(fd, isFree) =>
            run(async () => {
              await props.updateLesson(dialog.lesson!.id, fd);
              await props.toggleFreePreview(dialog.lesson!.id, isFree);
              toast.success("Lesson updated");
              setDialog(null);
            })
          }
        />
      ) : null}
    </div>
  );
}

/* ------------------------------ Section card ------------------------------ */

function SectionCard({
  index,
  section,
  displayedLessons,
  sensors,
  expanded,
  onToggleExpanded,
  onRename,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onToggleFree,
  onLessonsReordered,
}: {
  index: number;
  section: SectionWithLessons;
  displayedLessons: LessonDoc[];
  sensors: ReturnType<typeof useSensors>;
  expanded: boolean;
  onToggleExpanded: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onAddLesson: () => void;
  onEditLesson: (lesson: LessonDoc) => void;
  onDeleteLesson: (lessonId: string) => void;
  onToggleFree: (lessonId: string, isFree: boolean) => void;
  onLessonsReordered: (current: LessonDoc[], e: DragEndEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(section.title);
  const totalSeconds = section.lessons.reduce((a, l) => a + (l.durationSeconds || 0), 0);

  function saveRename() {
    const title = renameValue.trim();
    setRenaming(false);
    if (title && title !== section.title) onRename(title);
  }

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]", isDragging && "z-20 opacity-80 ring-2 ring-[#4f46e5]")}
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing"
            aria-label={`Drag to reorder section ${section.title}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleExpanded}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse section" : "Expand section"}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <div className="min-w-0 flex-1">
            {renaming ? (
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveRename();
                    }
                  }}
                  className="h-8"
                />
                <Button type="button" size="sm" className="h-8 bg-[#4f46e5] text-white hover:bg-[#4338ca]" onClick={saveRename}>
                  Save
                </Button>
                <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setRenaming(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <p className="truncate text-sm font-semibold text-slate-900">
                  {index + 1}. {section.title}
                </p>
                <p className="text-xs text-slate-500">
                  {section.lessons.length} lessons · {Math.round(totalSeconds / 60)} min
                </p>
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs text-slate-600"
              onClick={() => {
                setRenameValue(section.title);
                setRenaming(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" /> Rename
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-xs text-[#4f46e5]" onClick={onAddLesson}>
              <Plus className="h-3.5 w-3.5" /> Add lesson
            </Button>
            <ConfirmDialogButton
              trigger={
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50" aria-label="Delete section">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              }
              title="Delete section?"
              description={`"${section.title}" and its lesson list will be removed. Lessons in this section are also deleted.`}
              confirmLabel="Delete section"
              onConfirm={onDelete}
            />
          </div>
        </div>

        {expanded ? (
          <div className="border-t border-slate-100 px-4 pb-4 pt-3 sm:pl-[4.5rem]">
            {section.lessons.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                No lessons in this section yet — use &ldquo;Add lesson&rdquo; to create the first one.
              </p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => onLessonsReordered(displayedLessons, e)}>
                <SortableContext items={displayedLessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {displayedLessons.map((lesson, i) => (
                      <LessonRow
                        key={lesson.id}
                        index={i}
                        lesson={lesson}
                        onEdit={() => onEditLesson(lesson)}
                        onDelete={() => onDeleteLesson(lesson.id)}
                        onToggleFree={(isFree) => onToggleFree(lesson.id, isFree)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
            <button
              type="button"
              onClick={onAddLesson}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-[#4f46e5] hover:bg-[#eef2ff]/60 hover:text-[#4f46e5]"
            >
              <Plus className="h-4 w-4" /> Add lesson to &ldquo;{section.title}&rdquo;
            </button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Lesson row ------------------------------ */

function LessonRow({
  index,
  lesson,
  onEdit,
  onDelete,
  onToggleFree,
}: {
  index: number;
  lesson: LessonDoc;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFree: (isFree: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
  const [toggling, startToggle] = useTransition();

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 transition-colors hover:bg-slate-50",
        isDragging && "z-20 shadow-md ring-2 ring-[#4f46e5]"
      )}
    >
      <button
        type="button"
        className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded text-slate-300 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
        aria-label={`Drag to reorder lesson ${lesson.title}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-500">
        <PlayCircle className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">
          {index + 1}. {lesson.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span>{formatDuration(lesson.durationSeconds || 0)}</span>
          <span aria-hidden>·</span>
          {lesson.isFreePreview ? (
            <span className="inline-flex items-center gap-1 font-medium text-amber-600">
              <Eye className="h-3 w-3" /> Free preview
            </span>
          ) : (
            <span className="text-slate-400">Locked (paid)</span>
          )}
          <span aria-hidden>·</span>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium">
            {lesson.completionRule === "manual" ? "Manual mark complete" : "Auto (watch 90%)"}
          </Badge>
          {lesson.status !== "published" ? <StatusPill status={lesson.status} className="px-1.5 py-0 text-[10px]" /> : null}
        </div>
      </div>
      <label className="hidden shrink-0 items-center gap-2 sm:flex">
        <span className="text-xs text-slate-500">Free preview</span>
        <Switch
          checked={lesson.isFreePreview}
          disabled={toggling}
          onCheckedChange={(v) => startToggle(() => void onToggleFree(v))}
          aria-label={`Toggle free preview for ${lesson.title}`}
        />
      </label>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
          onClick={onEdit}
          aria-label={`Edit lesson ${lesson.title}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <ConfirmDialogButton
          trigger={
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50" aria-label={`Delete lesson ${lesson.title}`}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          }
          title="Delete lesson?"
          description={`"${lesson.title}" will be permanently removed from the curriculum.`}
          confirmLabel="Delete lesson"
          onConfirm={onDelete}
        />
      </div>
    </div>
  );
}

/* ------------------------------ Lesson dialog ------------------------------ */

function LessonEditorDialog({
  state,
  onClose,
  onCreate,
  onEdit,
}: {
  state: LessonDialogState;
  onClose: () => void;
  onCreate: (fd: FormData) => void;
  onEdit: (fd: FormData, isFree: boolean) => void;
}) {
  const lesson = state.lesson;
  const [completionRule, setCompletionRule] = useState(lesson?.completionRule ?? "auto_90");
  const [status, setStatus] = useState(lesson?.status ?? "published");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (state.mode === "create") {
      onCreate(fd);
      return;
    }
    const isFree = fd.get("isFreePreview") === "on";
    onEdit(fd, isFree);
  }

  return (
    <Dialog open onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{state.mode === "create" ? `Add lesson to "${state.sectionTitle}"` : "Edit lesson"}</DialogTitle>
          <DialogDescription>
            {state.mode === "create"
              ? "New lessons are appended to the end of this section."
              : "Update the lesson details and video source."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lesson-title">Title *</Label>
            <Input id="lesson-title" name="title" required minLength={2} defaultValue={lesson?.title ?? ""} placeholder="Cell referencing & data types" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lesson-description">Description</Label>
            <Textarea id="lesson-description" name="description" rows={3} defaultValue={lesson?.description ?? ""} placeholder="What this lesson covers…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lesson-video">Video URL / storage ID</Label>
            <Input id="lesson-video" name="videoStorageId" defaultValue={lesson?.videoStorageId ?? ""} placeholder="https://res.cloudinary.com/…/lesson.mp4 or cloudinary asset id" />
            <p className="text-xs text-slate-500">
              Cloudinary signed direct-upload activates automatically when configured. Playback is always proxied through
              signed, watermarked tokens — never expose raw URLs to students.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lesson-duration">Duration (seconds)</Label>
              <Input
                id="lesson-duration"
                name="durationSeconds"
                type="number"
                min={0}
                step={1}
                defaultValue={String(lesson?.durationSeconds ?? 0)}
              />
              <p className="text-xs text-slate-500">
                {formatDuration(lesson?.durationSeconds ?? 0)} current · e.g. 1125 = 18:45
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Completion rule</Label>
              <input type="hidden" name="completionRule" value={completionRule} />
              <Select value={completionRule} onValueChange={setCompletionRule}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto_90">Auto (watch 90%)</SelectItem>
                  <SelectItem value="manual">Manual mark complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <input type="hidden" name="status" value={status} />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <Checkbox name="isFreePreview" defaultChecked={lesson?.isFreePreview ?? false} />
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-amber-600" /> Free preview lesson
                </span>
              </label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#4f46e5] text-white hover:bg-[#4338ca]">
              {state.mode === "create" ? "Add lesson" : "Save lesson"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
