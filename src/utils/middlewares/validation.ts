import { NextApiRequest, NextApiResponse } from "next"
import { NextHandler } from "next-connect"
import { SafeParseError, z } from "zod"

/**
 * Validate a user's request with zod
 */
export function validate({
  body,
  query,
}: {
  body?: z.ZodTypeAny
  query?: z.ZodTypeAny
}) {
  // we have the schemas given as the parameter to this function
  // the function that we return is executed on each request by next-connect
  return (req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
    const errors: z.ZodError[] = []
    if (body) {
      const parsed = body.safeParse(req.body)
      if (parsed.success === false) {
        errors.push(parsed.error)
      }
    }
    if (query) {
      const parsed = query.safeParse(req.query)
      if (parsed.success === false) {
        errors.push(parsed.error)
      }
    }
    if (errors.length) {
      // if there are errors, return a 422
      return res.status(422).json({
        statusCode: 422,
        message: "Bad Request",
        description: errors,
      })
    }
    // there were no errors validating, so we can continue with the request
    next()
  }
}
