import Joi from "joi";

export const productValidation = Joi.object({
  name: Joi.string().trim().required(),
  price: Joi.number().min(0).required(),
  status: Joi.string()
    .valid("available", "unavailable", "out of stock")
    .default("available"),
  image: Joi.string().trim().optional(),
  category: Joi.string().trim().required(),
  isActive: Joi.boolean().default(true),
});
