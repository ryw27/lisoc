import { z } from "zod/v4";

// TODO: Better refinements
// Schemas TODO - add regex
// ------------------------------------------------------------------------------------------------
// Generic Schemas
// ------------------------------------------------------------------------------------------------
export const emailSchema = z.object({
    email: z
        .string()
//        .min(4, { message: "This field has to be filled"})
        .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, { message: "This is not a valid email" })
})

export const usernameSchema = z.object({
    username: z.
        string()
 //       .min(4, { message: "Username has to be filled"})
        .max(24, { message: "Username is too long"}),
})

export const passwordSchema = z.object({
    password: z
        .string()
        .min(4, { message: "Password must be filled" })
        // .min(6, { message: "Password must be at least 6 characters long" })
        .max(72, { message: "Password is too long" })
})

export const codeSchema = z.object({
    code: z
        .string()
        .length(6, { message: "Code must be 6 digits" })
})


export const uuidSchema = z.object({
    uuid: z.string().uuid()
})


// ------------------------------------------------------------------------------------------------
// Login Schemas
// ------------------------------------------------------------------------------------------------
export const userPassSchema = z.object({
    username: usernameSchema.shape.username,
    password: passwordSchema.shape.password
})


export const emailPassSchema = z.object({
    email: emailSchema.shape.email,
    password: passwordSchema.shape.password
})
export const loginSchema = z.object({
    emailUsername: emailSchema.shape.email /*.or(usernameSchema.shape.username)*/,
    password: passwordSchema.shape.password
})

export const adminloginSchema = z.object({
    emailUsername: emailSchema.shape.email .or (usernameSchema.shape.username),
    password: passwordSchema.shape.password
})


export const credSchema = z.object({
    email: emailSchema.shape.email.optional(),
    username: usernameSchema.shape.username.optional(),
    password: passwordSchema.shape.password
})

// ------------------------------------------------------------------------------------------------
// Register Schemas
// ------------------------------------------------------------------------------------------------

export const registerSchema = z.object({
    username: usernameSchema.shape.username,
    email: emailSchema.shape.email,
    password: passwordSchema.shape.password
})

export const nameEmailSchema = z.object({
    username: usernameSchema.shape.username,
    email: emailSchema.shape.email,
})

// TODO: edit
export const userSchema = z.object({
    address: z
        .string()
        .min(1, { message: "Address has to be filled" })
        .max(100, { message: "Address is too long" }),
    city: z
        .string()
        .min(1, { message: "City has to be filled"})
        .max(24, { message: "City is too long" }),
    state: z
        .string()
        .min(1, { message: "State has to be filled"})
        .max(24, { message: "State is too long" }),
    zip: z
        .string()
        .min(1, { message: "Zip code has to be filled"})
        .max(10, { message: "Zip code is too long" }),
    phone: z
        .string()
        .min(1, { message: "Phone number has to be filled"})
        .max(15, { message: "Phone number is too long" }),
})

export const familySchema = z
  .object({
    ...userSchema.shape,
    fatherfirsten: z
      .string()
      .max(72, { message: "Father's first name is too long" }),
    fatherlasten: z
      .string()
      .max(72, { message: "Father's last name is too long" }),
    fathernamecn: z
      .string()
      .max(36, { message: "Father's Chinese name is too long" }),
    motherlasten: z
      .string()
      .max(72, { message: "Mother's last name is too long" }),
    motherfirsten: z
      .string()
      .max(72, { message: "Mother's first name is too long" }),
    mothernamecn: z
      .string()
      .max(36, { message: "Mother's Chinese name is too long" }),
    address2: z
      .string()
      .max(100, { message: "Address is too long" })
      .optional(),
    phonealt: z
      .string()
      .max(15, { message: "Phone number is too long" })
      .optional(),
    emailalt: z
      .string()
      .optional()
      .refine(
        val =>
        !val || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val),
        { message: "This is not a valid email" }
      ),
  })
  .superRefine((data, ctx) => {
    // Helper: check if a name field is filled (not just whitespace)
    const isFilled = (val: string | undefined) => !!val && val.trim().length > 0;


    // Check if at least one parent is filled
    const fatherFilled =
      isFilled(data.fathernamecn) ||
      (isFilled(data.fatherfirsten) && isFilled(data.fatherlasten));
    const motherFilled =
      isFilled(data.mothernamecn) ||
      (isFilled(data.motherfirsten) && isFilled(data.motherlasten));
    //   console.log(fatherFilled, motherFilled);

    if (!fatherFilled && !motherFilled) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "At least one parent (mother or father) must have a name filled (Chinese or both English names).",
            path: ["mothernamecn"],
        });
    }

    // For each parent, if any field is filled, require at least one of the namecn or (firsten and lasten)
    if (isFilled(data.fathernamecn) || isFilled(data.fatherfirsten) || isFilled(data.fatherlasten)) {
        if (!isFilled(data.fathernamecn) && !(isFilled(data.fatherfirsten) && isFilled(data.fatherlasten))) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "For father, provide either the Chinese name or both first and last English names.",
                path: ["fathernamecn"],
            });
        }
    }

    if (isFilled(data.mothernamecn) || isFilled(data.motherfirsten) || isFilled(data.motherlasten)) {
        if (!isFilled(data.mothernamecn) && !(isFilled(data.motherfirsten) && isFilled(data.motherlasten))) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "For mother, provide either the Chinese name or both first and last English names.",
                path: ["mothernamecn"],
            });
        }
    }
  });


export const teacherSchema = z.object({
    ...userSchema.shape,
    namecn: z.
        string()
        .min(1, { message: "Name has to be filled"})
        .max(24, { message: "First name is too long" }),
    lastnameen: z.
        string()
        .min(1, { message: "Last name has to be filled"})
        .max(36, { message: "Last name is too long" }),
    firstnameen: z.
        string()
        .min(1, { message: "Last name has to be filled"})
        .max(36, { message: "Last name is too long" }),
    address2: z.
        string()
        .min(1, { message: "City has to be filled"})
        .max(24, { message: "City is too long" }),
    phonealt: z
        .string()
        .min(1, { message: "Phone number has to be filled"})
        .max(15, { message: "Phone number is too long" }),
    emailalt: emailSchema.shape.email
})




// ------------------------------------------------------------------------------------------------
// Forgot Password Schemas
// ------------------------------------------------------------------------------------------------

export const forgotPassSchema = z.object({
    emailUsername: emailSchema.shape.email.or(usernameSchema.shape.username)
})

export const resetPassSchema = z.object({
    email: emailSchema.shape.email,
    token: uuidSchema.shape.uuid,
    password: passwordSchema.shape.password,
    confirmPassword: passwordSchema.shape.password
})



// ------------------------------------------------------------------------------------------------
// Forgot Password Schemas
// ------------------------------------------------------------------------------------------------
export enum ErrorCode {
  IncorrectEmailPassword = "incorrect-email-password",
  UserNotFound = "user-not-found",
  IncorrectPassword = "incorrect-password",
  UserMissingPassword = "missing-password",
  IncorrectValidationCode = "incorrect-validation-code",
  TwoFactorDisabled = "two-factor-disabled",
  TwoFactorAlreadyEnabled = "two-factor-already-enabled",
  TwoFactorSetupRequired = "two-factor-setup-required",
  SecondFactorRequired = "second-factor-required",
  IncorrectTwoFactorCode = "incorrect-two-factor-code",
  IncorrectBackupCode = "incorrect-backup-code",
  MissingBackupCodes = "missing-backup-codes",
  IncorrectEmailVerificationCode = "incorrect_email_verification_code",
  InternalServerError = "internal-server-error",
  NewPasswordMatchesOld = "new-password-matches-old",
  ThirdPartyIdentityProviderEnabled = "third-party-identity-provider-enabled",
  RateLimitExceeded = "rate-limit-exceeded",
  SocialIdentityProviderRequired = "social-identity-provider-required",
  UserAccountLocked = "user-account-locked",
}