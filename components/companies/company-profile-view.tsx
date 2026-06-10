"use client";

import {
  COMPANY_PROFILE_SECTIONS,
  type CompanyProfile,
  type CompanyProfileFieldDef,
} from "@/lib/companies/profile-fields";
import { CompanyProfileFieldRow } from "@/components/companies/company-profile-field-row";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
type CompanyProfileViewProps = {
  companyId: string;
  profile: CompanyProfile;
};

function fieldGridClass(field: CompanyProfileFieldDef) {
  return field.type === "textarea" ? "sm:col-span-2" : undefined;
}

export function CompanyProfileView({
  companyId,
  profile,
}: CompanyProfileViewProps) {
  return (
    <div className="space-y-6">
      {COMPANY_PROFILE_SECTIONS.map((section) => (
        <Card key={section.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {section.fields ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <CompanyProfileFieldRow
                    key={field.key}
                    companyId={companyId}
                    field={field}
                    profile={profile}
                    className={fieldGridClass(field)}
                  />
                ))}
              </div>
            ) : null}

            {section.groups ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {section.groups.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-lg border bg-muted/30 p-3"
                  >
                    <p className="mb-2 text-sm font-semibold">{group.title}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.fields.map((field) => (
                        <CompanyProfileFieldRow
                          key={field.key}
                          companyId={companyId}
                          field={field}
                          profile={profile}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
