import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api/client";

/**
 * Pushes backend validation errors onto matching form fields and returns a
 * message for the form-level alert (or "" when every error found a field).
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  overrides: Partial<Record<number, string>> = {}
): string {
  if (!(error instanceof ApiError)) return "Something went wrong. Please try again.";

  if (error.status === 429) return "Too many attempts. Please wait a minute and try again.";
  if (overrides[error.status]) return overrides[error.status]!;

  let unmatched = false;
  for (const fe of error.fieldErrors) {
    const field = fields.find((f) => f === fe.field);
    if (field) setError(field, { type: "server", message: fe.message });
    else unmatched = true;
  }

  return error.fieldErrors.length && !unmatched ? "" : error.message;
}
