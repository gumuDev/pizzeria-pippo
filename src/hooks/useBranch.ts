import { useGetIdentity } from "@refinedev/core";

interface Identity {
  id: string;
  name: string;
  role: string;
  branch_id: string | null;
}

export function useBranch() {
  const { data: identity } = useGetIdentity<Identity>();
  return identity?.branch_id ?? null;
}
