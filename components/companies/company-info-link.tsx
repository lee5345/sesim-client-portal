import Link from "next/link";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";

type CompanyInfoLinkProps = {
  companyId: string;
};

export function CompanyInfoLink({ companyId }: CompanyInfoLinkProps) {
  return (
    <Button
      nativeButton={false}
      variant="outline"
      size="icon-sm"
      aria-label="고객사 등록 정보"
      render={<Link href={`/firm/companies/${companyId}/info`} />}
    >
      <Info className="size-4" />
    </Button>
  );
}
