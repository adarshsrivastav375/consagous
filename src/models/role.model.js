import mongoose, { Schema } from "mongoose";
import BaseSchema from "#models/base";

/**
 * PermissionSchema defines the structure for granular permissions.
 */
const permissionSchema = new Schema(
  {
    module: {
      type: String,
      required: true,
      trim: true,
      description:
        "Name of the module the permission applies to (e.g., Users, Orders).",
    },
    access: {
      type: Map,
      of: Boolean,
      required: true,
      description:
        "CRUD access: { create: true, read: true, update: false, delete: false }",
    },
  },
  { timestamps: false, _id: false },
);

/**
 * RoleSchema defines the structure for role-based permissions.
 */
const roleSchema = new BaseSchema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    description: "Unique name of the role (e.g., Admin, Manager, Viewer).",
  },
  permissions: {
    type: [permissionSchema],
    default: [],
    description: "List of permissions associated with the role.",
  },
  description: {
    type: String,
    trim: true,
    description: "Optional description of the role's purpose and scope.",
  },
  status: {
    type: Boolean,
    required: true,
    default: false,
  },
});

export default mongoose.model("Role", roleSchema);
