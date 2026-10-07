// Spaced repetition lives on the server so the client cannot pick its own
// review dates.
//
//   a new topic      -> first look in 2 days
//   review 1         -> 3 days
//   review 2         -> 7 days
//   review 3         -> 14 days
//   review 4         -> 30 days
//   review 5 onwards -> 60 days
const FIRST_INTERVAL_DAYS = 2;

const INTERVALS_BY_REVIEW = [3, 7, 14, 30, 60];

function addDays(date, days) {
  const next = new Date(date);

  next.setDate(next.getDate() + days);

  return next;
}

function firstReviewDate(from = new Date()) {
  return addDays(from, FIRST_INTERVAL_DAYS);
}

// Fields to apply when the user presses "Mark as Reviewed".
function onReviewed(reviewCount = 0, now = new Date()) {
  const index = Math.min(reviewCount, INTERVALS_BY_REVIEW.length - 1);

  const intervalDays = INTERVALS_BY_REVIEW[index];

  return {
    reviewCount: reviewCount + 1,
    lastReviewedAt: now,
    nextReviewAt: addDays(now, intervalDays),
    intervalDays,
  };
}

module.exports = {
  FIRST_INTERVAL_DAYS,
  INTERVALS_BY_REVIEW,
  addDays,
  firstReviewDate,
  onReviewed,
};
