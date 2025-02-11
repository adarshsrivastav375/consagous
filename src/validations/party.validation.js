import Joi from "joi";
import { ledgerEnumArr } from "#models/party";

const companyJoiSchema = Joi.object({
  companyName: Joi.string().required(),
  contactPerson: Joi.string().required(),
  ledgerType: Joi.string()
    .valid(...ledgerEnumArr)
    .required(),
  groupBy: Joi.string().pattern(/^[0-9a-fA-F]{24}$/), // MongoDB ObjectId format

  companyInformation: Joi.object({
    billingAddress1: Joi.string().allow(null, ""),
    billingAddress2: Joi.string().allow(null, ""),
    pinCode: Joi.string().allow(null, ""),
    country: Joi.string().required().default("India"),
    state: Joi.string().allow(null, ""),
    jobWork: Joi.string().allow(null, ""),
    gstNo: Joi.string().allow(null, ""),
    panNo: Joi.string().allow(null, ""),
    yobAmount: Joi.number().allow(null),
    cbAmount: Joi.number().allow(null),
    eYobAmount: Joi.number().allow(null),
    eCbAmount: Joi.number().allow(null),
    creditDays: Joi.number().allow(null),
    creditLimit: Joi.number().allow(null),
  }),

  contactDetails: Joi.object({
    mobile: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .allow(null, ""),
    email: Joi.string().email().allow(null, ""),
    addtionalMobileNumbers: Joi.array().items(
      Joi.string().pattern(/^[0-9]{10}$/),
    ),
    additionalEmails: Joi.array().items(Joi.string().email()),
    transport: Joi.string().allow(null, ""),
    privateMark: Joi.string().allow(null, ""),
    factor: Joi.string().allow(null, ""),
    debit: Joi.string().allow(null, ""),
    websiteUrl: Joi.string().uri().allow(null, ""),
  }),
  bankDetails: Joi.object({
    accountNo: Joi.string().allow(null, ""),
    bankName: Joi.string().allow(null, ""),
    branchAddress: Joi.string().allow(null, ""),
    ifscCode: Joi.string()
      .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
      .allow(null, ""), // Typical IFSC code format
    swiftCode: Joi.string().allow(null, ""),
  }),
});


export default companyJoiSchema;
