import { apiFetch } from '@/shared/api/fetch-client';
import {
  BeltsResponse,
  normalizeBeltsResponse,
} from '@/features/belts/types/belt';

export function listBelts() {
  return apiFetch<BeltsResponse>('/belts', {
    method: 'GET',
    cache: 'no-store',
  }).then(normalizeBeltsResponse);
}
