/* =====================================================================
   Quote pool. Short passages from public-domain literature and
   historical documents, bucketed by length the way monkeytype buckets
   its quote sets (short / medium / long / thicc).
   ===================================================================== */

(function () {
  const MT = (window.MT = window.MT || {});

  const raw = [
    ["Knowledge is power.", "Francis Bacon"],
    ["The unexamined life is not worth living.", "Socrates"],
    ["A room without books is like a body without a soul.", "Cicero"],
    ["Happiness depends upon ourselves.", "Aristotle"],
    ["Whatever you are, be a good one.", "Abraham Lincoln"],
    ["The journey of a thousand miles begins with one step.", "Lao Tzu"],
    ["No man is an island, entire of itself.", "John Donne"],
    ["Not all those who wander are lost.", "J. R. R. Tolkien"],
    ["There is no greater agony than bearing an untold story inside you.", "Maya Angelou"],
    ["Beauty is truth, truth beauty, that is all ye know on earth, and all ye need to know.", "John Keats"],
    ["The time is always right to do what is right.", "Martin Luther King Jr."],
    ["It is not in the stars to hold our destiny but in ourselves.", "William Shakespeare, Julius Caesar"],
    ["There is nothing either good or bad, but thinking makes it so.", "William Shakespeare, Hamlet"],
    ["The only way to get rid of a temptation is to yield to it.", "Oscar Wilde, The Picture of Dorian Gray"],
    ["We are all in the gutter, but some of us are looking at the stars.", "Oscar Wilde, Lady Windermere's Fan"],
    ["So we beat on, boats against the current, borne back ceaselessly into the past.", "F. Scott Fitzgerald, The Great Gatsby"],
    ["In the midst of winter, I found there was, within me, an invincible summer.", "Albert Camus"],
    ["Yesterday is but today's memory, and tomorrow is today's dream.", "Kahlil Gibran"],
    ["The world is full of magic things, patiently waiting for our senses to grow sharper.", "W. B. Yeats"],
    ["Do not go where the path may lead, go instead where there is no path and leave a trail.", "Ralph Waldo Emerson"],
    ["What lies behind us and what lies before us are tiny matters compared to what lies within us.", "Ralph Waldo Emerson"],
    ["Somewhere beyond the sea, the sun is setting on a day that will never come again.", "Anonymous"],
    ["Two roads diverged in a wood, and I took the one less travelled by, and that has made all the difference.", "Robert Frost, The Road Not Taken"],
    [
      "I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach.",
      "Henry David Thoreau, Walden",
    ],
    [
      "Because I could not stop for Death, he kindly stopped for me; the carriage held but just ourselves and immortality.",
      "Emily Dickinson",
    ],
    [
      "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the season of Light, it was the season of Darkness.",
      "Charles Dickens, A Tale of Two Cities",
    ],
    [
      "All happy families are alike; each unhappy family is unhappy in its own way.",
      "Leo Tolstoy, Anna Karenina",
    ],
    [
      "All the world's a stage, and all the men and women merely players. They have their exits and their entrances, and one man in his time plays many parts.",
      "William Shakespeare, As You Like It",
    ],
    [
      "To be, or not to be, that is the question: whether it is nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles.",
      "William Shakespeare, Hamlet",
    ],
    [
      "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families.",
      "Jane Austen, Pride and Prejudice",
    ],
    [
      "Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.",
      "Herman Melville, Moby-Dick",
    ],
    [
      "Once upon a midnight dreary, while I pondered, weak and weary, over many a quaint and curious volume of forgotten lore, while I nodded, nearly napping, suddenly there came a tapping, as of some one gently rapping, rapping at my chamber door.",
      "Edgar Allan Poe, The Raven",
    ],
    [
      "We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.",
      "United States Declaration of Independence",
    ],
    [
      "Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal. Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure.",
      "Abraham Lincoln, Gettysburg Address",
    ],
    [
      "I have a dream that one day this nation will rise up and live out the true meaning of its creed: that all men are created equal. I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.",
      "Martin Luther King Jr., Lincoln Memorial",
    ],
  ];

  const quotes = raw.map(function (q) {
    const words = q[0].trim().split(/\s+/);
    return { text: q[0].trim(), source: q[1], words: words.length };
  });

  function bucket(min, max) {
    return quotes.filter(function (q) {
      return q.words >= min && q.words <= max;
    });
  }

  MT.quotes = quotes;
  MT.quoteBuckets = {
    short: bucket(0, 14),
    medium: bucket(15, 34),
    long: bucket(35, 1000),
  };
  MT.quoteBuckets.thicc = MT.quotes.slice().sort(function (a, b) { return b.words - a.words; }).slice(0, 5);

  MT.getQuote = function (length) {
    let pool = MT.quoteBuckets[length];
    if (!pool || pool.length === 0) pool = MT.quotes;
    return pool[Math.floor(Math.random() * pool.length)];
  };
})();
