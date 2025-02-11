import env from "#configs/env";
import logger from "#configs/logger";
import server from "#configs/server";
import connectDB from "#configs/database";

await connectDB(env.DB_URI);
server.listen(env.PORT, () => {
  logger.info(`Server is running at http://localhost:${env.PORT}`.blue);
});