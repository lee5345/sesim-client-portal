"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { createCompanyAction } from "@/modules/companies/companies";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddCompanyDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            고객사 추가
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>고객사 추가</DialogTitle>
          <DialogDescription>
            새 고객사를 등록합니다. 사업자등록번호는 선택 사항입니다.
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            await createCompanyAction(formData);
            setOpen(false);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">회사명</Label>
            <Input id="name" name="name" required placeholder="회사명 입력" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessNumber">사업자등록번호 (선택)</Label>
            <Input
              id="businessNumber"
              name="businessNumber"
              placeholder="000-00-00000"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit">추가</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
