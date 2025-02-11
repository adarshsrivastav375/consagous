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
  static async revenueAnalyticsMonth() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get the last day of the current month
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const pipeline = [
      {
        $facet: {
          currentMonthAmount: [
            {
              $match: {
                createdAt: { $gte: currentMonthStart },
                status: "completed",
              },
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
            { $project: { _id: 0, total: 1 } },
          ],
          lastMonthAmount: [
            {
              $match: {
                createdAt: {
                  $gte: lastMonthStart,
                  $lt: lastMonthEnd,
                },
                status: "completed",
              },
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
            { $project: { _id: 0, total: 1 } },
          ],
          totalAmount: [
            {
              $match: {
                status: "completed",
              },
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
            { $project: { _id: 0, total: 1 } },
          ],
          dailyBreakdown: [
            {
              $match: {
                createdAt: { $gte: currentMonthStart },
                status: "completed",
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt",
                  },
                },
                dailyTotal: { $sum: "$totalAmount" },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
      {
        $project: {
          currentMonthAmount: {
            $ifNull: [{ $arrayElemAt: ["$currentMonthAmount.total", 0] }, 0],
          },
          lastMonthAmount: {
            $ifNull: [{ $arrayElemAt: ["$lastMonthAmount.total", 0] }, 0],
          },
          totalAmount: {
            $ifNull: [{ $arrayElemAt: ["$totalAmount.total", 0] }, 0],
          },
          dailyBreakdown: "$dailyBreakdown",
        },
      },
    ];

    const [data] = await this.Model.aggregate(pipeline);
    // Generate full month daily breakdown
    const dailyBreakdownMap = new Map(
      data.dailyBreakdown.map((item) => [item._id, item.dailyTotal])
    );
    const fullMonthDailyBreakdown = Array.from(
      { length: lastDayOfMonth.getDate() },
      (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth(), index + 1);
        const formattedDate = date.toISOString().split("T")[0];
        return dailyBreakdownMap.get(formattedDate) || 0;
      }
    );
    return {
      currentMonthAmount: data.currentMonthAmount,
      lastMonthAmount: data.lastMonthAmount,
      totalAmount: data.totalAmount,
      dailyBreakdown: fullMonthDailyBreakdown,
    };
  }
  static async revenueAnalyticsYear() {
    const now = new Date();
    const currentYearStart = new Date(now.getFullYear(), 0, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear(), 0, 1);

    const pipeline = [
      {
        $facet: {
          currentYearAmount: [
            {
              $match: {
                createdAt: { $gte: currentYearStart },
                status: "completed",
              },
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ],
          lastYearAmount: [
            {
              $match: {
                createdAt: {
                  $gte: lastYearStart,
                  $lt: lastYearEnd,
                },
                status: "completed",
              },
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ],
          totalAmount: [
            {
              $match: { status: "completed" },
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ],
          monthlyBreakdown: [
            {
              $match: {
                createdAt: { $gte: currentYearStart },
                status: "completed",
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%m",
                    date: "$createdAt",
                  },
                },
                total: { $sum: "$totalAmount" },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ];

    const [data] = await this.Model.aggregate(pipeline);

    const monthlyBreakdownMap = new Map(
      data.monthlyBreakdown.map((item) => [item._id, item.total])
    );

    const fullMonthlyBreakdown = Array.from({ length: 12 }, (_, index) => {
      const monthKey = String(index + 1).padStart(2, "0");
      return monthlyBreakdownMap.get(monthKey) || 0;
    });

    return {
      currentYearAmount: data.currentYearAmount[0]?.total || 0,
      lastYearAmount: data.lastYearAmount[0]?.total || 0,
      totalAmount: data.totalAmount[0]?.total || 0,
      monthlyBreakdown: fullMonthlyBreakdown,
    };
  }

  static async revenueGraph() {
    const now = new Date();
    const currentYearStart = new Date(now.getFullYear(), 0, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear(), 0, 1);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const pipeline = [
      {
        $facet: {
          currentYearMonthly: [
            {
              $match: {
                createdAt: { $gte: currentYearStart },
                status: "completed",
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%m",
                    date: "$createdAt",
                  },
                },
                thisYear: { $sum: "$totalAmount" },
              },
            },
            { $sort: { _id: 1 } },
          ],
          lastYearMonthly: [
            {
              $match: {
                createdAt: {
                  $gte: lastYearStart,
                  $lt: lastYearEnd,
                },
                status: "completed",
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%m",
                    date: "$createdAt",
                  },
                },
                lastYear: { $sum: "$totalAmount" },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ];

    const [data] = await this.Model.aggregate(pipeline);

    const currentYearMap = new Map(
      data.currentYearMonthly.map((item) => [item._id, item.thisYear])
    );

    const lastYearMap = new Map(
      data.lastYearMonthly.map((item) => [item._id, item.lastYear])
    );

    const revenueData = monthNames.map((month, index) => {
      const monthKey = String(index + 1).padStart(2, "0");
      return {
        month,
        thisYear: currentYearMap.get(monthKey) || 0,
        lastYear: lastYearMap.get(monthKey) || 0,
      };
    });
    // Truncate to October as per the example
    return revenueData;
  }
  static async find(number) {
    const orders = await this.Model.aggregate([
      // {
      //   $match: {
      //     paymentStatus: "COMPLETED",
      //   },
      // },
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
        $lookup: {
          from: "products",
          localField: "products",
          foreignField: "_id",
          as: "productDetails",
          pipeline: [{ $project: { name: 1, description: 1 } }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $limit: number,
      },
      {
        $project: {
          _id: 1,
          userName: { $ifNull: ["$user.name", null] },
          userEmail: { $ifNull: ["$user.email", null] },
          userId: { $ifNull: ["$user._id", null] },
          totalAmount: 1,
          status: 1,
          paymentStatus: 1,
          createdAt: 1,
          paymentDetails: 1,
          updatedAt: 1,
          products: "$productDetails",
        },
      },
    ]);
    return orders;
  }
}
export default OrderService;
