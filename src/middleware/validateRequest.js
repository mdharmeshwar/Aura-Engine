import { parseValidationFailure } from '../schemas/productSchema.js';

export function validateRequest(schema, property = 'body') {
  return (req, res, next) => {
    const target = req[property];
    const result = schema.safeParse(target);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: parseValidationFailure(result.error),
      });
    }

    req.validated = result.data;
    next();
  };
}
