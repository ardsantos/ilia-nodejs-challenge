import Joi from "joi";

export const updateUserSchema = Joi.object({
  first_name: Joi.string().min(1).max(100).messages({
    "string.empty": "First name cannot be empty",
    "string.min": "First name must be at least 1 character",
    "string.max": "First name must be at most 100 characters",
  }),
  last_name: Joi.string().min(1).max(100).messages({
    "string.empty": "Last name cannot be empty",
    "string.min": "Last name must be at least 1 character",
    "string.max": "Last name must be at most 100 characters",
  }),
  email: Joi.string().email().messages({
    "string.email": "Email must be a valid email address",
  }),
  password: Joi.string().min(8).max(128).messages({
    "string.min": "Password must be at least 8 characters",
    "string.max": "Password must be at most 128 characters",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

export const userIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "ID must be a valid UUID",
    "any.required": "ID is required",
  }),
});
