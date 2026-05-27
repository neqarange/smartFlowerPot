import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  name: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const addDeviceSchema = z.object({
  name: z.string().min(1, "Device name is required"),
  pairingCode: z.string().min(1, "Pairing code is required").transform(v => v.trim().toUpperCase()),
});

const rangeSchema = (label: string) =>
  z
    .object({
      warnMin: z.coerce.number().finite(),
      okMin: z.coerce.number().finite(),
      okMax: z.coerce.number().finite(),
      warnMax: z.coerce.number().finite(),
    })
    .refine((v) => v.okMin <= v.okMax, { message: `${label}: ok min must be ≤ ok max`, path: ["okMax"] })
    .refine((v) => v.warnMin <= v.okMin, { message: `${label}: warn min must be ≤ ok min`, path: ["warnMin"] })
    .refine((v) => v.warnMax >= v.okMax, { message: `${label}: warn max must be ≥ ok max`, path: ["warnMax"] });

export const profileFormSchema = z.object({
  flowerName: z.string().trim().min(1, "Flower name is required"),
  public: z.boolean(),
  temp: rangeSchema("Temperature"),
  humidity: rangeSchema("Humidity"),
  light: rangeSchema("Light"),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type AddDeviceValues = z.infer<typeof addDeviceSchema>;
export type ProfileFormInput = z.input<typeof profileFormSchema>;
export type ProfileFormValues = z.output<typeof profileFormSchema>;
