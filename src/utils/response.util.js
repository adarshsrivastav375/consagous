import { session } from "#middlewares/session";

export const sendResponse = async (statusCode, res, data, message) => {
  const success = statusCode >= 400 ? false : true;

  //TODO: Transaction has to be implemented here
  /**const transactionSession = session.get("transaction");
  if (transactionSession) {
    status
      ? await transactionSession.commitTransaction()
      : await transactionSession.abortTransaction;
  }*/

  //const pagination = {
  //  currentPage: pageNumber,
  //  totalItems: totalResuts,
  //  itemsPerPage: limitNumber,
  //  totalPages: Math.ceil(totalResuts / limitNumber),
  //};

  res
    .status(statusCode)
    .json({ success, ...(message ? { message } : null), data });
};
