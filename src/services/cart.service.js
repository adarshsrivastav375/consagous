import Cart from "#models/cart";
import Service from "#services/base";
import httpStatus from "#utils/httpStatus";
import mongoose from "mongoose";

class CartService extends Service {
  static Model = Cart;

  // Delete Cart by ID
  static async deleteDoc(id) {
    const deletedDoc = await Cart.findById(id);
    if (!deletedDoc) {
      return {
        status: false,
        message: "Cart not found",
        httpStatus: httpStatus.NOT_FOUND,
      };
    }
    await deletedDoc.deleteOne();

    return {
      status: true,
      message: "Cart deleted successfully",
      httpStatus: httpStatus.OK,
    };
  }

  // Get user's cart with product details and quantity
  static async getUsersCart(userId) {
    const cart = await Cart.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(userId) },
      },
      {
        $unwind: {
          path: "$products",
          preserveNullAndEmptyArrays: true,
        },
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
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          user: { $first: "$user" },
          products: {
            $push: {
              product: "$productDetails",
              quantity: "$products.quantity",
            },
          },
          totalAmount: { $first: "$totalAmount" },
          totalItems: { $first: "$totalItems" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
        },
      },
    ]);

    if (!cart || cart.length === 0) {
      return {};
    }
    return cart[0];
  }

  // Add product to cart or update quantity if it already exists
  static async create(userId, productId, quantity = 1) {
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        products: [{ product: productId, quantity }],
      });
    } else {
      const productIndex = cart.products.findIndex(
        (item) => item?.product?.toString() === productId
      );

      if (productIndex !== -1) {
        cart.products[productIndex].quantity += quantity;
      } else {
        cart.products.push({ product: productId, quantity });
      }
    }

    const updatedCart = await cart.save();

    return {
      message: "Product added to cart successfully",
      data: updatedCart,
      httpStatus: httpStatus.OK,
    };
  }

  // Remove a product from cart (or decrease quantity)
  static async removeItemFromCart(userId, productId, quantity = 1) {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return {
        status: false,
        message: "Cart not found",
        httpStatus: httpStatus.NOT_FOUND,
      };
    }

    const productIndex = cart.products.findIndex(
      (item) => item.product.toString() === productId
    );

    if (productIndex === -1) {
      return {
        status: false,
        message: "Product not found in the cart",
        httpStatus: httpStatus.BAD_REQUEST,
      };
    }

    if (cart.products[productIndex].quantity > quantity) {
      cart.products[productIndex].quantity -= quantity;
    } else {
      cart.products.splice(productIndex, 1);
    }

    const updatedCart = await cart.save();

    return {
      message: "Product updated in cart",
      data: updatedCart,
      httpStatus: httpStatus.OK,
    };
  }

  // Empty the entire cart
  static async emptyCart(userId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return {
        status: false,
        message: "Cart not found",
        httpStatus: httpStatus.NOT_FOUND,
      };
    }
    cart.products = [];
    cart.totalAmount = 0;
    cart.totalItems = 0;
    await cart.save();

    return {
      message: "Cart emptied successfully",
      data: cart,
      httpStatus: httpStatus.OK,
    };
  }
}

export default CartService;
