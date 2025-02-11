import Joi from "joi";
import { instructionTypeEnumArr } from "#models/instruction";

const instructionJoiSchema = Joi.object({
  instructionType: Joi.string()
    .valid(...instructionTypeEnumArr)
    .required(),
  shortDescription: Joi.string().required(),
  longDescription: Joi.string().required(),
});

export default instructionJoiSchema;
