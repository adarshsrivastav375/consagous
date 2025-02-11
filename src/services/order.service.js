import Order from "#models/order";
import Service from "#services/base";
import httpStatus from "#utils/httpStatus";
import mongoose from "mongoose";

class OrderService extends Service {
  static Model = Order;
  static async create(cartId) {
    const cartDetails = await CartService.getDocById(cartId);
    if (cartDetails.totalAmount <= 0) {
      throw {
        status: false,
        message: "Total amount should be greater than 0",
        httpStatus: httpStatus.BAD_REQUEST,
      };
    }
    const order = new Order({
      user: cartDetails.user,
      courses: cartDetails.courses,
      totalAmount: cartDetails.totalAmount,
    });
    await order.save();
    //  await CartService.emptyCart(cartDetails.user);
    return order;
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
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courseDetails",
          pipeline: [{ $project: { name: 1, description: 1 } }],
        },
      },
    ];
    if (id) {
      let order = await this.Model.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(id) },
        },
        ...initialStage,
        {
          $project: {
            _id: 1,
            userName: { $ifNull: ["$user.name", null] },
            userEmail: { $ifNull: ["$user.email", null] },
            userId: { $ifNull: ["$user._id", null] },
            totalAmount: 1,
            status: 1,
            paymentStatus: 1,
            transactionId: 1,
            createdAt: 1,
            paymentDetails: 1,
            updatedAt: 1,
            courses: "$courseDetails",
          },
        },
      ]);
      order = order[0];
      return order;
    }
    const extraStage = [
      {
        $project: {
          _id: 1,
          userName: { $ifNull: ["$user.name", null] },
          userEmail: { $ifNull: ["$user.email", null] },
          userId: { $ifNull: ["$user._id", null] },
          totalAmount: 1,
          status: 1,
          paymentStatus: 1,
          transactionId: 1,
          createdAt: 1,
          updatedAt: 1,
          courses: "$courseDetails",
        },
      },
    ];

    return this.Model.findAll(filter, initialStage, extraStage);
  }

  static async deleteDoc(id) {
    const deletedDoc = await Order.findDocById(id);
    await deletedDoc.deleteOne();

    return {
      status: true,
      message: "Order deleted successfully",
      httpStatus: httpStatus.OK,
    };
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
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courseDetails",
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
          courses: "$courseDetails",
        },
      },
    ]);
    return orders;
  }
}
export default OrderService;
