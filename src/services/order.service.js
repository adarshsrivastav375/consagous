import Order from "#models/order";
import Service from "#services/base";
import httpStatus from "#utils/httpStatus";
import mongoose from "mongoose";
import CartService from "#services/cart";
import { subDays, startOfDay, startOfMonth, endOfMonth } from "date-fns";

class OrderService extends Service {
  static Model = Order;
  static async create(user) {
    const cartDetails = await CartService.getDoc({ user: user._id });
    if (cartDetails.totalAmount <= 0) {
      throw {
        status: false,
        message: "Total amount should be greater than 0",
        httpStatus: httpStatus.BAD_REQUEST,
      };
    }
    const order = new Order({
      user: cartDetails.user,
      products: cartDetails.products,
      totalAmount: cartDetails.totalAmount,
      transactionId: "", // Default empty string as per schema
      status: "completed",
      paymentStatus: "completed",
    });
    await order.save();
    await CartService.emptyCart(user._id);
    return order;
  }
  static async getUserOrders(userId, filter) {
    const initialStage = [
      {
        $match: { user: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1 } }],
          as: "user",
        },
      },
      {
        $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $group: {
          _id: "$_id",
          user: { $first: "$user" },
          totalAmount: { $first: "$totalAmount" },
          status: { $first: "$status" },
          paymentStatus: { $first: "$paymentStatus" },
          transactionId: { $first: "$transactionId" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          products: { $push: "$productDetails" },
        },
      },
    ];
    return this.Model.findAll(filter, initialStage);
  }
  static async orderswithMonthlySummary(userId, filter) {
    const initialStage = [
      {
        $match: { user: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1 } }],
          as: "user",
        },
      },
      {
        $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $group: {
          _id: "$_id",
          user: { $first: "$user" },
          totalAmount: { $first: "$totalAmount" },
          status: { $first: "$status" },
          paymentStatus: { $first: "$paymentStatus" },
          transactionId: { $first: "$transactionId" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          products: { $push: "$productDetails" },
        },
      },
    ];
    const orders = await this.Model.findAll(filter, initialStage);
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    // monthly summary
    const monthlySummary = await this.Model.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
          status: "completed",
        },
      },
      {
        $group: {
          _id: "$_id", // Group by order ID to count each order only once
          totalAmount: { $first: "$totalAmount" }, // Preserve totalAmount per order
          totalProductsInOrder: { $sum: { $size: "$products" } }, // Count products in each order
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmountSpent: { $sum: "$totalAmount" },
          totalProductsPurchased: { $sum: "$totalProductsInOrder" },
        },
      },
      {
        $project: { _id: 0 }, // Remove _id from final output
      },
    ]);
    return {
      orderList: orders.result,
      pagination: orders.pagination,
      monthlySummary:
        monthlySummary.length > 0
          ? monthlySummary[0]
          : {
              totalOrders: 0,
              totalAmountSpent: 0,
              totalProductsPurchased: 0,
            },
    };
  }
  static async get(id, filter) {
    const initialStage = [
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $group: {
          _id: "$_id",
          user: { $first: "$user" },
          totalAmount: { $first: "$totalAmount" },
          status: { $first: "$status" },
          paymentStatus: { $first: "$paymentStatus" },
          transactionId: { $first: "$transactionId" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          products: { $push: "$productDetails" },
        },
      },
    ];

    if (id) {
      let order = await this.Model.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        ...initialStage,
      ]);
      return order[0] || null;
    }
    return this.Model.findAll(filter, initialStage);
  }
  static async getTotalSales({ category, sortBy = "salesVolume" }) {
    const matchCategory = category
      ? { "productDetails.category": category }
      : {};
    const salesData = await Order.aggregate([
      { $match: { status: "completed" } }, // Only count completed orders
      { $unwind: "$products" }, // Separate products from the order
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" }, // Convert lookup array to object

      { $match: matchCategory }, // Filter by category if provided
      {
        $group: {
          _id: "$products.product",
          productName: { $first: "$productDetails.name" },
          category: { $first: "$productDetails.category" },
          totalQuantitySold: { $sum: "$products.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: ["$productDetails.price", "$products.quantity"],
            },
          },
        },
      },
      {
        $sort:
          sortBy === "salesVolume"
            ? { totalQuantitySold: -1 }
            : { totalRevenue: -1 },
      },

      {
        $project: {
          _id: 0,
          productId: "$_id",
          productName: 1,
          category: 1,
          totalQuantitySold: 1,
          totalRevenue: 1,
        },
      },
    ]);

    return salesData;
  }
  static async deleteDoc(id) {
    const deletedDoc = await this.Model.findById(id);
    if (!deletedDoc) {
      throw {
        status: false,
        message: "Order not found",
        httpStatus: httpStatus.NOT_FOUND,
      };
    }
    await deletedDoc.deleteOne();
    return {
      status: true,
      message: "Order deleted successfully",
      httpStatus: httpStatus.OK,
    };
  }
  static async getBestSellingProducts(filter) {
    const sevenDaysAgo = startOfDay(subDays(new Date(), 7));
    const initialStage = [
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }, // Orders from last 7 days
          status: "completed", // Only completed orders
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          totalSold: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
    ];
    const extraStage = [
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: "$productDetails.name",
          price: "$productDetails.price",
          totalSold: 1,
        },
      },
    ];
    const bestSellingProducts = await this.Model.findAll(
      filter,
      initialStage,
      extraStage
    );

    return bestSellingProducts;
  }
}
export default OrderService;
