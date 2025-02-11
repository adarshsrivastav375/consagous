import got from "got";
import { getPayPalAccessToken } from "#configs/paypal";
import env from "#configs/env";
import OrderService from "#services/order";

const PAYPAL_API_BASE_URL =
  env.PAYPAL_API_BASE_URL || "https://api-m.sandbox.paypal.com";

export default class PayPalService {
  /**
   * Create PayPal Order
   * @param {Object} orderData - Order payload
   * @returns {Promise<Object>}
   */
  async createOrder(data) {
    const accessToken = await getPayPalAccessToken();
    const orderDetails = await OrderService.getDocById(data._id);
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: orderDetails.totalAmount,
          },
          orderDetails,
        },
      ],
      application_context: {
        return_url: `${process.env.BASE_URL}/api/payment/complete`,
        cancel_url: `${process.env.BASE_URL}/api/payment/cancel`,
      },
    };

    try {
      const response = await got.post(
        `${PAYPAL_API_BASE_URL}/v2/checkout/orders`,
        {
          json: orderData,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          responseType: "json",
        }
      );
      orderDetails.transactionId = response.body?.id;

      const updatedOrder = (await orderDetails.save()).toJSON();

      const checkoutData = {
        ...updatedOrder,
        approvalUrl: response.body.links.find((link) => link.rel === "approve")
          .href,
      };
      return checkoutData;
    } catch (error) {
      throw {
        status: false,
        httpStatus: httpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to create PayPal order: ${
          error.response?.body || error.message
        }`,
      };
    }
  }

  /**
   * Capture PayPal Order
   * @param {string} orderId - PayPal Order ID
   * @returns {Promise<Object>}
   */
  async captureOrder(orderId) {
    const accessToken = await getPayPalAccessToken();

    try {
      const response = await got.post(
        `${PAYPAL_API_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          responseType: "json",
        }
      );
      return response.body;
    } catch (error) {
      throw {
        status: false,
        httpStatus: httpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to capture payment: ${
          error.response?.body || error.message
        }`,
      };
    }
  }
}
