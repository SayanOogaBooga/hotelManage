import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    permissions: {
      canEdit: boolean;
      canCreate: boolean;
      canDelete: boolean;
      canManageUsers: boolean;
      canViewRevenue: boolean;
    };
  }
  interface Session {
    user: User & { name?: string | null; email?: string | null; image?: string | null };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    permissions: {
      canEdit: boolean;
      canCreate: boolean;
      canDelete: boolean;
      canManageUsers: boolean;
      canViewRevenue: boolean;
    };
  }
}
