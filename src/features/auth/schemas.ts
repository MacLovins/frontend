import { z } from "zod"

import { normalizeMdPhone } from "@/lib/phone"

const email = z
  .string()
  .trim()
  .min(1, "required")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "email")

const password = z
  .string()
  .min(8, "password_rules")
  .regex(/[A-Za-z]/, "password_rules")
  .regex(/\d/, "password_rules")

const personName = z
  .string()
  .trim()
  .min(1, "required")
  .max(80, "name_length")
  .regex(/^[\p{L}][\p{L}\s'’-]*$/u, "name")

export const loginSchema = z.object({
  email,
  password,
  remember_me: z.boolean(),
})

export const registerSchema = z
  .object({
    email,
    password,
    confirmPassword: z.string().min(1, "required"),
    name: personName,
    surname: personName,
    phone: z
      .string()
      .trim()
      .min(1, "required")
      .refine((value) => normalizeMdPhone(value) !== null, "phone"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "password_mismatch",
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
