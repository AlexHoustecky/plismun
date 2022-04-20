import { z } from "zod"
import validator from "validator"
import { Committee, CommitteeCountries } from "@prisma/client"

export const DietaryOptions = z.enum([
  "None",
  "Vegetarian",
  "Vegan",
  "Other (please specify below)",
])

export const SignupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirm: z.string(),

    firstname: z.string().min(1, "Please enter first name"),
    lastname: z.string().min(1, "Please enter last name"),

    phone: z
      .string()
      .nullable()
      // validate if it is a mobile phone number if present
      .refine(
        (phone) => (phone ? validator.isMobilePhone(phone) : true),
        "Invalid phone number"
      )
      .transform((phone) => phone || null),
    birthdate: z.union([
      z
        .string()
        .default(() => new Date().toISOString())
        .transform((x) => new Date(x)),
      z.date(),
    ]),
    nationality: z.string().refine((nat) => validator.isISO31661Alpha2(nat)),
    schoolname: z.string().nullable(),
    dietary: DietaryOptions.nullable(),
    otherInfo: z.string().max(400).nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: "custom",
        path: ["passwordConfirm"],
        message: "Passwords do not match",
      })
    }
    return ctx
  })
export type SignupSchemaType = z.infer<typeof SignupSchema>

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const DelegateApply = z.object({
  userId: z.number(),

  motivation: z
    .string()
    .max(4000, "Your motivation is too long")
    .min(10, "Please enter a short motivation"),
  experience: z
    .string()
    .max(4000, "Your experience is too long")
    .min(10, "Please enter a short experience"),

  // ID of delegation
  // -1 is taken as no delegation
  delegationId: z.preprocess(
    (val) => (val === -1 ? null : val),
    z.number().nullable()
  ),

  // choices
  choice1committee: z
    .number({ invalid_type_error: "Please choose a committee" })
    .min(0, "Please choose a committee"),
  choice1country: z.string().min(2, "Please choose a country"),
  choice2committee: z
    .number({ invalid_type_error: "Please choose a committee" })
    .min(0, "Please choose a committee"),
  choice2country: z.string().min(2, "Please choose a country"),
  choice3committee: z
    .number({ invalid_type_error: "Please choose a committee" })
    .min(0, "Please choose a committee"),
  choice3country: z.string().min(2, "Please choose a country"),

  // shirt size or null if no shirt desired
  shirtSize: z.enum(["XS", "S", "M", "L", "XL", "XXL"]).nullable(),
})
export type DelegateApply = z.infer<typeof DelegateApply>
// we have this extra function for delegate applications so we can get the committees and committee countries from the database or from nextjs,
// depending on where the function is ran
export const refineDelegateApply = (
  params:
    | (() => Promise<{
        committees: Committee[]
        committeeCountries: CommitteeCountries[]
      }>)
    | {
        committees: Committee[]
        committeeCountries: CommitteeCountries[]
      }
) => {
  return async (body: DelegateApply, ctx: z.RefinementCtx) => {
    const { committees, committeeCountries } =
      typeof params === "function" ? await params() : params
    const committee1valid = committees.find(
      (c) => c.id === body.choice1committee
    )
    if (!committee1valid) {
      ctx.addIssue({
        code: "invalid_enum_value",
        options: committees.map((c) => c.id),
        path: ["choice1committee"],
        message: "The committee with the given ID was not found",
      })
    }
    const committee2valid = committees.find(
      (c) => c.id === body.choice2committee
    )
    if (!committee2valid) {
      ctx.addIssue({
        code: "invalid_enum_value",
        options: committees.map((c) => c.id),
        path: ["choice2committee"],
        message: "The committee with the given ID was not found",
      })
    }
    const committee3valid = committees.find(
      (c) => c.id === body.choice3committee
    )
    if (!committee3valid) {
      ctx.addIssue({
        code: "invalid_enum_value",
        options: committees.map((c) => c.id),
        path: ["choice3committee"],
        message: "The committee with the given ID was not found",
      })
    }

    // check if each choice's country is valid in it's committee
    const choice1valid = committeeCountries.find(
      (c) =>
        c.committeeId === body.choice1committee &&
        c.country === body.choice1country
    )
    if (!choice1valid && committee1valid)
      ctx.addIssue({
        code: "invalid_enum_value",
        path: ["choice1country"],
        message: "Invalid country and committee combination",
        options: committeeCountries
          .filter((c) => c.committeeId === body.choice1committee)
          .map((c) => c.country),
      })

    const choice2valid = committeeCountries.find(
      (c) =>
        c.committeeId === body.choice2committee &&
        c.country === body.choice2country
    )
    if (!choice2valid && committee2valid)
      ctx.addIssue({
        code: "invalid_enum_value",
        path: ["choice2country"],
        message: "Invalid country and committee combination",
        options: committeeCountries
          .filter((c) => c.committeeId === body.choice2committee)
          .map((c) => c.country),
      })

    const choice3valid = committeeCountries.find(
      (c) =>
        c.committeeId === body.choice3committee &&
        c.country === body.choice3country
    )
    if (!choice3valid && committee3valid)
      ctx.addIssue({
        code: "invalid_enum_value",
        path: ["choice3country"],
        message: "Invalid country and committee combination",
        options: committeeCountries
          .filter((c) => c.committeeId === body.choice3committee)
          .map((c) => c.country),
      })
  }
}

export const ChairApply = z.object({
  userId: z.number(),

  motivation: z
    .string()
    .max(4000, "Your motivation is too long")
    .min(10, "Please enter a short motivation"),
  experience: z
    .string()
    .max(4000, "Your experience is too long")
    .min(10, "Please enter a short experience"),

  // ID of delegation
  // -1 is taken as no delegation
  delegationId: z.preprocess(
    (val) => (val === -1 ? null : val),
    z.number().nullable()
  ),

  // choices
  choice1committee: z
    .number({ invalid_type_error: "Please choose a committee" })
    .min(0, "Please choose a committee"),
  choice2committee: z
    .number({ invalid_type_error: "Please choose a committee" })
    .min(0, "Please choose a committee"),
  choice3committee: z
    .number({ invalid_type_error: "Please choose a committee" })
    .min(0, "Please choose a committee"),

  // shirt size or null if no shirt desired
  shirtSize: z.enum(["XS", "S", "M", "L", "XL", "XXL"]).nullable(),
})
export type ChairApply = z.infer<typeof ChairApply>

// we have this extra function for chair applications so we can get the committees and committee countries from the database or from nextjs,
// depending on where the function is ran
export const refineChairApply = (
  params:
    | (() => Promise<{
        committees: Committee[]
      }>)
    | {
        committees: Committee[]
      }
) => {
  return async (body: ChairApply, ctx: z.RefinementCtx) => {
    const { committees } =
      typeof params === "function" ? await params() : params

    const committee1valid = committees.find(
      (c) => c.id === body.choice1committee
    )
    if (!committee1valid) {
      ctx.addIssue({
        code: "invalid_enum_value",
        options: committees.map((c) => c.id),
        path: ["choice1committee"],
        message: "The committee with the given ID was not found",
      })
    }
    const committee2valid = committees.find(
      (c) => c.id === body.choice2committee
    )
    if (!committee2valid) {
      ctx.addIssue({
        code: "invalid_enum_value",
        options: committees.map((c) => c.id),
        path: ["choice2committee"],
        message: "The committee with the given ID was not found",
      })
    }
    const committee3valid = committees.find(
      (c) => c.id === body.choice3committee
    )
    if (!committee3valid) {
      ctx.addIssue({
        code: "invalid_enum_value",
        options: committees.map((c) => c.id),
        path: ["choice3committee"],
        message: "The committee with the given ID was not found",
      })
    }
  }
}

export const DelegationApply = z.object({
  delegationLeaderId: z.number(),
  name: z
    .string()
    .max(100, "Your name is too long")
    .min(10, "Please input a name"),
  country: z
    .string()
    .length(2, "Please enter a valid country code")
    .refine(
      (val) => validator.isISO31661Alpha2(val),
      "You must pick a valid country"
    ),
  estimatedDelegates: z.number().min(1, "Please enter a valid number"),
  delegates: z.number().nullable(),
})
export type DelegationApply = z.infer<typeof DelegationApply>