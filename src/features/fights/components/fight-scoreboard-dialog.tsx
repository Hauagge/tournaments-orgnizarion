'use client';

import { Fight } from '@/features/fights/types/fight';
import { FightScoreboardScreen } from '@/features/fights/components/fight-scoreboard-screen';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/dialog';

type FightScoreboardDialogProps = {
  fight: Fight | null;
  isOpen: boolean;
  initialDurationSeconds?: number;
  autoStartToken: number;
  onClose: () => void;
  onSubmissionFinishSelection: (fightId: string, winnerId: string) => void;
  onFinish: (fightId: string) => void;
};

export function FightScoreboardDialog({
  fight,
  isOpen,
  initialDurationSeconds = 300,
  autoStartToken,
  onClose,
  onSubmissionFinishSelection,
  onFinish,
}: FightScoreboardDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="!inset-0 !left-0 !right-0 !top-0 !h-screen !w-screen !max-w-none !translate-x-0 !translate-y-0 overflow-hidden rounded-none border-0 bg-[#f7f1e8] p-0">
        <div className="sr-only">
          <DialogTitle>Placar da luta</DialogTitle>
          <DialogDescription>
            Placar em modo operador para acompanhar tempo e pontuação da luta.
          </DialogDescription>
        </div>
        <FightScoreboardScreen
          fight={fight}
          mode="operator"
          initialDurationSeconds={initialDurationSeconds}
          autoStartToken={autoStartToken}
          onSubmissionFinishSelection={onSubmissionFinishSelection}
          onFinish={onFinish}
        />
      </DialogContent>
    </Dialog>
  );
}
