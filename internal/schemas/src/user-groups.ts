import { z } from "zod";

export const createUserGroupSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  description: z.string().optional(),
});

export const updateUserGroupSchema = createUserGroupSchema.partial();

export type CreateUserGroupInput = z.infer<typeof createUserGroupSchema>;
export type UpdateUserGroupInput = z.infer<typeof updateUserGroupSchema>;

/** DB 行型（user_group_members count join） */
export type UserGroupRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  user_group_members: { count: number }[];
};
