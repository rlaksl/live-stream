"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BroadcastFormState } from "./actions";
import { isoToKstInput } from "./schedule";
import { CATEGORIES, CATEGORY_LABEL, type Category } from "./types";

type Props = {
  action: (state: BroadcastFormState, formData: FormData) => Promise<BroadcastFormState>;
  defaultValues?: { title: string; description: string; category: Category; scheduled_at: string | null };
  submitLabel: string;
};

export function BroadcastForm({ action, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">제목</Label>
        <Input id="title" name="title" required maxLength={100} defaultValue={defaultValues?.title} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="category">카테고리</Label>
        <select
          id="category"
          name="category"
          defaultValue={defaultValues?.category ?? "talk"}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-background">
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="scheduled_at">방송 예정 시각 (선택, 한국 시간) — 편성표에 표시</Label>
        <Input
          id="scheduled_at"
          name="scheduled_at"
          type="datetime-local"
          defaultValue={isoToKstInput(defaultValues?.scheduled_at ?? null)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">설명 (선택)</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          maxLength={1000}
          defaultValue={defaultValues?.description}
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}
