import { MembershipRole, UserRole } from "@prisma/client";

export type RequestActor = {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId: string | null;
  organizationName: string | null;
  membershipRole: MembershipRole | null;
};
