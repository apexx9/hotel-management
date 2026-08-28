import * as zod from "zod";

export const loginSchema = zod.object({
  identifier: zod
    .string()
    .trim()
    .min(1, "Email or phone number is required")
    .superRefine((value, ctx) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[+]?[\d\s()-]{7,}$/;
      const isValidEmail = emailRegex.test(value);
      const isValidPhone = phoneRegex.test(value) && /\d/.test(value);

      if (!isValidEmail && !isValidPhone) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid email address or phone number",
        });
      }
    }),
  password: zod.string().min(6, "Password must be at least 6 characters long"),
});

export const registerSchema = zod
  .object({
    hotel: zod.object({
      name: zod.string().min(1, "Hotel name is required"),
      email: zod.string().email("Invalid hotel email address"),
      phone: zod.string().optional(),
      address: zod.string().optional(),
    }),
    owner: zod.object({
      fullName: zod.string().min(1, "Owner full name is required"),
      email: zod.string().email("Invalid owner email address"),
      phone: zod.string().optional(),
      password: zod
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain an uppercase letter")
        .regex(/[a-z]/, "Password must contain a lowercase letter")
        .regex(/\d/, "Password must contain a number")
        .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
    }),
    confirmPassword: zod.string().min(1, "Confirm your password"),
  })
  .superRefine((data, ctx) => {
    if (data.owner.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export const registerPayloadSchema = zod.object({
  hotel: zod.object({
    name: zod.string().min(1, "Hotel name is required"),
    email: zod.string().email("Invalid hotel email address"),
    phone: zod.string().optional(),
    address: zod.string().optional(),
  }),
  owner: zod.object({
    fullName: zod.string().min(1, "Owner full name is required"),
    email: zod.string().email("Invalid owner email address"),
    phone: zod.string().optional(),
    password: zod
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/\d/, "Password must contain a number")
      .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
  }),
});

export type RegisterFormValues = zod.infer<typeof registerSchema>;
export type RegisterSchema = zod.infer<typeof registerPayloadSchema>;
export type LoginSchema = zod.infer<typeof loginSchema>;
