/**
 * Seeds a demo account so the board can be explored immediately.
 *
 *   email:    demo@gyankendra.dev
 *   password: gyankendra123
 *
 * Re-running rebuilds only the demo account's data. No other account is
 * touched. Run with: npm run seed
 */

require("dotenv").config();

const mongoose = require("mongoose");

const { connectDB } = require("../config/db");
const User = require("../models/User");
const Topic = require("../models/Topic");
const QuickNote = require("../models/QuickNote");
const Collection = require("../models/Collection");
const Activity = require("../models/Activity");
const { addDays } = require("../utils/revision");

const DEMO_EMAIL = "demo@gyankendra.dev";

const DEMO_PASSWORD = "gyankendra123";

const now = new Date();

const topics = [
  {
    title: "Binary Search",
    description:
      "Efficient divide and conquer algorithm for searching in sorted collections in O(log n) time.",
    category: "DSA / CP",
    tags: ["DSA", "Searching", "Algorithms"],
    status: "Learning",
    isFavorite: true,
    themeId: "yellow",
    collections: ["DSA Preparation", "Placement Preparation"],
    reviewCount: 2,
    lastReviewedAt: addDays(now, -3),
    nextReviewAt: addDays(now, -1),
    resources: [
      {
        title: "Binary Search - LeetCode",
        url: "https://leetcode.com/problems/binary-search/",
        type: "Problem",
      },
      {
        title: "Binary Search Explained Step-by-Step",
        url: "https://youtube.com/watch?v=s4D228viH18",
        type: "YouTube",
      },
      {
        title: "Binary Search Detailed Article",
        url: "https://geeksforgeeks.org/binary-search/",
        type: "Article",
      },
    ],
    checklist: [
      { text: "Understand the halving strategy", completed: true },
      { text: "Implement the iterative version", completed: true },
      { text: "Solve 5 problems (lower bound, rotated array)", completed: false },
      { text: "Revise edge cases with duplicates", completed: false },
    ],
    notes: `# Binary Search

Binary search works on **sorted collections** and finds the target in O(log n) time.

## Core invariant
- Keep two pointers, \`low\` and \`high\`
- Take the middle:

\`\`\`js
const mid = low + Math.floor((high - low) / 2);
\`\`\`

- \`target === arr[mid]\` -> found it
- \`target < arr[mid]\` -> search left, \`high = mid - 1\`
- \`target > arr[mid]\` -> search right, \`low = mid + 1\`

## Common pitfalls
1. Integer overflow from \`(low + high) / 2\` in C++/Java.
2. Getting \`low <= high\` vs \`low < high\` wrong.
3. Confusing lower bound with upper bound.`,
  },
  {
    title: "Dynamic Programming",
    description:
      "Overlapping subproblems and optimal substructure: memoization and bottom-up tables.",
    category: "DSA / CP",
    tags: ["DSA", "Algorithms", "Memoization"],
    status: "Completed",
    themeId: "rose",
    collections: ["DSA Preparation"],
    reviewCount: 4,
    lastReviewedAt: addDays(now, -10),
    nextReviewAt: addDays(now, 20),
    resources: [
      {
        title: "MIT 6.006 DP Lecture",
        url: "https://youtube.com/watch?v=OQ5jsbhAv_M",
        type: "YouTube",
      },
      {
        title: "NeetCode DP Roadmap",
        url: "https://neetcode.io/practice",
        type: "Documentation",
      },
    ],
    checklist: [
      { text: "0/1 Knapsack", completed: true },
      { text: "Longest Common Subsequence", completed: true },
      { text: "Matrix Chain Multiplication", completed: false },
    ],
    notes: `# Dynamic Programming

Break a problem into smaller subproblems, then cache the answers.

## Patterns worth knowing
1. 0/1 Knapsack
2. Unbounded Knapsack
3. Longest Common Subsequence
4. Matrix Chain Multiplication

Top-down (memoized recursion) is usually easier to write; bottom-up avoids
recursion depth problems.`,
  },
  {
    title: "React Server Components",
    description:
      "Rendering components on the server to cut bundle size and reach data directly.",
    category: "Development",
    tags: ["React", "Next.js", "Frontend"],
    status: "To Learn",
    themeId: "sky",
    collections: ["Web Development"],
    nextReviewAt: addDays(now, 2),
    resources: [
      {
        title: "React docs - Server Components",
        url: "https://react.dev/reference/rsc/server-components",
        type: "Documentation",
      },
    ],
    checklist: [{ text: "Read the RFC", completed: false }],
    notes: "# React Server Components\n\nNotes to come.",
  },
  {
    title: "Transformers & Attention",
    description:
      "Self-attention, multi-head attention and positional encoding from the ground up.",
    category: "Machine Learning",
    tags: ["ML", "NLP", "DeepLearning"],
    status: "Needs Revision",
    isFavorite: true,
    themeId: "lavender",
    collections: ["ML Fundamentals"],
    reviewCount: 1,
    lastReviewedAt: addDays(now, -9),
    nextReviewAt: addDays(now, -2),
    resources: [
      {
        title: "Attention Is All You Need",
        url: "https://arxiv.org/pdf/1706.03762.pdf",
        type: "PDF",
      },
      {
        title: "The Illustrated Transformer",
        url: "https://jalammar.github.io/illustrated-transformer/",
        type: "Article",
      },
      {
        title: "nanoGPT",
        url: "https://github.com/karpathy/nanoGPT",
        type: "GitHub",
      },
    ],
    checklist: [
      { text: "Derive scaled dot-product attention", completed: true },
      { text: "Implement multi-head attention", completed: false },
    ],
    notes: `# Transformers

## Scaled dot-product attention

\`\`\`
Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V
\`\`\`

The \`sqrt(d_k)\` divisor keeps the dot products from growing with dimension,
which would otherwise push softmax into regions with tiny gradients.`,
  },
  {
    title: "Operating System Scheduling",
    description: "How the CPU decides what runs next: FCFS, SJF, round robin.",
    category: "Theory",
    tags: ["OS", "Core CS"],
    status: "Learning",
    themeId: "mint",
    collections: ["Placement Preparation"],
    nextReviewAt: addDays(now, 1),
    resources: [
      {
        title: "OSTEP - Scheduling",
        url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf",
        type: "PDF",
      },
    ],
    checklist: [
      { text: "Compare FCFS vs SJF turnaround", completed: true },
      { text: "Work through a round robin example", completed: false },
    ],
    notes:
      "# CPU Scheduling\n\n- **FCFS** suffers from the convoy effect\n- **SJF** is optimal for average waiting time but needs burst length\n- **Round robin** trades throughput for responsiveness",
  },
];

async function seed() {
  await connectDB();

  let user = await User.findOne({ email: DEMO_EMAIL }).select("+password");

  if (!user) {
    user = await User.create({
      username: "Demo Learner",
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
  } else {
    user.password = DEMO_PASSWORD;

    await user.save();
  }

  const userId = user._id;

  // Only the demo account's data is cleared.
  await Promise.all([
    Topic.deleteMany({ userId }),
    QuickNote.deleteMany({ userId }),
    Collection.deleteMany({ userId }),
    Activity.deleteMany({ userId }),
  ]);

  await Collection.insertMany(
    [
      { name: "DSA Preparation", description: "Everything for the coding rounds", color: "#f59e0b" },
      { name: "Placement Preparation", description: "Core CS revision", color: "#0ea5e9" },
      { name: "Web Development", description: "Frontend and backend craft", color: "#10b981" },
      { name: "ML Fundamentals", description: "Maths and model internals", color: "#8b5cf6" },
    ].map((collection) => ({ ...collection, userId })),
  );

  const created = await Topic.insertMany(
    topics.map((topic) => ({ ...topic, userId })),
  );

  await QuickNote.insertMany(
    [
      {
        content: "Look into why useMemo did not help the table render.",
        tags: ["React", "Performance"],
      },
      {
        content: "Compare Mongo aggregation pipeline vs map-reduce for the stats endpoint.",
        tags: ["MongoDB"],
      },
      { content: "Revise bit manipulation tricks before the contest.", tags: ["DSA"] },
    ].map((note) => ({ ...note, userId })),
  );

  await Activity.insertMany(
    [
      { text: 'Reviewed "Binary Search"', type: "review" },
      { text: 'Created topic "Transformers & Attention"', type: "create" },
      { text: "Added a new quick note", type: "quicknote" },
    ].map((activity) => ({ ...activity, userId })),
  );

  console.log("Seed complete.");
  console.log(`  email:       ${DEMO_EMAIL}`);
  console.log(`  password:    ${DEMO_PASSWORD}`);
  console.log(`  topics:      ${created.length}`);
  console.log(`  collections: 4`);
  console.log(`  quick notes: 3`);
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err.message);

    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
