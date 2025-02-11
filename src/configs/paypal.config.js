import got from "got";
import httpStatus from "#utils/httpStatus";
import env from "#configs/env";
import { json } from "envalid";

export const getPayPalAccessToken = async () => {
  const auth = Buffer.from(
    `${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");
  try {
    const response = await got.post(
      `${env.PAYPAL_API_BASE_URL}/v1/oauth2/token`,
      {
        form: {
          grant_type: "client_credentials",
        },
        username: env.PAYPAL_CLIENT_ID,
        password: env.PAYPAL_CLIENT_SECRET,
      }
    );
    const responseData = JSON.parse(response.body);
    return responseData.access_token;

  } catch (error) {
    throw {
      status: false,
      httpStatus: httpStatus.INTERNAL_SERVER_ERROR,
      message: error.response?.body || error.message,
    };
  }
};
