"use client";



import {

  FormField,

  FormHelperText,

  FormLabel,

} from "@/components/ui/form-field";



export function LearnerVisibilityField({

  id,

  visible,

  onChange,

  label = "Learner visibility",

  checkboxLabel = "Visible to learners",

  description = "When checked, learners can see this after the course is published.",

}: {

  id: string;

  visible: boolean;

  onChange: (visible: boolean) => void;

  label?: string;

  checkboxLabel?: string;

  description?: string;

}) {

  return (

    <FormField>

      <FormLabel htmlFor={id}>{label}</FormLabel>

      <label

        htmlFor={id}

        className="flex cursor-pointer items-start gap-3 rounded-xl border bg-input-background/50 p-4 text-sm transition-colors hover:border-foreground/20"

      >

        <input

          id={id}

          type="checkbox"

          checked={visible}

          onChange={(e) => onChange(e.target.checked)}

          className="mt-0.5 size-4 shrink-0 rounded-md border-input"

        />

        <span>

          <span className="font-medium text-foreground">{checkboxLabel}</span>

          <FormHelperText className="mt-1">{description}</FormHelperText>

        </span>

      </label>

    </FormField>

  );

}

