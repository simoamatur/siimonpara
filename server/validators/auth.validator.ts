import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Email غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "6 أحرف على الأقل"),
  name: z.string().min(1),
  role: z.string().optional(),
});
