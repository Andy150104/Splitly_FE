import { failure, ok } from "@/app/api/_shared/response";
import { getBillSplitServiceAPI } from "@/generated/api/endpoints";

const generated = getBillSplitServiceAPI();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      contactEmail?: string;
      type?: string;
      billId?: string;
      description?: string;
    };

    if (!body.contactEmail?.trim()) {
      return failure(new Error("Vui lòng nhập Email liên hệ."));
    }
    if (!body.description?.trim()) {
      return failure(new Error("Vui lòng nhập mô tả sự cố."));
    }

    await generated.postApiSupportRequests({
      contactEmail: body.contactEmail.trim().toLowerCase(),
      type: body.type || "PaymentIssue",
      billId: body.billId || undefined,
      description: body.description.trim(),
    });

    return ok({ success: true, message: "Đã gửi yêu cầu hỗ trợ thành công." });
  } catch (error) {
    return failure(error);
  }
}
