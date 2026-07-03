"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  FormField,
  FormHelperText,
  FormLabel,
} from "@/components/ui/form-field";
import {
  isPredefinedCategory,
  PROJECT_CATEGORIES,
  PROJECT_CATEGORY_CUSTOM,
} from "@/lib/project-categories";

type ProductCategoryFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
};

function initialMode(category: string | null | undefined): "predefined" | "custom" {
  if (!category?.trim()) return "predefined";
  return isPredefinedCategory(category.trim()) ? "predefined" : "custom";
}

export function ProductCategoryField({
  id = "category",
  value,
  onChange,
}: ProductCategoryFieldProps) {
  const [mode, setMode] = React.useState<"predefined" | "custom">(() =>
    initialMode(value)
  );
  const [customValue, setCustomValue] = React.useState(() =>
    mode === "custom" ? value : ""
  );

  React.useEffect(() => {
    const nextMode = initialMode(value);
    setMode(nextMode);
    if (nextMode === "custom") {
      setCustomValue(value);
    }
  }, [value]);

  function handleSelectChange(next: string) {
    if (next === PROJECT_CATEGORY_CUSTOM) {
      setMode("custom");
      onChange(customValue);
      return;
    }
    setMode("predefined");
    setCustomValue("");
    onChange(next);
  }

  function handleCustomChange(next: string) {
    setCustomValue(next);
    onChange(next);
  }

  const selectValue =
    mode === "custom" || (value && !isPredefinedCategory(value))
      ? PROJECT_CATEGORY_CUSTOM
      : value;

  return (
    <FormField>
      <FormLabel htmlFor={id}>Category</FormLabel>
      <Select
        id={id}
        value={selectValue}
        onChange={(e) => handleSelectChange(e.target.value)}
      >
        <option value="" disabled>
          Select a category
        </option>
        {PROJECT_CATEGORIES.map((label) => (
          <option key={label} value={label}>
            {label}
          </option>
        ))}
        <option value={PROJECT_CATEGORY_CUSTOM}>Other — enter a custom category</option>
      </Select>
      {(mode === "custom" ||
        (selectValue === PROJECT_CATEGORY_CUSTOM && !isPredefinedCategory(value))) && (
        <Input
          id={`${id}-custom`}
          value={customValue}
          onChange={(e) => handleCustomChange(e.target.value)}
          placeholder="Enter a custom category label"
          maxLength={80}
          aria-label="Custom category"
        />
      )}
      <FormHelperText>
        Choose a common category or enter your own if none fit.
      </FormHelperText>
    </FormField>
  );
}
