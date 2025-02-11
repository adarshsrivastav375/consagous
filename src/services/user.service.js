import env from "#configs/env";
import User from "#models/user";
import Service from "#services/base";
import httpStatus from "#utils/httpStatus";
import { session } from "#middlewares/session";
import { createAccessOrRefreshToken } from "#utils/jwt";
import { generatePassword } from "#utils/helper";
import RoleService from "#services/role";
import OrderService from "#services/order";

class UserService extends Service {
  static Model = User;

  static async get(id, filter) {
    if (id) {
      let user = await this.Model.findDocById(id);
      user.role = user.role.id;
      user = user.toJSON();
      user = { ...user, ...user?.address, _id: id };
      delete user.address;
      return user;
    }
    const initialStage = [
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "role",
        },
      },
    ];
    //id,name,email,mobileNo,role,createdAt,status
    const extraStage = [
      {
        $project: {
          name: 1,
          email: 1,
          mobileNo: 1,
          createdAt: 1,
          status: 1,
          role: { $arrayElemAt: ["$role.name", 0] },
        },
      },
    ];
    return this.Model.findAll(filter, initialStage, extraStage);
  }

  static async getUserByRole(filter, role = "user") {
    const initialStage = [
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "role",
        },
      },
      {
        $unwind: "$role",
      },
      {
        $match: {
          "role.name": role,
        },
      },
    ];

    const extraStage = [
      {
        $project: {
          role: 0,
          password: 0,
          refreshToken: 0,
        },
      },
    ];
    return this.Model.findAll(filter, initialStage, extraStage);
  }
  static async getAdmins(filter) {
    const initialStage = [
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "role",
        },
      },
      {
        $unwind: "$role",
      },
      {
        $match: {
          "role.name": { $ne: "user" },
        },
      },
      { $set: { role: "$role.name" } },
    ];

    const extraStage = [
      {
        $project: {
          status: 0,
          password: 0,
          refreshToken: 0,
        },
      },
    ];
    const data = this.Model.findAll(filter, initialStage, extraStage);
    return data;
  }

  static async loginUser(userData) {
    const { email, password } = userData;

    let existingUser = await this.Model.findDoc({ email });

    if (!(await existingUser.isPasswordCorrect(password))) {
      throw {
        status: false,
        message: "Incorrect Password",
        httpStatus: httpStatus.UNAUTHORIZED,
      };
    }

    await existingUser.populate({
      path: "role",
      select: "name permissions",
    });

    const selectedFields = [
      "name",
      "dob",
      "mobile",
      "email",
      "role",
      "profilePic",
      "mobileNo",
    ];
    const { accessToken, refreshToken } = await createAccessOrRefreshToken(
      existingUser._id
    );
    const user = {};
    selectedFields.forEach((key) => {
      user[key] = existingUser[key];
    });

    user.permissions = user.role.permissions;
    user.role = user.role.name;
    return { accessToken, refreshToken, userData: user };
  }
  static async loginAdmin(userData) {
    const { email, password } = userData;

    let existingUser = await this.Model.findDoc({ email });
    await existingUser.populate({
      path: "role",
      select: "name permissions",
    });
    if (existingUser.role.name === "user") {
      throw {
        status: false,
        message: "Unauthorized",
        httpStatus: httpStatus.UNAUTHORIZED,
      };
    }

    if (!(await existingUser.isPasswordCorrect(password))) {
      throw {
        status: false,
        message: "Incorrect Password",
        httpStatus: httpStatus.UNAUTHORIZED,
      };
    }

    const selectedFields = [
      "name",
      "dob",
      "mobile",
      "email",
      "role",
      "profilePic",
      "mobileNo",
    ];
    const { accessToken, refreshToken } = await createAccessOrRefreshToken(
      existingUser._id
    );
    const user = {};
    selectedFields.forEach((key) => {
      user[key] = existingUser[key];
    });

    user.permissions = user.role.permissions;
    user.role = user.role.name;
    return { accessToken, refreshToken, userData: user };
  }
  static async createUser(userData) {
    console.log("userData", userData);
    const password = generatePassword();
    if (!userData.role) {
      const role = await RoleService.getDoc({ name: "user" });
      userData.role = role._id;
    }
    userData.password = password;
    userData.isEmailVerified = true;
    const user = await this.Model.create(userData);
    // send password over email
    const subject = `Your temporary login credentials for ${process.env.APP_NAME}`;
    const loginUrl = `${env.FRONTEND_URL}/login`;
    const htmlContent = loginCredentialsContent(
      user?.email,
      password,
      loginUrl
    );
    sendMail(user?.email, subject, htmlContent);
    let userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;
    return { userData: userObj };
  }
  static async create(userData) {
    const otpVerified = await OtpService.verifyOtp(
      userData.email,
      userData.otp
    );
    if (!otpVerified) {
      throw {
        status: false,
        message: "Invalid OTP",
        httpStatus: httpStatus.BAD_REQUEST,
      };
    }
    const role = await RoleService.getDoc({ name: "user" });
    userData.role = role._id;
    const user = await this.Model.create(userData);
    let userObj = user.toObject();
    const { accessToken, refreshToken } = await createAccessOrRefreshToken(
      user._id
    );
    delete userObj.password;
    delete userObj.refreshToken;
    return { accessToken, refreshToken, userData: userObj };
  }
  static async signUpOtp(email) {
    const user = await this.Model.findOne({ email });
    if (user) {
      throw {
        status: false,
        message: "Email already exists",
        httpStatus: httpStatus.CONFLICT,
      };
    }
    const otp = generateOTP();
    const otpData = await OtpService.create({
      type: "email",
      email: email,
      otp: otp,
    });

    const subject = `Your One-Time Password for ${process.env.APP_NAME}`;
    const htmlContent = otpContent(otp);
    sendMail(email, subject, htmlContent);
  }

  static async update(id, userData) {
    const user = await User.findDocById(id);

    delete userData.password;
    delete userData.isTwoFactorEnabled;
    user.update(userData);
    await user.save();
    return user;
  }

  static async forgotPasswordRequest(userData) {
    const { email } = userData;
    const user = await User.findDoc({ email });
    const { otp, secret } = generateToken(user.secret);

    user.forgotPassSecret = secret;
    await user.save();

    const subject = `Your One-Time Password for ${process.env.APP_NAME}`;
    const htmlContent = otpContent(otp);
    sendMail(email, subject, htmlContent);
    return otp;
  }

  static async verifyOTP(otpData) {
    const { email, otp } = otpData;
    const user = await User.findDoc({ email });
    const { forgotPassSecret, id } = user;
    if (!forgotPassSecret || !verifyOTP(forgotPassSecret, otp, 10)) {
      throw {
        status: false,
        message: "Invalid otp",
        httpStatus: httpStatus.UNAUTHORIZED,
      };
    }
    const payload = { id, email };
    const { accessToken, refreshToken } = await createAccessOrRefreshToken(
      user._id
    );
    user.forgotPassSecret = null;
    await user.save();
    return { accessToken, refreshToken };
  }

  static async changePassword(userData) {
    const { password } = userData;
    const payload = session.get("payload");
    const user = await User.findDocById(payload.userId);
    user.password = password;
    await user.save();
  }

  static async deleteData(id) {
    const user = await this.Model.findDocById(id);
    //const addresses = user.addresses.map((id) => Address.findDocById(id));
  }
  static async find(number) {
    const users = await this.Model.aggregate([
      {
        $match: {
          status: "active",
          isActive: true,
        },
      },
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "role",
        },
      },
      {
        $unwind: "$role",
      },
      {
        $match: {
          "role.name": "user",
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: number,
      },
      {
        $project: {
          name: 1,
          email: 1,
          mobileNo: 1,
          createdAt: 1,
          status: 1,
          role: "$role.name",
        },
      },
    ]);
    return users;
  }
  static async userAnalyticsMonth() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const pipeline = [
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "roleDetails",
        },
      },
      {
        $unwind: "$roleDetails",
      },
      {
        $match: {
          "roleDetails.name": "user",
        },
      },
      {
        $facet: {
          currentMonthUsers: [
            {
              $match: {
                createdAt: { $gte: currentMonthStart },
              },
            },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
          lastMonthUsers: [
            {
              $match: {
                createdAt: {
                  $gte: lastMonthStart,
                  $lt: lastMonthEnd,
                },
              },
            },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
          totalUsers: [{ $group: { _id: null, count: { $sum: 1 } } }],
          dailyBreakdown: [
            {
              $match: {
                createdAt: { $gte: currentMonthStart },
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
                total: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
      {
        $project: {
          currentMonthUsers: {
            $ifNull: [{ $arrayElemAt: ["$currentMonthUsers.count", 0] }, 0],
          },
          lastMonthUsers: {
            $ifNull: [{ $arrayElemAt: ["$lastMonthUsers.count", 0] }, 0],
          },
          totalUsers: {
            $ifNull: [{ $arrayElemAt: ["$totalUsers.count", 0] }, 0],
          },
          dailyBreakdown: "$dailyBreakdown",
        },
      },
    ];

    const [data] = await this.Model.aggregate(pipeline);

    const dailyBreakdownMap = new Map(
      data.dailyBreakdown.map((item) => [item._id, item.total])
    );

    const fullDailyBreakdown = Array.from(
      { length: lastDayOfMonth.getDate() },
      (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth(), index + 1);
        const formattedDate = date.toISOString().split("T")[0];
        return dailyBreakdownMap.get(formattedDate) || 0;
      }
    );

    return {
      currentMonthUsers: data.currentMonthUsers,
      lastMonthUsers: data.lastMonthUsers,
      totalUsers: data.totalUsers,
      dailyBreakdown: fullDailyBreakdown,
    };
  }
  static async userAnalyticsYear() {
    const now = new Date();
    const currentYearStart = new Date(now.getFullYear(), 0, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear(), 0, 1);

    const pipeline = [
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "roleDetails",
        },
      },
      {
        $unwind: "$roleDetails",
      },
      {
        $match: {
          "roleDetails.name": "user",
        },
      },
      {
        $facet: {
          currentYearUsers: [
            {
              $match: {
                createdAt: { $gte: currentYearStart },
              },
            },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
          lastYearUsers: [
            {
              $match: {
                createdAt: {
                  $gte: lastYearStart,
                  $lt: lastYearEnd,
                },
              },
            },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
          totalUsers: [{ $group: { _id: null, count: { $sum: 1 } } }],
          monthlyBreakdown: [
            {
              $match: {
                createdAt: { $gte: currentYearStart },
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
                total: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
      {
        $project: {
          currentYearUsers: {
            $ifNull: [{ $arrayElemAt: ["$currentYearUsers.count", 0] }, 0],
          },
          lastYearUsers: {
            $ifNull: [{ $arrayElemAt: ["$lastYearUsers.count", 0] }, 0],
          },
          totalUsers: {
            $ifNull: [{ $arrayElemAt: ["$totalUsers.count", 0] }, 0],
          },
          monthlyBreakdown: "$monthlyBreakdown",
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
      currentYearUsers: data.currentYearUsers,
      lastYearUsers: data.lastYearUsers,
      totalUsers: data.totalUsers,
      monthlyBreakdown: fullMonthlyBreakdown,
    };
  }
  static async socialUserCreate(userData, provider) {
    let user;
    user = await this.Model.findOne({ email: userData.email });

    if (!user) {
      let userObj = {};
      const role = await RoleService.getDoc({ name: "user" });
      userObj.role = role._id;
      userObj.name = userData.name;
      userObj.socialId = userData.sub;
      userObj.provider = provider;
      userObj.email = userData.email;
      userObj.profilePic = userData.picture;
      userObj.isEmailVerified = true;
      const newUser = await this.Model.create(userObj);
      user = newUser;
    }
    const { accessToken, refreshToken } = await createAccessOrRefreshToken(
      user._id
    );
    let userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;
    delete userObj.forgotPassSecret;
    return { accessToken, refreshToken, userData: userObj };
  }
}

export default UserService;
