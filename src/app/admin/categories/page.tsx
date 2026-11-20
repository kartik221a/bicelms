import { Plus, Tags, Trash2 } from "lucide-react";
import { store } from "@/repositories";
import { CourseDoc } from "@/services/course.service";
import { createCategory, deleteCategory, updateCategory } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryRenameDialog } from "@/components/admin/category-rename-dialog";
import { ConfirmDialogButton } from "@/components/admin/confirm-dialog";

export const metadata = { title: "Categories — BICE Admin" };

export default async function AdminCategoriesPage() {
  const [categories, courses] = await Promise.all([
    store.list<{ id: string; name: string; slug: string; description: string | null; position: number }>("categories", {
      orderBy: [{ field: "position" }],
      limit: 200,
    }),
    store.list<CourseDoc>("courses", { limit: 1000 }),
  ]);

  const counts = new Map<string, number>();
  for (const c of courses) {
    if (c.categoryId) counts.set(c.categoryId, (counts.get(c.categoryId) ?? 0) + 1);
  }

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <PageHeader
        title="Categories"
        count={`${categories.length} categories`}
        description="Organize the catalog into domains students can browse on the public courses page."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create form */}
        <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Plus className="h-4 w-4 text-[#4f46e5]" /> New category
            </CardTitle>
            <CardDescription>The slug is generated from the name automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCategory} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name">Name *</Label>
                <Input id="cat-name" name="name" required placeholder="Data Analysis" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-desc">Description</Label>
                <Textarea id="cat-desc" name="description" rows={3} placeholder="Shown on the category card…" />
              </div>
              <Button type="submit" className="w-full bg-[#4f46e5] text-white hover:bg-[#4338ca]">
                Create category
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">All categories</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {categories.length === 0 ? (
                <div className="p-6">
                  <EmptyState icon={Tags} title="No categories yet" description="Create the first category on the left to organize courses." />
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {categories.map((cat, i) => (
                    <li key={cat.id} className="flex items-center gap-3 px-5 py-3.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef2ff] text-xs font-bold text-[#4f46e5]">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{cat.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          /{cat.slug}
                          {cat.description ? ` · ${cat.description}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {counts.get(cat.id) ?? 0} courses
                      </span>
                      <CategoryRenameDialog
                        categoryId={cat.id}
                        name={cat.name}
                        description={cat.description}
                        action={updateCategory}
                      />
                      <ConfirmDialogButton
                        trigger={
                          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50" aria-label={`Delete category ${cat.name}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        }
                        title="Delete category?"
                        description={`"${cat.name}" will be removed. Courses keep existing but lose their category assignment.`}
                        confirmLabel="Delete category"
                        onConfirm={deleteCategory.bind(null, cat.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
