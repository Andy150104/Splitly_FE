import "server-only";

import { adminApi } from "@/lib/api/server/admin.api";
import { authApi } from "@/lib/api/server/auth.api";
import { billsApi } from "@/lib/api/server/bills.api";
import { groupsApi } from "@/lib/api/server/groups.api";

export const api = {
  admin: adminApi,
  auth: authApi,
  bills: billsApi,
  groups: groupsApi,
};
