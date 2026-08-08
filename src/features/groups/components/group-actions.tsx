"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bffFetch } from "@/lib/http/browser-http-client";

export function AddGroupMembers({ groupId }: { groupId: string }) {
  const [value, setValue] = useState(""); const [pending, setPending] = useState(false); const router = useRouter();
  return <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={async (event) => { event.preventDefault(); const emails = value.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean); if (!emails.length) return; setPending(true); try { const result = await bffFetch<{ addedCount?: number; pendingAccountCount?: number }>(`/api/groups/${groupId}/members`, { method: "POST", body: JSON.stringify({ emails }) }); toast.success(`Đã thêm ${result.addedCount ?? emails.length} thành viên`); setValue(""); router.refresh(); } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể thêm thành viên."); } finally { setPending(false); } }}><div className="flex-1 space-y-2"><Label htmlFor="member-emails">Email thành viên</Label><Input id="member-emails" value={value} onChange={(event) => setValue(event.target.value)} placeholder="anna@example.com, minh@example.com" /></div><Button disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Thêm thành viên</Button></form>;
}

export function RemoveGroupMember({ groupId, memberId }: { groupId: string; memberId: string }) {
  const [pending, setPending] = useState(false); const router = useRouter();
  return <Button variant="ghost" size="icon" aria-label="Xóa thành viên" disabled={pending} onClick={async () => { if (!window.confirm("Xóa thành viên này khỏi nhóm? Lịch sử vẫn được backend giữ lại.")) return; setPending(true); try { await bffFetch(`/api/groups/${groupId}/members/${memberId}`, { method: "DELETE" }); toast.success("Đã xóa thành viên khỏi nhóm"); router.refresh(); } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể xóa thành viên."); } finally { setPending(false); } }}><Trash2 className="size-4 text-destructive" /></Button>;
}

export function CloseGroupButton({ groupId }: { groupId: string }) {
  const [pending, setPending] = useState(false); const router = useRouter();
  return <Button variant="outline" disabled={pending} onClick={async () => { if (!window.confirm("Đóng nhóm? Nhóm sẽ không thể nhận thành viên hoặc hóa đơn mới.")) return; setPending(true); try { await bffFetch(`/api/groups/${groupId}/close`, { method: "POST" }); toast.success("Đã đóng nhóm"); router.refresh(); } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể đóng nhóm."); } finally { setPending(false); } }}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Đóng nhóm</Button>;
}
