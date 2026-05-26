import { Fight, FightOrderItem } from '@/features/fights/types/fight';

export function sortFightsByOrder(fights: Fight[]) {
  return [...fights].sort((fightA, fightB) => {
    const orderA = fightA.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = fightB.order ?? Number.MAX_SAFE_INTEGER;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return fightA.id.localeCompare(fightB.id, 'pt-BR');
  });
}

export function normalizeFightOrders(fights: Fight[]) {
  return fights.map((fight, index) => ({
    ...fight,
    order: index + 1,
  }));
}

export function moveFightBeforeVisibleTarget(
  fights: Fight[],
  visibleFightIds: string[],
  draggedFightId: string,
  targetFightId: string,
) {
  if (draggedFightId === targetFightId) {
    return fights;
  }

  const sourceVisibleIndex = visibleFightIds.indexOf(draggedFightId);
  const targetVisibleIndex = visibleFightIds.indexOf(targetFightId);

  if (sourceVisibleIndex === -1 || targetVisibleIndex === -1) {
    return fights;
  }

  const sourceIndex = fights.findIndex((fight) => fight.id === draggedFightId);
  const targetIndex = fights.findIndex((fight) => fight.id === targetFightId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return fights;
  }

  const next = [...fights];
  const [movedFight] = next.splice(sourceIndex, 1);
  const adjustedTargetIndex =
    sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  next.splice(adjustedTargetIndex, 0, movedFight);

  return normalizeFightOrders(next);
}

export function moveFightToEndOfVisibleList(
  fights: Fight[],
  visibleFightIds: string[],
  draggedFightId: string,
) {
  const sourceVisibleIndex = visibleFightIds.indexOf(draggedFightId);

  if (sourceVisibleIndex === -1) {
    return fights;
  }

  const sourceIndex = fights.findIndex((fight) => fight.id === draggedFightId);

  if (sourceIndex === -1) {
    return fights;
  }

  const next = [...fights];
  const [movedFight] = next.splice(sourceIndex, 1);
  next.push(movedFight);

  return normalizeFightOrders(next);
}

export function buildFightOrderItems(fights: Fight[]): FightOrderItem[] {
  return fights.map((fight, index) => ({
    fightId: Number(fight.id),
    orderIndex: index + 1,
  }));
}

export function canPersistFightOrder(fights: Fight[]) {
  return fights.every((fight) => {
    const normalizedId = Number(fight.id);
    return Number.isInteger(normalizedId) && normalizedId > 0;
  });
}
