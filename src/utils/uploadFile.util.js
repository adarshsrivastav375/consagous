import fs from "fs/promises";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import httpStatus from "#utils/httpStatus";
import { session } from "#middlewares/session";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function uploadFile(next) {
  try {
    const files = session?.get("files");
    if (!files || !files?.length) return next();

    const modelKeys = this.constructor.schema.tree;
    const modelName = this.constructor.modelName.toLowerCase();
    const filePaths = {};
    let filesPathArr = [];

    // Base directory for uploads in `src/uploads`
    const baseUploadDir = path.join(process.cwd(), "src/uploads");
    await fs.mkdir(baseUploadDir, { recursive: true });

    for (const file of files) {
      if (!modelKeys[file.fieldname]?.file) continue;

      // Directory structure for model and document
      const relativePath = `${modelName}`.toLowerCase();
      const fullDir = path.join(baseUploadDir, modelName);
      await fs.mkdir(fullDir, { recursive: true });

      // Extract file extension
      const ext = path.extname(file.originalname) || ".bin"; // Default to .bin if no extension
      const fileName = `${file.fieldname}-${this._id}${ext}`.toLowerCase();
      const fullPath = path.join(fullDir, fileName);
      this.fileType = ext;
      filePaths[file.fieldname] = filesPathArr.length;

      // Add the file write operation to the promise array
      filesPathArr.push({
        promise: fs.writeFile(fullPath, file.buffer), // Write the file buffer
        relativePath: path.join(relativePath, fileName),
      });
    }

    // Wait for all file writes to complete
    await Promise.all(filesPathArr.map((f) => f.promise));

    // Update the document with the relative file paths
    for (let key in filePaths) {
      this[key] = `/uploads/${filesPathArr[filePaths[key]].relativePath}`;
    }

    next();
  } catch (err) {
    console.error("File upload error:", err);
    next(err);
  }
}
