import api from "./client";

// Every request the app makes lives here, so no component builds its own URL.

export const auth = {
  signup: (payload) => api.post("/auth/signup", payload),
  login: (payload) => api.post("/auth/login", payload),
  me: () => api.get("/auth/me"),
  updateProfile: (payload) => api.put("/auth/me", payload),
};

export const topics = {
  list: (params) => api.get("/topics", { params }),
  due: () => api.get("/topics/due"),
  stats: () => api.get("/topics/stats"),
  categories: () => api.get("/topics/categories"),
  get: (id) => api.get(`/topics/${id}`),
  create: (payload) => api.post("/topics", payload),
  update: (id, payload) => api.put(`/topics/${id}`, payload),
  remove: (id) => api.delete(`/topics/${id}`),
  saveNotes: (id, notes) => api.patch(`/topics/${id}/notes`, { notes }),
  markReviewed: (id) => api.patch(`/topics/${id}/review`),
  duplicate: (id) => api.post(`/topics/${id}/duplicate`),

  addResource: (id, payload) => api.post(`/topics/${id}/resources`, payload),
  updateResource: (id, resourceId, payload) =>
    api.put(`/topics/${id}/resources/${resourceId}`, payload),
  removeResource: (id, resourceId) =>
    api.delete(`/topics/${id}/resources/${resourceId}`),

  addChecklistItem: (id, text) => api.post(`/topics/${id}/checklist`, { text }),
  updateChecklistItem: (id, itemId, payload) =>
    api.patch(`/topics/${id}/checklist/${itemId}`, payload),
  removeChecklistItem: (id, itemId) =>
    api.delete(`/topics/${id}/checklist/${itemId}`),
};

export const quickNotes = {
  list: () => api.get("/quick-notes"),
  create: (payload) => api.post("/quick-notes", payload),
  remove: (id) => api.delete(`/quick-notes/${id}`),
  convert: (id) => api.post(`/quick-notes/${id}/convert`),
};

export const collections = {
  list: () => api.get("/collections"),
  create: (payload) => api.post("/collections", payload),
  update: (id, payload) => api.put(`/collections/${id}`, payload),
  remove: (id) => api.delete(`/collections/${id}`),
};

export const activities = {
  list: (limit = 20) => api.get("/activities", { params: { limit } }),
};

export const transcripts = {
  list: () => api.get("/transcripts"),
  capabilities: () => api.get("/transcripts/capabilities"),
  generate: (payload) => api.post("/transcripts", payload),
  notes: (payload) => api.post("/transcripts/notes", payload),
  remove: (id) => api.delete(`/transcripts/${id}`),
};

export const stats = {
  // Public: aggregate counts for the landing page, no auth required.
  public: () => api.get("/stats"),
};
