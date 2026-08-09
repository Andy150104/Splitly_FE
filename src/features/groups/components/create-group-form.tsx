"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bffFetch } from "@/lib/http/browser-http-client";

const schema = z.object({ name: z.string().trim().min(1, "Nhập tên nhóm.").max(150), description: z.string().trim().max(500).optional() });
type Values = z.infer<typeof schema>;

export function CreateGroupForm() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", description: "" } });
  if (!open) return <Button onClick={() => setOpen(true)}><Plus className="size-4" />Tạo nhóm</Button>;
  return <Card className="border-primary/25"><CardContent className="p-5"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-semibold">Tạo nhóm mới</h2><p className="text-sm text-muted-foreground">Dùng lại danh sách thành viên cho nhiều hóa đơn.</p></div><Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Đóng"><X className="size-4" /></Button></div><form className="grid gap-4 md:grid-cols-[1fr_1.4fr_auto] md:items-end" onSubmit={form.handleSubmit(async (values) => { try { await bffFetch("/api/groups", { method: "POST", body: JSON.stringify(values) }); toast.success("Đã tạo nhóm"); form.reset(); setOpen(false); router.refresh(); } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể tạo nhóm."); } })}><div className="space-y-2"><Label htmlFor="group-name">Tên nhóm</Label><Input id="group-name" placeholder="Gia đình, chuyến đi…" {...form.register("name")} />{form.formState.errors.name ? <p className="text-xs text-destructive">{form.formState.errors.name.message}</p> : null}</div><div className="space-y-2"><Label htmlFor="group-description">Mô tả</Label><Input id="group-description" placeholder="Nhóm dùng cho những khoản chi nào?" {...form.register("description")} /></div><Button type="submit" isLoading={form.formState.isSubmitting} loadingText="Đang lưu…">Lưu nhóm</Button></form></CardContent></Card>;
}
