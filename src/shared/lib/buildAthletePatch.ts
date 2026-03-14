// src/app/utils/buildAthletePatch.ts
import type { Athlete } from '@/app/types';

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * Compara "current" vs "draft" e retorna somente os campos alterados (patch).
 * Inclui merge parcial para "category".
 */
export function buildAthletePatch(
  current: Athlete,
  draft: Athlete,
): DeepPartial<Athlete> {
  const patch: DeepPartial<Athlete> = {};

  if (draft.name !== undefined && draft.name !== current.name)
    patch.name = draft.name;
  if (draft.age !== undefined && draft.age !== current.age)
    patch.age = draft.age;
  if (draft.weight !== undefined && draft.weight !== current.weight)
    patch.weight = draft.weight;
  if (draft.academy !== undefined && draft.academy !== current.academy)
    patch.academy = draft.academy;
  if (draft.belt !== undefined && draft.belt !== current.belt)
    patch.belt = draft.belt;
  if (draft.gender !== undefined && draft.gender !== current.gender)
    patch.gender = draft.gender;
  if (draft.isApto !== undefined && draft.isApto !== current.isApto)
    patch.isApto = draft.isApto;
  if (draft.status !== undefined && draft.status !== current.status)
    patch.status = draft.status;

  if (draft.category) {
    const catPatch: DeepPartial<Athlete['category']> = {};
    if (
      draft.category.name !== undefined &&
      draft.category.name !== current.category?.name
    )
      catPatch.name = draft.category.name;
    if (
      draft.category.minWeight !== undefined &&
      draft.category.minWeight !== current.category?.minWeight
    )
      catPatch.minWeight = draft.category.minWeight;
    if (
      draft.category.maxWeight !== undefined &&
      draft.category.maxWeight !== current.category?.maxWeight
    )
      catPatch.maxWeight = draft.category.maxWeight;
    if (
      draft.category.minAge !== undefined &&
      draft.category.minAge !== current.category?.minAge
    )
      catPatch.minAge = draft.category.minAge;
    if (
      draft.category.maxAge !== undefined &&
      draft.category.maxAge !== current.category?.maxAge
    )
      catPatch.maxAge = draft.category.maxAge;
    if (
      draft.category.belt !== undefined &&
      draft.category.belt !== current.category?.belt
    )
      catPatch.belt = draft.category.belt;
  }
  return patch;
}
