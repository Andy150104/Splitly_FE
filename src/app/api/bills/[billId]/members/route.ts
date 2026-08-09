import { z } from "zod";

import { failure, ok } from "@/app/api/_shared/response";
import { getCurrentUser } from "@/lib/auth/session";
import { api } from "@/lib/api/server/api";

type SyncMembersInput = {
  emails: string[];
  groupMembers: Array<{ memberId: string; email: string }>;
  includeOwner: boolean;
  groupId?: string | null;
  participantEmails: string[];
};

const schema = z.object({
  emails: z.array(z.string().trim().toLowerCase().email()).max(50),
  groupMembers: z
    .array(
      z.object({
        memberId: z.string().uuid(),
        email: z.string().trim().toLowerCase().email(),
      }),
    )
    .max(50)
    .default([]),
  includeOwner: z.boolean(),
  groupId: z.string().uuid().nullable().optional(),
  participantEmails: z
    .array(z.string().trim().toLowerCase().email())
    .min(1)
    .max(51),
});

/**
 * Synchronizes the draft bill membership with the wizard selection.
 *
 * The backend exposes add/remove operations rather than a replace endpoint.
 * Keeping the synchronization in the BFF makes revisiting Step 2 idempotent:
 * going Back → changing participants → Continue will not duplicate members.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ billId: string }> },
) {
  try {
    const { billId } = await context.params;
    const input: SyncMembersInput = schema.parse(await request.json());
    const currentUser = await getCurrentUser();
    const detail = await api.bills.getById(billId);

    await api.bills.update(billId, {
      title: detail.title ?? "",
      totalAmount: detail.totalAmount ?? 0,
      currency: detail.currency ?? "VND",
      groupId: input.groupId ?? null,
      billDate: detail.billDate ?? null,
      dueDate: detail.dueDate ?? null,
      description: detail.description ?? null,
    });

    const desiredEmails = new Set(
      input.participantEmails.map((email) => email.toLowerCase()),
    );
    const currentMembers = detail.members ?? [];

    for (const member of currentMembers) {
      const email = member.email?.trim().toLowerCase();
      if (member.memberId && email && !desiredEmails.has(email)) {
        await api.bills.removeMember(billId, member.memberId);
      }
    }

    const remainingEmails = new Set(
      currentMembers
        .map((member) => member.email?.trim().toLowerCase())
        .filter((email): email is string =>
          Boolean(email && desiredEmails.has(email)),
        ),
    );
    const ownerEmail = currentUser?.email.trim().toLowerCase();
    const selectedGroupEmails = new Set(
      input.groupMembers.map((member) => member.email),
    );
    const missingDirectEmails = input.emails.filter(
      (email) =>
        !remainingEmails.has(email) &&
        !selectedGroupEmails.has(email) &&
        !(input.includeOwner && email === ownerEmail),
    );
    const missingGroupMemberIds = input.groupMembers
      .filter(
        (member) =>
          !remainingEmails.has(member.email) &&
          !(input.includeOwner && member.email === ownerEmail),
      )
      .map((member) => member.memberId);
    const shouldAddOwner = input.includeOwner
      ? ownerEmail
        ? !remainingEmails.has(ownerEmail)
        : true
      : false;

    if (
      missingDirectEmails.length > 0 ||
      missingGroupMemberIds.length > 0 ||
      shouldAddOwner
    ) {
      await api.bills.addMembers(billId, {
        emails: missingDirectEmails,
        groupMemberIds: missingGroupMemberIds,
        includeOwner: shouldAddOwner,
      });
    }

    return ok({ synchronized: true });
  } catch (error) {
    return failure(error);
  }
}
