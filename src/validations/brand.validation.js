import Joi from "joi";

const brandSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.base": "Name should be a type of text.",
    "any.required": "Name is a required field.",
    "string.empty": "Name cannot be empty.",
  }),
  description: Joi.string().required().messages({
    "string.base": "Description should be a type of text.",
    "any.required": "Description is a required field.",
    "string.empty": "Description cannot be empty.",
  }),
});

export default brandSchema;
