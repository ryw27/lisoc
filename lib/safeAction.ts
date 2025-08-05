import { z } from "zod";

export type ActionResult<S extends z.ZodType, R = void> =
  | { ok: true, data?: R}
  | {
      ok: false;
      fieldErrors?: { [K in keyof z.infer<S>]?: string }
      errorMessage?: string;          
    };

export function safeAction<S extends z.ZodType, R = void>(
    schema: S,
    fn: (data: z.infer<S>) => Promise<R>
) {
    return async (data: z.infer<S>): Promise<ActionResult<S>> => {
        const parsedData = schema.safeParse(data);
        if (!parsedData.success) {
            const flatErrors = z.flattenError(parsedData.error);
            return {
                ok: false,
                errorMessage: flatErrors.formErrors[0],
                fieldErrors: Object.fromEntries(
                    Object.entries(flatErrors.fieldErrors).map(([k, arr]) => [
                        k,
                        Array.isArray(arr) ? arr[0] ?? undefined : undefined
                    ])
                ) as { [K in keyof z.infer<S>]?: string }
            }
        }

        try {
            await fn(parsedData.data);
            return { ok: true }
        } catch (error) {
            if (error instanceof Error) {
                return { ok: false, errorMessage: error.message }
            }

            console.error(error);
            return { ok: false, errorMessage: "Something went wrong. Please try again." }
        }
    }
}