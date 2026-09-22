import { apiFetch } from "../../../firebase";

/**
 * Get the environment settings for a specific company
 * @param {string} companyId - The authenticated user's company ID
 */
export const getEnvironmentSettings = async (companyId) => {
  if (!companyId) throw new Error("Company ID is required");
  try {
    const data = await apiFetch(`/environment-settings?companyId=${companyId}&key=general`);
    return data || null;
  } catch (err) {
    console.error("Error fetching environment settings:", err);
    return null;
  }
};

/**
 * Save or update environment settings for a specific company (uses merge/upsert)
 * @param {string} companyId - The authenticated user's company ID
 * @param {object} data - The settings to save/update
 * @param {string} userId - The authenticated user's ID tracking who updated it
 */
export const saveEnvironmentSettings = async (companyId, data, userId) => {
  if (!companyId) throw new Error("Company ID is required");
  if (!userId) throw new Error("User ID is required for auditing");

  const timestamp = new Date().toISOString();
  const payload = {
    companyId,
    category: "general",
    key: "general",
    value: {
      ...data,
      updatedAt: timestamp,
      updatedBy: userId
    }
  };

  return apiFetch("/environment-settings", {
    method: "POST",
    body: JSON.stringify(payload)
  });
};
