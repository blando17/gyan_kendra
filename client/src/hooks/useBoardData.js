import { useCallback, useEffect, useMemo, useState } from "react";

import {
  activities as activitiesApi,
  collections as collectionsApi,
  quickNotes as quickNotesApi,
  topics as topicsApi,
} from "../api/endpoints";
import { errorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";

/**
 * Everything the board reads and writes.
 *
 * Favourite, status and checklist changes are applied to the UI first and
 * rolled back if the request fails, so the board never feels like it is
 * waiting on the network. Anything that needs a server-generated id
 * (creating a topic, adding a resource) waits for the response instead.
 */
export default function useBoardData() {
  const { addToast } = useToast();

  const [topics, setTopics] = useState([]);
  const [quickNotes, setQuickNotes] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fail = useCallback(
    (error, fallback) => addToast(errorMessage(error, fallback), "error"),
    [addToast],
  );

  const refresh = useCallback(async () => {
    try {
      const [t, q, c, a] = await Promise.all([
        topicsApi.list(),
        quickNotesApi.list(),
        collectionsApi.list(),
        activitiesApi.list(),
      ]);

      setTopics(t.data.topics);
      setQuickNotes(q.data.quickNotes);
      setCollections(c.data.collections);
      setActivities(a.data.activities);
    } catch (error) {
      fail(error, "Could not load your board.");
    } finally {
      setLoading(false);
    }
  }, [fail]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Derived from the topics already in hand, so the tiles can never show a
  // stale count after a create, delete or status change.
  const stats = useMemo(() => {
    const now = new Date();

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const countBy = (status) => topics.filter((t) => t.status === status).length;

    const velocity = Array.from({ length: 7 }, (_, offset) => {
      const day = new Date(now.getTime() - (6 - offset) * 24 * 60 * 60 * 1000);

      const start = new Date(day).setHours(0, 0, 0, 0);

      const end = new Date(day).setHours(23, 59, 59, 999);

      return {
        date: new Date(start).toISOString(),
        count: topics.filter((t) => {
          const created = new Date(t.createdAt).getTime();

          return created >= start && created <= end;
        }).length,
      };
    });

    return {
      total: topics.length,
      toLearn: countBy("To Learn"),
      learning: countBy("Learning"),
      completed: countBy("Completed"),
      needsRevision: topics.filter(
        (t) =>
          t.status === "Needs Revision" ||
          (t.nextReviewAt && new Date(t.nextReviewAt) <= now),
      ).length,
      totalResources: topics.reduce(
        (sum, t) => sum + (t.resources?.length || 0),
        0,
      ),
      topicsThisWeek: topics.filter((t) => new Date(t.createdAt) >= weekAgo)
        .length,
      velocity,
    };
  }, [topics]);

  const replaceTopic = useCallback((topic) => {
    setTopics((current) =>
      current.map((item) => (item._id === topic._id ? topic : item)),
    );
  }, []);

  // Apply `patch` immediately, send the request, undo on failure.
  const optimistic = useCallback(
    async (topic, patch, failureMessage) => {
      const previous = topic;

      setTopics((current) =>
        current.map((item) =>
          item._id === topic._id ? { ...item, ...patch } : item,
        ),
      );

      try {
        const res = await topicsApi.update(topic._id, patch);

        replaceTopic(res.data.topic);

        return res.data.topic;
      } catch (error) {
        replaceTopic(previous);

        fail(error, failureMessage);

        return null;
      }
    },
    [replaceTopic, fail],
  );

  const createTopic = useCallback(
    async (data) => {
      try {
        const res = await topicsApi.create(data);

        setTopics((current) => [res.data.topic, ...current]);

        addToast(`Created topic "${res.data.topic.title}"`);

        return res.data.topic;
      } catch (error) {
        fail(error, "Could not create the topic.");

        return null;
      }
    },
    [addToast, fail],
  );

  const updateTopic = useCallback(
    async (id, data) => {
      try {
        const res = await topicsApi.update(id, data);

        replaceTopic(res.data.topic);

        return res.data.topic;
      } catch (error) {
        fail(error, "Could not save the topic.");

        return null;
      }
    },
    [replaceTopic, fail],
  );

  const deleteTopic = useCallback(
    async (id) => {
      const previous = topics;

      setTopics((current) => current.filter((topic) => topic._id !== id));

      try {
        await topicsApi.remove(id);

        addToast("Topic deleted", "info");

        return true;
      } catch (error) {
        setTopics(previous);

        fail(error, "Could not delete the topic.");

        return false;
      }
    },
    [topics, addToast, fail],
  );

  const toggleFavorite = useCallback(
    async (topic) => {
      const next = !topic.isFavorite;

      const saved = await optimistic(
        topic,
        { isFavorite: next },
        "Could not update the star.",
      );

      if (saved) {
        addToast(next ? `Starred "${topic.title}"` : `Unstarred "${topic.title}"`);
      }
    },
    [optimistic, addToast],
  );

  const changeStatus = useCallback(
    async (topic, status) => {
      const saved = await optimistic(
        topic,
        { status },
        "Could not change the status.",
      );

      if (saved) addToast(`Status changed to ${status}`);
    },
    [optimistic, addToast],
  );

  const duplicateTopic = useCallback(
    async (topic) => {
      try {
        const res = await topicsApi.duplicate(topic._id);

        setTopics((current) => [res.data.topic, ...current]);

        addToast(`Duplicated "${topic.title}"`);
      } catch (error) {
        fail(error, "Could not duplicate the topic.");
      }
    },
    [addToast, fail],
  );

  // The next review date is decided by the server, never here.
  const markReviewed = useCallback(
    async (id) => {
      try {
        const res = await topicsApi.markReviewed(id);

        replaceTopic(res.data.topic);

        addToast(res.data.message);

        return res.data.topic;
      } catch (error) {
        fail(error, "Could not record the review.");

        return null;
      }
    },
    [replaceTopic, addToast, fail],
  );

  const addQuickNote = useCallback(
    async (content, tags) => {
      try {
        const res = await quickNotesApi.create({ content, tags });

        setQuickNotes((current) => [res.data.quickNote, ...current]);

        addToast("Quick note saved");
      } catch (error) {
        fail(error, "Could not save the quick note.");
      }
    },
    [addToast, fail],
  );

  const deleteQuickNote = useCallback(
    async (id) => {
      const previous = quickNotes;

      setQuickNotes((current) => current.filter((note) => note._id !== id));

      try {
        await quickNotesApi.remove(id);

        addToast("Quick note removed", "info");
      } catch (error) {
        setQuickNotes(previous);

        fail(error, "Could not remove the quick note.");
      }
    },
    [quickNotes, addToast, fail],
  );

  const convertQuickNote = useCallback(
    async (note) => {
      try {
        const res = await quickNotesApi.convert(note._id);

        setTopics((current) => [res.data.topic, ...current]);

        setQuickNotes((current) => current.filter((n) => n._id !== note._id));

        addToast(res.data.message);
      } catch (error) {
        fail(error, "Could not convert the quick note.");
      }
    },
    [addToast, fail],
  );

  const createCollection = useCallback(
    async (payload) => {
      try {
        const res = await collectionsApi.create(payload);

        setCollections((current) =>
          [...current, { ...res.data.collection, topicCount: 0 }].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );

        addToast(`Created collection "${res.data.collection.name}"`);

        return res.data.collection;
      } catch (error) {
        fail(error, "Could not create the collection.");

        return null;
      }
    },
    [addToast, fail],
  );

  const deleteCollection = useCallback(
    async (id) => {
      try {
        await collectionsApi.remove(id);

        setCollections((current) => current.filter((c) => c._id !== id));

        // Topics keep existing but lose the label, so re-read them.
        const res = await topicsApi.list();

        setTopics(res.data.topics);

        addToast("Collection deleted", "info");
      } catch (error) {
        fail(error, "Could not delete the collection.");
      }
    },
    [addToast, fail],
  );

  return {
    topics,
    quickNotes,
    collections,
    activities,
    stats,
    loading,
    refresh,
    replaceTopic,
    createTopic,
    updateTopic,
    deleteTopic,
    toggleFavorite,
    changeStatus,
    duplicateTopic,
    markReviewed,
    addQuickNote,
    deleteQuickNote,
    convertQuickNote,
    createCollection,
    deleteCollection,
  };
}
