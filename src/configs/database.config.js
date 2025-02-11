import "colors";
import mongoose from "mongoose";
import logger from "#configs/logger";

const connectDB = async (DB_URI) => {
  try {
    await mongoose.connect(DB_URI);
    logger.info(`${"Connected To Database".yellow}`);
  } catch (err) {
    logger.error(`Database connection failed: ${err.message}`);
    process.exit(1); // Exit the process with failure
  }
};

export default connectDB;
