export const DELETE_CONFIRMATION_PHRASE = "삭제 확인";

export function hasValidDeleteConfirmation(formData: FormData): boolean {
  return formData.get("deleteConfirmation") === DELETE_CONFIRMATION_PHRASE;
}
