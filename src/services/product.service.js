import Product from "#models/product";
import Service from "#services/base";
import httpStatus from "#utils/httpStatus";

class ProductService extends Service {
  static Model = Product;
  static async deleteDoc(id) {
    const deletedDoc = await this.Model.findDocById(id);
    await deletedDoc.deleteOne();

    return {
      status: true,
      message: "Doc deleted successfully",
      httpStatus: httpStatus.OK,
    };
  }
}

export default ProductService;
