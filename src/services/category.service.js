import Category from "#models/category";
import Service from "#services/base";
import httpStatus from "#utils/httpStatus";

class CategoryService extends Service {
  static Model = Category;

  

  static async deleteDoc(id) {
    const deletedDoc = await Category.findDocById(id);
    await deletedDoc.deleteOne();

    return {
      status: true,
      message: "Category deleted successfully",
      httpStatus: httpStatus.OK,
    };
  }
}

export default CategoryService;
