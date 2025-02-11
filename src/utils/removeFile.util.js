import fs from "fs/promises";
import path from "path";

/**
 * Deletes a file from the local storage given the file field.
 * @param {string} filePath - The relative file path to delete.
 */
async function deleteFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), "src", filePath);
    await fs.unlink(fullPath);
    console.log(`Deleted file at ${fullPath}`);
  } catch (err) {
    console.error(`Error deleting file at ${filePath}:`, err);
  }
}

/**
 * Mongoose middleware to handle file deletion before removing a document.
 */

export default async function deleteAssociatedFiles(next) {
  try {
    const doc = await this.model.findOne(this.getQuery()); 

    if (!doc) {
      return next();
    }

    // Extract file fields dynamically using schema.tree
    const fileFields = Object.keys(doc.schema.tree).filter(
      (path) => doc.schema.tree[path].file === true
    );

    // Loop through each file field and delete the file if it exists
    for (const field of fileFields) {
      const filePath = doc[field];
      if (filePath) {
        await deleteFile(filePath);
        console.log(`Deleted file: ${filePath}`);
      }
    }

    next(); // Proceed to remove the document from the database
  } catch (err) {
    console.error("Error in file deletion before document removal:", err);
    next(err);
  }
}