import type { Profile } from '@prisma/client';
import type { CurrentUserPayload } from './types/jwt.types';

export function toCurrentUserPayload(profile: Profile): CurrentUserPayload {
  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    branch_id: profile.branchId,
    full_name: profile.fullName,
    business_id: profile.businessId,
  };
}
