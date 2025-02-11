class Service {
  static Model = null;

  static async create(data) {
    const doc = new this.Model(data);
    await doc.save();
    return doc;
  }

  /**
   * Fetch docs by ID or with filters.
   * @param {string | number} id - Doc ID.
   * @param {Object} filters - Query parameters for filtering and pagination.
   * @returns {Promise<Object>} - Paginated list of docs.
   */
  static async get(id, filters = {}) {
    if (!id) {
      return await this.Model.findAll(filters);
    }
    return await this.Model.findDocById(id);
  }

  static async getDoc(filter) {
    return await this.Model.findDoc(filter);
  }

  static async getDocById(id) {
    return await this.Model.findDocById(id);
  }

  static async getSafe(id) {
    if (!id) {
      return null;
    }
    return await this.Model.findById(id);
  }

  /**
   * Update an doc by ID.
   * @param {string} id- ID of the doc to update.
   * @param {Object} updates - Fields to update.
   * @returns {Promise<Object>} - Updated doc.
   */
  static async update(id, updates) {
    const doc = await this.Model.findDocById(id);
    doc.update(updates);
    await doc.save();
    return doc;
  }

  /**
   * Delete doc by ID.
   * @param {string} id - ID of the doc to delete.
   * @returns {Promise<Object>} - Deleted doc.
   */
  static async deleteDoc(id) {
    const deletedDoc = await this.Model.findDocById(id);

    // TODO: Implement proper delete after performing checks

    deletedDoc.deletedAt = new Date();
    await deletedDoc.save();
    return deletedDoc;
  }
}
export default Service;
