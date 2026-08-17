import type { BillSplitServiceApplicationFeaturesAdminGetMemberPermissionsMemberPermissionsDto as MemberPermissionsDto } from "@/generated/api/models";

const CURRENT_ACCESS_UPDATED_EVENT = "splitly:current-access-updated";
const AUTH_SESSION_EXPIRED_EVENT = "splitly:auth-session-expired";

export function publishCurrentAccess(currentAccess: MemberPermissionsDto) {
  window.dispatchEvent(
    new CustomEvent<MemberPermissionsDto>(CURRENT_ACCESS_UPDATED_EVENT, {
      detail: currentAccess,
    }),
  );
}

export function subscribeCurrentAccess(
  listener: (currentAccess: MemberPermissionsDto) => void,
) {
  const handleUpdate = (event: Event) => {
    listener((event as CustomEvent<MemberPermissionsDto>).detail);
  };

  window.addEventListener(CURRENT_ACCESS_UPDATED_EVENT, handleUpdate);
  return () =>
    window.removeEventListener(CURRENT_ACCESS_UPDATED_EVENT, handleUpdate);
}

export function publishAuthSessionExpired() {
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}

export function subscribeAuthSessionExpired(listener: () => void) {
  window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, listener);
  return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, listener);
}
