import "server-only";

import { getBillSplitServiceAPI } from "@/generated/api/endpoints";
import type {
  BillSplitServiceApiControllersBillsControllerAddBillMembersRequest as AddBillMembersRequest,
  BillSplitServiceApiControllersBillsControllerCalculateBillRequest as CalculateBillRequest,
  BillSplitServiceApiControllersBillsControllerCancelBillRequest as CancelBillRequest,
  BillSplitServiceApiControllersBillsControllerManualPaymentRequest as ManualPaymentRequest,
  BillSplitServiceApiControllersBillsControllerSaveBillRequest as SaveBillRequest,
  BillSplitServiceApiControllersBillsControllerSendRemindersRequest as SendRemindersRequest,
  GetApiBillsParams,
} from "@/generated/api/models";
import { unwrap } from "@/lib/api/shared/unwrap";
import { authenticatedCall } from "@/lib/api/server/require-session";

const generated = getBillSplitServiceAPI();

export const billsApi = {
  async getAll(params?: GetApiBillsParams) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.getApiBills(params, opts)),
    );
  },
  async getById(billId: string) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.getApiBillsBillId(billId, opts)),
    );
  },
  async create(input: SaveBillRequest) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.postApiBills(input, opts)),
    );
  },
  async update(billId: string, input: SaveBillRequest) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.putApiBillsBillId(billId, input, opts)),
    );
  },
  async addMembers(billId: string, input: AddBillMembersRequest) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.postApiBillsBillIdMembers(billId, input, opts)),
    );
  },
  async removeMember(billId: string, memberId: string) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.deleteApiBillsBillIdMembersMemberId(billId, memberId, opts)),
    );
  },
  async calculate(billId: string, input: CalculateBillRequest) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.postApiBillsBillIdCalculate(billId, input, opts)),
    );
  },
  async publish(billId: string) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.postApiBillsBillIdPublish(billId, opts)),
    );
  },
  async cancel(billId: string, input: CancelBillRequest) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.postApiBillsBillIdCancel(billId, input, opts)),
    );
  },
  async remind(billId: string, input: SendRemindersRequest) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.postApiBillsBillIdReminders(billId, input, opts)),
    );
  },
  async recordManualPayment(billId: string, memberId: string, input: ManualPaymentRequest) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.postApiBillsBillIdMembersMemberIdManualPayments(billId, memberId, input, opts)),
    );
  },
};
