import env from "#configs/env";
import User from "#models/user";
import Service from "#services/base";
import httpStatus from "#utils/httpStatus";
import { createAccessOrRefreshToken } from "#utils/jwt";
import { generatePassword } from "#utils/helper";
import RoleService from "#services/role";

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
  static async update(id, userData) {
    const user = await User.findDocById(id);

    delete userData.password;
    delete userData.isTwoFactorEnabled;
    user.update(userData);
    await user.save();
    return user;
  }

  static async deleteData(id) {
    const user = await this.Model.findDocById(id);
    //const addresses = user.addresses.map((id) => Address.findDocById(id));
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
