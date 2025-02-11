import fs from "fs/promises";
import path from "path";

/**
 * Deletes a file from the local storage if it exists.
 * @param {string} filePath - The relative file path to delete.
 */
async function deleteFile(filePath) {
  const fullPath = path.join(process.cwd(), "src", filePath);

  try {
    // Check if file exists
    await fs.access(fullPath);
    console.log(`📂 File exists: ${fullPath}`);
    await fs.unlink(fullPath);
    console.log(`✅ Deleted file: ${fullPath}`);
  } catch (err) {

    if (err.code !== "ENOENT") {
      console.error(`❌ Error deleting file: ${fullPath}`, err);
    }
    // If the file doesn't exist (ENOENT), we simply do nothing
  }
}

/**
 * Mongoose middleware to handle optional file deletion before removing a document.
 */
export default async function deleteAssociatedFiles(next) {
  console.log("🔹 Running deleteAssociatedFiles middleware...");

  try {
    const doc = await this.model.findOne(this.getQuery());

    if (!doc) {
      console.warn("⚠️ Document not found for deletion.");
      return next();
    }

    console.log(`📄 Found document for deletion: ${doc._id}`);

    // Extract file fields dynamically using schema.tree
    const fileFields = Object.keys(doc.schema.tree).filter(
      (field) => doc.schema.tree[field].file === true
    );

    console.log(`📂 File fields found: ${fileFields.join(", ")}`);

    // Loop through each file field and delete the file if it exists
    for (const field of fileFields) {
      const filePath = doc[field];
      if (filePath) {
        console.log(`🗑️ Attempting to delete: ${filePath}`);
        await deleteFile(filePath);
      }
    }

    next(); // Proceed to remove the document from the database
  } catch (err) {
    console.error("❌ Error in file deletion middleware:", err);
    next(err);
  }
}
