import Role from "#models/role";
import Service from "#services/base";
import User from "#models/user";
import httpStatus from "#utils/httpStatus";

class RoleService extends Service {
  static Model = Role;

  static async getLimitedRoleFields(fields) {
    const roleData = await Role.find({ name: { $ne: "user" } }).select(
      "id name"
    );
    return roleData;
  }

  static async deleteDoc(id) {
    const deletedDoc = await Role.findDocById(id);

    const roleDataUser = await User.findOne({ role: id });
    if (roleDataUser) {
      throw {
        status: false,
        message: "Cannot delete Role while users are assigned to it",
        httpStatus: httpStatus.BAD_REQUEST,
      };
    }

    await deletedDoc.deleteOne();

    return {
      status: true,
      message: "Role deleted successfully",
      httpStatus: httpStatus.OK,
    };
  }
}

export default RoleService;
