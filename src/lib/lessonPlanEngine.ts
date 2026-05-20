// Local CAPS-aligned lesson plan engine — no external API required.

interface TopicEntry {
  topic: string;
  subTopic: string;
  strand: string;
  priorKnowledge: string;
  objectives: string[];
  resources: string[];
  support: string;
  extension: string;
  homework: string;
}

// ─── CAPS Topic Database ──────────────────────────────────────────────────────

function parseGrade(grade: string): number {
  const m = grade.match(/\d+/);
  return m ? parseInt(m[0]) : 4;
}

function parseTerm(term: string): number {
  const m = term.match(/\d+/);
  return m ? parseInt(m[0]) : 1;
}

const MATHS_TOPICS: Record<number, Record<number, TopicEntry[]>> = {
  // Grade 1
  1: {
    1: [
      { topic: 'Number Concept', subTopic: 'Counting and ordering numbers 1–20', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners can count objects to 10 and recognise number symbols.', objectives: ['Count objects to 20 reliably', 'Order numbers from 1 to 20', 'Write number symbols 1–20', 'Identify one more and one less'], resources: ['Number line 1–20', 'Counters and manipulatives', 'CAPS-approved textbook', 'Number cards'], support: 'Provide physical counters and a printed number line. Pair learners with stronger peers.', extension: 'Ask learners to count in 2s to 20 and identify odd and even numbers.', homework: 'Write numbers 1–20 in a number grid and colour the even numbers.' },
      { topic: 'Number Concept', subTopic: 'Place value — tens and units (1–20)', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners can recognise and write numbers to 20.', objectives: ['Decompose numbers into tens and units', 'Use base-ten blocks to represent numbers', 'Compare numbers using greater than and less than', 'Read and write number names to 20'], resources: ['Base-ten blocks', 'Place value chart', 'Whiteboard', 'CAPS textbook'], support: 'Use concrete base-ten blocks and limit to numbers 1–10 before extending.', extension: 'Challenge learners to make all possible 2-digit numbers using digit cards 1, 2, 3.', homework: 'Draw base-ten blocks to show the numbers 13, 17, and 19.' },
    ],
    2: [
      { topic: 'Addition and Subtraction', subTopic: 'Addition up to 20 using number lines', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners know number order to 20 and can count on from any number.', objectives: ['Add two numbers with a sum up to 20', 'Use a number line to demonstrate addition', 'Write addition number sentences', 'Solve simple word problems involving addition'], resources: ['Number lines', 'Counters', 'Flashcards', 'CAPS textbook p. 45–52'], support: 'Allow learners to use counters. Focus on sums to 10 before extending to 20.', extension: 'Write 5 different addition sentences that all equal 20.', homework: 'Solve 5 addition word problems from the textbook.' },
    ],
    3: [
      { topic: 'Measurement', subTopic: 'Length — comparing and ordering objects', strand: 'Measurement', priorKnowledge: 'Learners can identify objects and compare sizes informally.', objectives: ['Compare lengths using longer, shorter, taller', 'Order three objects by length', 'Measure using non-standard units', 'Describe and record measurements'], resources: ['Rulers', 'String', 'Classroom objects', 'Recording sheet'], support: 'Focus on comparing only two objects at a time. Use hands-on measuring.', extension: 'Estimate lengths in centimetres before measuring.', homework: 'Measure 5 objects at home using hand spans and record results.' },
    ],
    4: [
      { topic: 'Data Handling', subTopic: 'Collecting and organising data', strand: 'Data Handling', priorKnowledge: 'Learners can sort objects into groups and count quantities.', objectives: ['Collect data from a class survey', 'Organise data in a tally table', 'Read information from a pictograph', 'Answer questions about data'], resources: ['Tally sheet', 'Pictograph template', 'Crayons', 'CAPS textbook'], support: 'Provide a pre-drawn tally sheet with headings. Support with counting.', extension: 'Create their own pictograph using a different data set.', homework: 'Survey 5 family members about a favourite colour and draw a pictograph.' },
    ],
  },
  // Grade 2
  2: {
    1: [
      { topic: 'Number Concept', subTopic: 'Counting, ordering and place value to 100', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners can count to 50 and understand tens and units.', objectives: ['Count to 100 in 1s, 2s, 5s and 10s', 'Write numbers to 100 in words and symbols', 'Identify place value of digits in 2-digit numbers', 'Order and compare numbers to 100'], resources: ['Hundred chart', 'Base-ten blocks', 'Number cards', 'CAPS textbook'], support: 'Use a hundred chart for counting patterns. Focus on counting in 10s first.', extension: 'Count backwards from 100. Find all multiples of 5 up to 100.', homework: 'Complete the hundred chart by filling in missing numbers.' },
    ],
    2: [
      { topic: 'Addition and Subtraction', subTopic: 'Adding and subtracting 2-digit numbers', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners can add and subtract single-digit numbers and understand place value to 100.', objectives: ['Add two 2-digit numbers without regrouping', 'Subtract a 1-digit number from a 2-digit number', 'Use column addition to organise calculations', 'Solve word problems involving addition and subtraction'], resources: ['Base-ten blocks', 'Column addition template', 'CAPS textbook', 'Whiteboard'], support: 'Use base-ten blocks for each step. Limit to addition without carrying.', extension: 'Solve addition problems that require regrouping (carrying).', homework: 'Complete 8 addition and subtraction problems from the textbook.' },
    ],
    3: [
      { topic: 'Fractions', subTopic: 'Halves and quarters of shapes and collections', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners understand sharing equally and can identify whole objects.', objectives: ['Identify half and quarter of a shape', 'Find half and quarter of a collection of objects', 'Write fraction notation ½ and ¼', 'Compare halves and quarters'], resources: ['Fraction circles', 'Paper for folding', 'Counters', 'CAPS textbook'], support: 'Use paper folding and physical sharing of objects.', extension: 'Find one-third and three-quarters of various quantities.', homework: 'Draw and colour half and one quarter of 5 different shapes.' },
    ],
    4: [
      { topic: 'Multiplication', subTopic: 'Multiplication as repeated addition (2, 5, 10)', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners can add repeatedly and understand grouping.', objectives: ['Understand multiplication as repeated addition', 'Recite and apply the 2, 5 and 10 times tables', 'Write multiplication number sentences', 'Solve multiplication word problems'], resources: ['Counters in groups', 'Multiplication grid', 'Flashcards', 'CAPS textbook'], support: 'Use arrays and repeated addition before moving to times tables.', extension: 'Solve mixed multiplication and addition problems.', homework: 'Practise the 2, 5 and 10 times tables by completing a multiplication table.' },
    ],
  },
  // Grade 3
  3: {
    1: [
      { topic: 'Number Concept', subTopic: 'Counting, ordering and place value to 999', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners can count to 200 and understand hundreds, tens and units.', objectives: ['Count in 2s, 3s, 5s, 10s, 25s and 100s', 'Read and write numbers to 999', 'Identify place value of each digit in 3-digit numbers', 'Order and compare 3-digit numbers'], resources: ['Place value chart (hundreds/tens/units)', 'Base-ten blocks', 'Number cards', 'CAPS textbook'], support: 'Use base-ten blocks extensively. Focus on hundreds and tens before units.', extension: 'Round numbers to the nearest 10 and nearest 100.', homework: 'Write the numbers 345, 678 and 912 in expanded notation and words.' },
      { topic: 'Addition and Subtraction', subTopic: 'Adding 3-digit numbers without regrouping', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners can add 2-digit numbers and understand place value to 999.', objectives: ['Add two 3-digit numbers using column addition', 'Use place value understanding to add hundreds, tens and units', 'Estimate answers before calculating', 'Solve contextual word problems'], resources: ['Base-ten blocks', 'Column addition template', 'CAPS textbook', 'Whiteboard'], support: 'Use base-ten blocks and work column by column separately.', extension: 'Add three 3-digit numbers. Investigate which arrangements give the largest sum.', homework: 'Solve 5 addition word problems involving 3-digit numbers.' },
    ],
    2: [
      { topic: 'Multiplication', subTopic: 'Multiplication tables 2, 3, 4, 5 and 10', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners understand multiplication as repeated addition and know the 2, 5 and 10 tables.', objectives: ['Recite the 3 and 4 times tables fluently', 'Apply multiplication tables to solve problems', 'Use multiplication to find totals in arrays', 'Identify and describe patterns in times tables'], resources: ['Multiplication grid', 'Flashcards', 'Counters in arrays', 'CAPS textbook'], support: 'Use arrays to build understanding before drilling tables. Focus on 3 times table first.', extension: 'Solve multi-step problems combining addition and multiplication.', homework: 'Practise the 3 and 4 times tables and shade multiples on a hundred chart.' },
    ],
    3: [
      { topic: 'Fractions', subTopic: 'Fractions — halves, thirds, quarters, fifths and eighths', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners can identify halves and quarters of shapes and collections.', objectives: ['Identify and name common fractions ½, ⅓, ¼, ⅕, ⅛', 'Partition shapes into equal parts', 'Find fractions of collections of objects', 'Compare fractions with the same denominator'], resources: ['Fraction strips', 'Fraction circles', 'Coloured counters', 'CAPS textbook'], support: 'Use fraction strips for concrete representation. Focus on halves and quarters first.', extension: 'Order fractions ⅛, ¼, ½ from smallest to largest with reasoning.', homework: 'Draw diagrams showing ⅓, ¼ and ½ of the same shape.' },
    ],
    4: [
      { topic: 'Data Handling', subTopic: 'Bar graphs and pictographs — collecting and interpreting data', strand: 'Data Handling', priorKnowledge: 'Learners can collect data using tallies and read simple graphs.', objectives: ['Collect data using a survey', 'Represent data in a bar graph', 'Read and interpret a bar graph', 'Answer questions using data from a graph'], resources: ['Graph paper', 'Ruler', 'Coloured pencils', 'CAPS textbook'], support: 'Provide a template bar graph with axes labelled. Guide data collection.', extension: 'Write 5 questions based on their graph and answer them using the data.', homework: 'Conduct a survey at home and draw a bar graph of the results.' },
    ],
  },
  // Grade 4
  4: {
    1: [
      { topic: 'Whole Numbers', subTopic: 'Ordering, comparing and place value to 9 999', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners understand place value to 999 and can order 3-digit numbers.', objectives: ['Read and write numbers to 9 999', 'Identify place value of digits in 4-digit numbers', 'Order and compare 4-digit numbers', 'Round numbers to the nearest 10, 100 and 1 000'], resources: ['Place value chart', 'Number cards', 'CAPS textbook', 'Whiteboard'], support: 'Use a place value chart with each column colour-coded.', extension: 'Research the population of local cities and order them from smallest to largest.', homework: 'Complete exercises on ordering and rounding 4-digit numbers.' },
      { topic: 'Whole Numbers', subTopic: 'Addition and subtraction of 4-digit numbers', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners can add and subtract 3-digit numbers with regrouping.', objectives: ['Add 4-digit numbers using standard algorithm', 'Subtract 4-digit numbers with regrouping', 'Estimate answers using rounding', 'Solve multi-step word problems'], resources: ['Squared paper for column work', 'Calculators for checking', 'CAPS textbook', 'Whiteboard'], support: 'Provide step-by-step column addition template. Allow use of calculator to check.', extension: 'Create and solve their own multi-step word problems.', homework: 'Solve 6 addition and subtraction problems involving 4-digit numbers.' },
    ],
    2: [
      { topic: 'Common Fractions', subTopic: 'Equivalent fractions and comparing fractions', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners can identify common fractions and find fractions of quantities.', objectives: ['Identify and generate equivalent fractions', 'Compare fractions using fraction strips', 'Order fractions with different denominators', 'Simplify fractions to lowest terms'], resources: ['Fraction strips', 'Fraction wall chart', 'CAPS textbook', 'Whiteboard'], support: 'Use fraction strips to show equivalence visually before abstract work.', extension: 'Find all fractions equivalent to ½ with denominators up to 20.', homework: 'Complete equivalent fractions exercises and draw fraction diagrams.' },
    ],
    3: [
      { topic: 'Properties of 2D Shapes', subTopic: 'Classifying and describing quadrilaterals and triangles', strand: 'Space and Shape', priorKnowledge: 'Learners can identify basic 2D shapes and know the names of common shapes.', objectives: ['Classify quadrilaterals by number of sides and angles', 'Identify and classify triangles by their properties', 'Measure angles using a protractor', 'Draw 2D shapes using a ruler and protractor'], resources: ['Protractors', 'Rulers', 'Set squares', 'CAPS textbook', 'Shape cut-outs'], support: 'Provide pre-drawn shapes for classification before learners draw their own.', extension: 'Investigate the angle sum of quadrilaterals and compare to triangles.', homework: 'Draw and label 5 different quadrilaterals showing all relevant properties.' },
    ],
    4: [
      { topic: 'Data Handling', subTopic: 'Collecting data and drawing bar and double bar graphs', strand: 'Data Handling', priorKnowledge: 'Learners can draw and interpret simple bar graphs.', objectives: ['Design a data collection instrument', 'Represent data in a bar graph with appropriate scale', 'Draw a double bar graph to compare two data sets', 'Calculate mode and median of a data set'], resources: ['Graph paper', 'Ruler', 'Coloured pencils', 'CAPS textbook'], support: 'Provide a pre-scaled axis template. Support with calculating mode.', extension: 'Write a paragraph interpreting their graph and making predictions.', homework: 'Collect data at home and draw a double bar graph comparing two categories.' },
    ],
  },
  // Grade 5
  5: {
    1: [
      { topic: 'Whole Numbers', subTopic: 'Place value, ordering and rounding to 999 999', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners understand place value to 9 999 and can order and round 4-digit numbers.', objectives: ['Read and write numbers to 999 999', 'Determine place value of digits in 6-digit numbers', 'Round numbers to nearest 1 000 and 10 000', 'Use number properties (commutative, associative) in calculations'], resources: ['Place value chart', 'Number cards', 'Calculator', 'CAPS textbook'], support: 'Colour-code each place value column. Use real-world contexts like populations.', extension: 'Write numbers in expanded notation and investigate patterns in multiples.', homework: 'Write 5 large numbers in expanded notation and round to the nearest 1 000.' },
    ],
    2: [
      { topic: 'Decimal Fractions', subTopic: 'Introducing tenths and hundredths', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners understand common fractions and place value to 999 999.', objectives: ['Understand tenths and hundredths as decimal fractions', 'Convert between common fractions and decimals', 'Order decimal fractions', 'Add and subtract decimal fractions'], resources: ['Decimal fraction strips', 'Place value chart extended to hundredths', 'CAPS textbook', 'Rulers'], support: 'Use fraction strips divided into 10 and 100 parts for visual support.', extension: 'Convert rand and cents to decimal notation and calculate change.', homework: 'Complete decimal ordering and conversion exercises from the textbook.' },
    ],
    3: [
      { topic: 'Area and Perimeter', subTopic: 'Calculating area and perimeter of rectangles', strand: 'Measurement', priorKnowledge: 'Learners can measure length in cm and mm and understand multiplication.', objectives: ['Calculate perimeter of rectangles and squares', 'Calculate area using length × breadth', 'Distinguish between area and perimeter', 'Solve problems involving area and perimeter'], resources: ['Rulers', 'Squared paper', 'Measuring tapes', 'CAPS textbook'], support: 'Provide a formula sheet. Use squared paper to count squares for area.', extension: 'Find rectangles with the same perimeter but different areas.', homework: 'Measure 3 rectangular objects at home and calculate their area and perimeter.' },
    ],
    4: [
      { topic: 'Data Handling', subTopic: 'Mean, median and mode of data sets', strand: 'Data Handling', priorKnowledge: 'Learners can draw bar graphs and identify the most frequent value.', objectives: ['Calculate the mean (average) of a data set', 'Determine the median of an ordered data set', 'Identify the mode', 'Compare and interpret mean, median and mode'], resources: ['Calculator', 'Data sets on worksheets', 'Graph paper', 'CAPS textbook'], support: 'Provide step-by-step calculation guides for each measure.', extension: 'Investigate how an outlier affects the mean but not the median.', homework: 'Find the mean, median and mode of the ages of 10 family members.' },
    ],
  },
  // Grade 6
  6: {
    1: [
      { topic: 'Whole Numbers', subTopic: 'Multiples, factors, prime numbers and prime factorisation', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners know multiplication tables to 12 and can divide with remainders.', objectives: ['Find multiples and factors of whole numbers', 'Identify prime and composite numbers', 'Determine the HCF and LCM of two numbers', 'Express numbers as products of prime factors'], resources: ['Multiplication grid', 'Sieve of Eratosthenes worksheet', 'CAPS textbook', 'Calculator'], support: 'Provide a list of prime numbers to 50. Start with factors before prime factorisation.', extension: 'Apply HCF and LCM to solve real-life problems involving tiling or scheduling.', homework: 'Find the prime factorisation of 6 numbers and determine their HCF and LCM.' },
    ],
    2: [
      { topic: 'Percentage', subTopic: 'Converting fractions and decimals to percentages', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners understand fractions and decimals and can multiply by 100.', objectives: ['Convert fractions and decimals to percentages', 'Calculate percentages of quantities', 'Solve problems involving percentage increase and decrease', 'Apply percentage to real-life contexts (discounts, marks)'], resources: ['Calculator', 'Percentage wheel', 'Real advertisements showing discounts', 'CAPS textbook'], support: 'Provide a conversion chart and focus on benchmark percentages (50%, 25%, 10%).', extension: 'Calculate compound interest and compare simple vs compound interest.', homework: 'Find 3 items on sale and calculate the discount and sale price.' },
    ],
    3: [
      { topic: 'Properties of 3D Objects', subTopic: 'Nets, faces, edges and vertices', strand: 'Space and Shape', priorKnowledge: 'Learners can identify common 3D shapes and their properties.', objectives: ['Identify 3D objects from their nets', 'Count and record faces, edges and vertices', 'Draw and construct nets of prisms and pyramids', 'Apply Euler\'s formula (V + F − E = 2)'], resources: ['3D shape models', 'Net templates', 'Scissors and glue', 'CAPS textbook'], support: 'Provide pre-drawn nets for folding. Use physical models for counting.', extension: 'Design a box using a net and calculate its surface area.', homework: 'Draw the net of a rectangular prism and label all faces.' },
    ],
    4: [
      { topic: 'Probability', subTopic: 'Introducing probability — likelihood of events', strand: 'Data Handling', priorKnowledge: 'Learners understand fractions and can collect and interpret data.', objectives: ['Describe the probability of events using words and fractions', 'List outcomes of simple experiments', 'Distinguish between experimental and theoretical probability', 'Conduct probability experiments and record results'], resources: ['Coins', 'Dice', 'Coloured balls in a bag', 'CAPS textbook'], support: 'Focus on certain, impossible, likely and unlikely before fractions.', extension: 'Design a fair and an unfair game and explain why one is biased.', homework: 'Flip a coin 30 times, record results and compare to theoretical probability.' },
    ],
  },
  // Grade 7
  7: {
    1: [
      { topic: 'Integers', subTopic: 'Ordering, adding and subtracting integers', strand: 'Numbers, Operations and Relationships', priorKnowledge: 'Learners understand whole numbers and number lines.', objectives: ['Represent integers on a number line', 'Order integers from negative to positive', 'Add and subtract integers using rules', 'Solve real-life problems involving integers'], resources: ['Number line (integers)', 'Thermometer diagram', 'CAPS textbook', 'Whiteboard'], support: 'Use a thermometer and number line to build intuition before rules.', extension: 'Multiply integers and explore patterns to derive the rules for signs.', homework: 'Solve 10 integer addition and subtraction problems from the textbook.' },
    ],
    2: [
      { topic: 'Algebraic Expressions', subTopic: 'Writing and simplifying algebraic expressions', strand: 'Patterns, Functions and Algebra', priorKnowledge: 'Learners understand numeric patterns and can work with variables.', objectives: ['Identify terms, coefficients and constants in expressions', 'Collect like terms to simplify expressions', 'Substitute values into expressions', 'Translate word problems into algebraic expressions'], resources: ['Algebra tiles', 'CAPS textbook', 'Whiteboard', 'Worksheets'], support: 'Use algebra tiles for concrete representation. Colour-code like terms.', extension: 'Expand and simplify expressions with brackets.', homework: 'Simplify 8 algebraic expressions and evaluate each for x = 3.' },
    ],
    3: [
      { topic: 'Geometry of Straight Lines', subTopic: 'Angles formed by intersecting and parallel lines', strand: 'Space and Shape', priorKnowledge: 'Learners can measure angles and know angle types (acute, obtuse, reflex).', objectives: ['Identify vertically opposite, supplementary and complementary angles', 'Identify corresponding, alternate and co-interior angles', 'Calculate unknown angles using geometric reasoning', 'Write geometric proofs with reasons'], resources: ['Protractors', 'Rulers', 'Angle diagram worksheets', 'CAPS textbook'], support: 'Provide colour-coded diagrams of angle pairs. Give sentence frames for reasons.', extension: 'Solve multi-step angle problems involving 3 or more parallel lines.', homework: 'Calculate all missing angles in 3 diagrams involving parallel lines and transversals.' },
    ],
    4: [
      { topic: 'Data Handling', subTopic: 'Measures of central tendency and spread', strand: 'Data Handling', priorKnowledge: 'Learners can calculate mean, median and mode and draw bar graphs.', objectives: ['Calculate mean, median, mode and range', 'Determine quartiles of ordered data', 'Draw and interpret a stem-and-leaf plot', 'Identify outliers and their effect on data measures'], resources: ['Calculator', 'Stem-and-leaf template', 'CAPS textbook', 'Data sets'], support: 'Provide ordered data sets and a step-by-step guide to quartiles.', extension: 'Draw a box-and-whisker plot and compare two data sets.', homework: 'Collect the daily temperatures for one week and calculate all measures of central tendency.' },
    ],
  },
};

const ENGLISH_TOPICS: Record<number, Record<number, TopicEntry[]>> = {
  1: {
    1: [{ topic: 'Phonics and Phonemic Awareness', subTopic: 'Initial consonant sounds and short vowel sounds', strand: 'Reading and Phonics', priorKnowledge: 'Learners recognise letter names and some letter sounds.', objectives: ['Identify initial consonant sounds in spoken words', 'Blend CVC words using short vowel sounds', 'Match letters to sounds', 'Read simple CVC words'], resources: ['Alphabet cards', 'Word family charts', 'Decodable readers', 'CAPS-approved reader'], support: 'Use picture clues alongside phonics. Focus on 3 sounds per lesson.', extension: 'Sort words into word families and create new words by changing the initial sound.', homework: 'Read 10 CVC words aloud to a family member and write them in a book.' }],
    2: [{ topic: 'Reading Comprehension', subTopic: 'Answering literal questions about a picture story', strand: 'Reading and Viewing', priorKnowledge: 'Learners can read simple sentences and follow a picture sequence.', objectives: ['Read a short illustrated story with support', 'Answer who, what and where questions', 'Retell the story in correct sequence', 'Identify the main character'], resources: ['Big book or class reader', 'Story sequence cards', 'CAPS reader', 'Comprehension worksheet'], support: 'Read the story aloud to learners first. Provide picture cues for sequencing.', extension: 'Write a different ending for the story and draw a picture.', homework: 'Read the story again at home and draw the most important event.' }],
    3: [{ topic: 'Writing', subTopic: 'Writing simple sentences using a picture prompt', strand: 'Writing and Presenting', priorKnowledge: 'Learners can write their name and copy simple sentences.', objectives: ['Write 2–3 simple sentences about a picture', 'Use capital letters at the start and full stops at the end', 'Spell high-frequency words correctly', 'Use adjectives to describe what they see'], resources: ['Picture prompt cards', 'Word wall', 'Writing books', 'CAPS textbook'], support: 'Provide a sentence frame: "I can see a ___." Allow tracing of key words.', extension: 'Write a full paragraph of 5 sentences with a heading.', homework: 'Write 3 sentences about their family and draw a picture.' }],
    4: [{ topic: 'Listening and Speaking', subTopic: 'Show and Tell — speaking clearly about a topic', strand: 'Listening and Speaking', priorKnowledge: 'Learners can speak in simple sentences and listen to instructions.', objectives: ['Speak clearly and loudly enough for the class to hear', 'Stay on topic for 2–3 sentences', 'Listen respectfully while others speak', 'Ask a question about what they heard'], resources: ['Show-and-tell objects from home', 'Speaking rubric', 'CAPS guidelines', 'Timer'], support: 'Allow learners to show a picture instead of an object. Provide sentence starters.', extension: 'Give a 1-minute presentation with an introduction, middle and conclusion.', homework: 'Practise their show-and-tell speech at home to a family member.' }],
  },
  4: {
    1: [{ topic: 'Reading and Viewing', subTopic: 'Reading a narrative text — identifying theme and character', strand: 'Reading and Viewing', priorKnowledge: 'Learners can read fluently and answer literal comprehension questions.', objectives: ['Identify the theme of a narrative text', 'Describe character traits using evidence from the text', 'Distinguish between literal and inferential meaning', 'Use context clues to determine meaning of unfamiliar words'], resources: ['Class novel or CAPS reader', 'Comprehension worksheet', 'Dictionary', 'CAPS textbook'], support: 'Read the text aloud first. Provide a glossary of difficult words.', extension: 'Write a character analysis comparing two characters in the text.', homework: 'Read the next chapter and list 5 adjectives that describe the main character.' }],
    2: [{ topic: 'Writing', subTopic: 'Narrative writing — planning and drafting a short story', strand: 'Writing and Presenting', priorKnowledge: 'Learners can write in paragraphs and use punctuation correctly.', objectives: ['Plan a story using a story map (beginning, middle, end)', 'Write an engaging introduction with a setting and characters', 'Use dialogue correctly with speech marks', 'Draft a 2-paragraph story with descriptive language'], resources: ['Story map template', 'Word bank (adjectives, verbs)', 'CAPS textbook', 'Writing books'], support: 'Provide a detailed story map template and sentence starters for each section.', extension: 'Add a twist or surprise ending and use figurative language (similes).', homework: 'Complete the story draft and read it aloud to check for fluency.' }],
    3: [{ topic: 'Language Structures', subTopic: 'Nouns, verbs and adjectives — identification and use', strand: 'Language Structures and Conventions', priorKnowledge: 'Learners know that words have different jobs in a sentence.', objectives: ['Identify nouns, verbs and adjectives in sentences', 'Use adjectives to improve descriptive writing', 'Form plurals of regular and irregular nouns', 'Apply subject-verb agreement in sentences'], resources: ['Colour-coded grammar posters', 'Grammar worksheets', 'CAPS textbook', 'Whiteboard'], support: 'Use colour coding: nouns = blue, verbs = red, adjectives = green.', extension: 'Rewrite dull sentences by adding powerful adjectives and strong verbs.', homework: 'Write 5 sentences and colour-code all nouns, verbs and adjectives.' }],
    4: [{ topic: 'Transactional Writing', subTopic: 'Writing a formal letter', strand: 'Writing and Presenting', priorKnowledge: 'Learners can write in paragraphs and understand formal and informal language.', objectives: ['Identify the format and features of a formal letter', 'Write a formal letter with correct layout', 'Use appropriate formal language and register', 'Proofread for errors in punctuation and spelling'], resources: ['Sample formal letter', 'Letter template', 'CAPS textbook', 'Writing books'], support: 'Provide a completed sample letter as a model. Use a checklist for format.', extension: 'Write a letter of complaint and suggest a solution to the problem.', homework: 'Write a formal letter applying for a school position of responsibility.' }],
  },
  7: {
    1: [{ topic: 'Reading Comprehension', subTopic: 'Critical reading — fact, opinion and bias in media texts', strand: 'Reading and Viewing', priorKnowledge: 'Learners can identify main ideas and themes in a text.', objectives: ['Distinguish between fact and opinion in a media text', 'Identify bias and the author\'s purpose', 'Analyse language used to persuade the reader', 'Evaluate the reliability of a source'], resources: ['Newspaper articles', 'Advertisements', 'CAPS textbook', 'Comprehension worksheet'], support: 'Provide a fact/opinion sorting chart and key words that signal opinions.', extension: 'Rewrite a biased article from a neutral perspective.', homework: 'Find a newspaper article, highlight 3 facts and 3 opinions.' }],
    2: [{ topic: 'Essay Writing', subTopic: 'Discursive essay — arguing both sides of an issue', strand: 'Writing and Presenting', priorKnowledge: 'Learners can write in paragraphs with a clear argument.', objectives: ['Plan a discursive essay using a for-and-against table', 'Write an introduction that presents both sides', 'Develop arguments with evidence and examples', 'Write a balanced conclusion without expressing personal opinion'], resources: ['Essay structure template', 'Persuasive language word bank', 'CAPS textbook', 'Writing books'], support: 'Provide sentence frames for introducing arguments and counterarguments.', extension: 'Include statistics and quotes to strengthen arguments.', homework: 'Complete the first draft of a discursive essay on a given topic.' }],
    3: [{ topic: 'Language Structures', subTopic: 'Tenses — simple, progressive and perfect tenses', strand: 'Language Structures and Conventions', priorKnowledge: 'Learners know simple past and present tense.', objectives: ['Identify and use simple, progressive and perfect tenses', 'Convert sentences between tenses accurately', 'Use tenses consistently within a paragraph', 'Understand the purpose of each tense in writing'], resources: ['Tense timeline diagram', 'Grammar worksheet', 'CAPS textbook', 'Whiteboard'], support: 'Use a timeline to show when events happen for each tense.', extension: 'Write a paragraph in each tense and explain the effect of changing tense.', homework: 'Rewrite a paragraph from the textbook changing all verbs from past to present perfect tense.' }],
    4: [{ topic: 'Oral Presentation', subTopic: 'Prepared speech — structuring and delivering a 3-minute speech', strand: 'Listening and Speaking', priorKnowledge: 'Learners can speak in paragraphs and have experience with show-and-tell.', objectives: ['Structure a speech with introduction, body and conclusion', 'Use rhetorical devices to engage the audience', 'Speak clearly with appropriate pace and volume', 'Respond to questions about the speech'], resources: ['Speech planning template', 'Rhetorical devices reference card', 'Timer', 'CAPS guidelines'], support: 'Allow cue cards. Reduce speech length to 90 seconds for support learners.', extension: 'Incorporate a visual aid and use at least 3 different rhetorical devices.', homework: 'Practise the speech in front of a mirror for timing and expression.' }],
  },
};

const LIFE_SKILLS_TOPICS: Record<number, Record<number, TopicEntry[]>> = {
  1: {
    1: [{ topic: 'Personal and Social Well-being', subTopic: 'My body — identifying body parts and personal hygiene', strand: 'Personal and Social Well-being', priorKnowledge: 'Learners can name basic body parts.', objectives: ['Name and locate major external body parts', 'Explain the importance of daily hygiene', 'Demonstrate correct hand-washing technique', 'Identify safe and unsafe touch'], resources: ['Body outline diagram', 'Soap and water demonstration', 'CAPS textbook', 'Storybook about healthy habits'], support: 'Use a labelled body diagram. Role-play hygiene routines.', extension: 'Create a personal hygiene schedule for a week.', homework: 'Draw yourself and label 10 body parts correctly.' }],
    2: [{ topic: 'Physical Education', subTopic: 'Movement — running, jumping and balancing', strand: 'Physical Education', priorKnowledge: 'Learners can walk, run and jump safely.', objectives: ['Demonstrate controlled running and jumping', 'Balance on one foot for 5 seconds', 'Follow movement instructions in a sequence', 'Cooperate with peers during movement activities'], resources: ['Open space/hall', 'Cones and markers', 'Music for movement', 'CAPS guidelines'], support: 'Allow learners to hold a wall for balance. Simplify sequences to 2 steps.', extension: 'Create and perform their own 4-step movement sequence.', homework: 'Practise hopping on each foot 10 times and skipping for 1 minute.' }],
    3: [{ topic: 'Creative Arts', subTopic: 'Visual Art — drawing and colour mixing', strand: 'Creative Arts', priorKnowledge: 'Learners can hold a pencil and use primary colours.', objectives: ['Identify primary and secondary colours', 'Mix primary colours to make secondary colours', 'Draw a simple picture using observation', 'Name the art elements used in their picture (line, colour, shape)'], resources: ['Tempera paints', 'Mixing palette', 'Drawing paper', 'CAPS textbook'], support: 'Provide a colour wheel reference. Limit to mixing 2 colours at a time.', extension: 'Mix tints by adding white and shades by adding black.', homework: 'Draw a rainbow and label the colours in order.' }],
  },
  4: {
    1: [{ topic: 'Physical Education', subTopic: 'Athletics — running, throwing and jumping techniques', strand: 'Physical Education', priorKnowledge: 'Learners have basic gross motor skills and understand fair play.', objectives: ['Demonstrate correct running technique', 'Throw a ball using overarm technique', 'Perform a standing broad jump safely', 'Measure and record distances for personal improvement'], resources: ['Open field', 'Measuring tape', 'Balls (various)', 'CAPS guidelines'], support: 'Break each skill into smaller steps. Allow repeated practice before measurement.', extension: 'Set personal improvement targets and track performance over 4 weeks.', homework: 'Practise throwing and catching with a family member for 10 minutes.' }],
    2: [{ topic: 'Social and Environmental Responsibility', subTopic: 'Environmental issues — waste management and recycling', strand: 'Personal and Social Well-being', priorKnowledge: 'Learners understand that waste affects the environment.', objectives: ['Identify types of waste and their impact', 'Explain the concept of reduce, reuse, recycle', 'Sort waste into correct recycling categories', 'Plan a class recycling project'], resources: ['Recycling bins (paper, plastic, glass)', 'Posters on waste management', 'CAPS textbook', 'Local newspaper articles'], support: 'Provide a sorting chart with pictures of items and their recycling category.', extension: 'Calculate how much waste their household produces per week and suggest reductions.', homework: 'Sort household waste for one day and report on what was recyclable.' }],
  },
};

const NATURAL_SCIENCES_TOPICS: Record<number, Record<number, TopicEntry[]>> = {
  4: {
    1: [{ topic: 'Life and Living', subTopic: 'Habitats — where plants and animals live', strand: 'Life and Living', priorKnowledge: 'Learners can name common plants and animals and their basic needs.', objectives: ['Define the term habitat', 'Describe three different habitats (forest, wetland, grassland)', 'Explain how plants and animals are adapted to their habitats', 'Identify threats to habitats and suggest solutions'], resources: ['Habitat posters', 'CAPS textbook', 'Video clips of habitats', 'Nature magazines'], support: 'Provide a table with headings to sort animals and plants by habitat.', extension: 'Research an endangered species, its habitat and why it is threatened.', homework: 'Draw and label a habitat of your choice showing at least 5 organisms.' }],
    2: [{ topic: 'Matter and Materials', subTopic: 'Properties of materials — hardness, flexibility and transparency', strand: 'Matter and Materials', priorKnowledge: 'Learners can name common materials and describe their appearance.', objectives: ['Test and describe materials using hardness, flexibility and transparency', 'Match materials to their uses based on properties', 'Record results of investigations in a table', 'Draw conclusions from observations'], resources: ['Assorted materials (wood, plastic, metal, fabric, glass)', 'Testing worksheet', 'Magnifying glass', 'CAPS textbook'], support: 'Focus on two properties at a time. Provide a completed example row in the table.', extension: 'Design a product and justify the choice of materials used.', homework: 'Find 5 objects at home and describe 3 properties of each.' }],
    3: [{ topic: 'Energy and Change', subTopic: 'Sound — sources, pitch and volume', strand: 'Energy and Change', priorKnowledge: 'Learners know that sound is produced by vibrations.', objectives: ['Identify and describe various sources of sound', 'Compare sounds in terms of pitch and volume', 'Demonstrate how pitch changes with tension and length', 'Investigate how sound travels through different materials'], resources: ['Rubber bands of different sizes', 'Tuning forks', 'Rulers', 'CAPS textbook'], support: 'Provide a pitch/volume chart with examples. Use demos before learner investigations.', extension: 'Research ultrasound and its use in medicine.', homework: 'List 10 sounds heard at home and classify them by pitch (high/low) and volume (loud/soft).' }],
    4: [{ topic: 'Earth and Beyond', subTopic: 'The Solar System — planets and their properties', strand: 'Earth and Beyond', priorKnowledge: 'Learners know that the Earth orbits the Sun and the Moon orbits the Earth.', objectives: ['Name and order the 8 planets in the Solar System', 'Describe key properties of each planet', 'Explain the difference between rotation and revolution', 'Calculate scaled distances between planets'], resources: ['Solar System poster', 'Scale model materials', 'CAPS textbook', 'Ruler'], support: 'Use a mnemonic for planet order and a large-print reference chart.', extension: 'Research current space missions and present findings to the class.', homework: 'Draw and label the Solar System to scale and write 3 facts about each planet.' }],
  },
  7: {
    1: [{ topic: 'Life and Living', subTopic: 'The Cell — structure and function', strand: 'Life and Living', priorKnowledge: 'Learners understand that living things are made of matter and need nutrients.', objectives: ['Identify cell organelles in an animal and plant cell', 'Explain the function of the nucleus, cell membrane and chloroplasts', 'Distinguish between plant and animal cells', 'Draw and label a plant and animal cell'], resources: ['Microscope or prepared slides', 'Cell diagram worksheets', 'CAPS textbook', 'Onion cells demo'], support: 'Provide a labelled diagram to copy and colour before learners draw from scratch.', extension: 'Prepare an onion epidermal slide and observe under microscope.', homework: 'Draw and label both cell types, highlighting 3 key differences.' }],
    2: [{ topic: 'Matter and Materials', subTopic: 'Separating mixtures — filtration, evaporation and distillation', strand: 'Matter and Materials', priorKnowledge: 'Learners understand mixtures and solutions and know that particles have different sizes.', objectives: ['Identify the appropriate method for separating a given mixture', 'Set up and conduct a filtration experiment', 'Explain how evaporation separates a dissolved solid from a liquid', 'Record and interpret experimental results'], resources: ['Filter paper', 'Funnels', 'Beakers', 'Salt water', 'CAPS textbook'], support: 'Provide a flow chart for choosing a separation technique.', extension: 'Research how water treatment plants purify drinking water.', homework: 'Write up the filtration experiment in full scientific format.' }],
  },
};

const SOCIAL_SCIENCES_TOPICS: Record<number, Record<number, TopicEntry[]>> = {
  4: {
    1: [{ topic: 'History', subTopic: 'Local history — how our community has changed over time', strand: 'History', priorKnowledge: 'Learners can place events in chronological order and understand the concept of the past.', objectives: ['Identify changes in the local community over time using sources', 'Use photographs and maps as historical sources', 'Sequence events in a community timeline', 'Explain reasons for changes in the community'], resources: ['Old and new photographs of the community', 'Maps', 'CAPS textbook', 'Interview questions sheet'], support: 'Provide a completed timeline template with some events filled in.', extension: 'Interview an elderly community member about changes they have witnessed.', homework: 'Find two old photographs of your community and describe what has changed.' }],
    2: [{ topic: 'Geography', subTopic: 'Maps and mapping — using a compass and grid references', strand: 'Geography', priorKnowledge: 'Learners can identify basic map features (key, scale, title).', objectives: ['Use the 4 cardinal directions on a compass', 'Locate places using a grid reference', 'Draw a simple map of the classroom with a key', 'Describe a route using directional language'], resources: ['Compasses', 'Grid maps', 'CAPS textbook', 'Rulers'], support: 'Use physical compasses and a simple A3 map. Focus on N, S, E, W only.', extension: 'Use 8-point compass directions and find grid references on a topographic map.', homework: 'Draw a map of your home showing routes to at least 3 rooms.' }],
  },
  7: {
    1: [{ topic: 'History', subTopic: 'Resistance to colonialism — African responses to European rule', strand: 'History', priorKnowledge: 'Learners understand the concept of colonialism and know that South Africa was colonised.', objectives: ['Explain why African communities resisted colonial rule', 'Describe two examples of African resistance', 'Analyse a primary source related to resistance', 'Evaluate the effectiveness of different resistance strategies'], resources: ['Primary source extracts', 'Maps of colonial Africa', 'CAPS textbook', 'Timeline'], support: 'Provide guided questions for source analysis and a list of key vocabulary.', extension: 'Write a speech from the perspective of an African leader calling for resistance.', homework: 'Write a paragraph explaining one form of resistance and its outcome.' }],
    2: [{ topic: 'Geography', subTopic: 'Climate and biomes of Africa', strand: 'Geography', priorKnowledge: 'Learners understand the water cycle and basic climate concepts.', objectives: ['Identify the major biomes of Africa', 'Describe the characteristics of each biome', 'Explain how climate determines the biome in an area', 'Analyse a climate graph for an African city'], resources: ['Biome map of Africa', 'Climate graph examples', 'CAPS textbook', 'Coloured pencils'], support: 'Provide a biome description chart to match with map areas.', extension: 'Compare two biomes and explain how animals have adapted to each.', homework: 'Draw and label a climate graph for your nearest major city.' }],
  },
};

const XITSONGA_TOPICS: Record<number, Record<number, TopicEntry[]>> = {
  1: {
    1: [{ topic: 'Ku Hlaya na ku Twisisa', subTopic: 'Ku hlaya marito ya ntlawa — CVC words', strand: 'Reading and Phonics', priorKnowledge: 'Learners know the Xitsonga alphabet and basic letter sounds.', objectives: ['Read simple Xitsonga CVC words aloud', 'Match written words to pictures', 'Blend consonant and vowel sounds to read words', 'Identify initial letters in spoken Xitsonga words'], resources: ['Xitsonga alphabet chart', 'Word-picture cards', 'CAPS-approved Xitsonga reader', 'Whiteboard'], support: 'Use picture clues alongside words. Repeat sounds in chorus before individual reading.', extension: 'Write 5 new Xitsonga CVC words and illustrate them.', homework: 'Read 10 Xitsonga words to a family member and draw pictures for each.' }],
    2: [{ topic: 'Ku Vulavula', subTopic: 'Ku landzelela swivonelo — following and giving instructions', strand: 'Listening and Speaking', priorKnowledge: 'Learners can listen and follow simple single-step instructions in Xitsonga.', objectives: ['Follow 2-step instructions in Xitsonga', 'Give simple instructions to a classmate', 'Use polite language (ndza kombela, ndza khensa)', 'Speak in short Xitsonga sentences'], resources: ['Instruction card game', 'Classroom objects', 'CAPS textbook', 'Xitsonga picture dictionary'], support: 'Demonstrate each instruction physically before asking learners to follow.', extension: 'Write 3 instructions for a classroom game in Xitsonga.', homework: 'Practise giving family members 3 instructions in Xitsonga.' }],
  },
  4: {
    1: [{ topic: 'Ku Hlaya na ku Twisisa', subTopic: 'Ku twisisa swihlawulekisi swa swihlovo', strand: 'Reading Comprehension', priorKnowledge: 'Learners can read Xitsonga texts fluently and answer literal questions.', objectives: ['Read a Xitsonga text independently', 'Identify the main idea and supporting details', 'Answer literal and inferential questions in Xitsonga', 'Define unfamiliar Xitsonga words using context'], resources: ['CAPS-approved Xitsonga reader', 'Comprehension worksheet', 'Xitsonga dictionary', 'CAPS textbook'], support: 'Read the text aloud first. Provide a Xitsonga-English glossary for difficult words.', extension: 'Write a summary of the text in 5 Xitsonga sentences.', homework: 'Read the text again and answer 5 comprehension questions in full Xitsonga sentences.' }],
    2: [{ topic: 'Ku Tsala', subTopic: 'Ku tsala nchava ya xikombelo — writing a short narrative', strand: 'Writing', priorKnowledge: 'Learners can write simple Xitsonga sentences and paragraphs.', objectives: ['Plan a short narrative in Xitsonga using a story map', 'Write an introduction, middle and end in Xitsonga', 'Use correct Xitsonga punctuation and spelling', 'Use Xitsonga adjectives and action words'], resources: ['Story map template', 'Xitsonga word bank', 'CAPS textbook', 'Writing books'], support: 'Provide sentence starters in Xitsonga for each paragraph.', extension: 'Include dialogue in the narrative using correct speech conventions.', homework: 'Complete the Xitsonga narrative and read it to a family member.' }],
  },
};

// ─── Generic fallback topics ──────────────────────────────────────────────────

function getGenericTopics(subject: string, gradeNum: number, termNum: number, totalWeeks: number): TopicEntry[] {
  const isLanguage = /english|xitsonga|afrikaans|zulu|sotho|swati|venda|ndebele|tsonga|language/i.test(subject);
  const isMaths = /math|mathematics/i.test(subject);
  const isScience = /science|physics|chemistry|biology/i.test(subject);

  if (isMaths) {
    return Array.from({ length: totalWeeks }, (_, i) => ({
      topic: `Mathematics: Term ${termNum} Topic ${i + 1}`,
      subTopic: `Developing number sense, operations and problem-solving for Grade ${gradeNum}`,
      strand: 'Numbers, Operations and Relationships',
      priorKnowledge: `Learners have a foundation in Grade ${gradeNum} mathematics from previous terms.`,
      objectives: [
        'Apply mathematical concepts to solve grade-appropriate problems',
        'Demonstrate understanding through multiple representations',
        'Explain reasoning using mathematical language',
        'Connect new knowledge to prior learning'
      ],
      resources: ['CAPS-approved Mathematics textbook', 'Manipulatives', 'Calculator', 'Whiteboard and markers'],
      support: 'Use concrete materials and worked examples. Reduce complexity where needed.',
      extension: 'Apply the concept in a real-life problem-solving context.',
      homework: 'Complete the relevant exercises from the CAPS textbook.'
    }));
  }

  if (isLanguage) {
    const skills = ['Listening and Speaking', 'Reading and Comprehension', 'Writing', 'Language Structures'];
    return Array.from({ length: totalWeeks }, (_, i) => ({
      topic: skills[i % 4],
      subTopic: `Developing ${skills[i % 4].toLowerCase()} skills for Grade ${gradeNum} ${subject}`,
      strand: skills[i % 4],
      priorKnowledge: `Learners have developed basic language skills in ${subject} from previous terms.`,
      objectives: [
        `Demonstrate competence in ${skills[i % 4].toLowerCase()}`,
        'Apply language structures correctly in context',
        'Build vocabulary using grade-appropriate texts',
        'Communicate effectively in various forms'
      ],
      resources: [`CAPS-approved ${subject} reader`, 'Dictionary', 'CAPS textbook', 'Writing books'],
      support: 'Provide scaffolded activities with sentence frames and word banks.',
      extension: 'Extend the activity into a more complex genre or form.',
      homework: `Complete a ${skills[i % 4].toLowerCase()} activity from the CAPS textbook.`
    }));
  }

  return Array.from({ length: totalWeeks }, (_, i) => ({
    topic: `${subject} — Term ${termNum}, Week ${i + 1}`,
    subTopic: `Exploring concepts and skills in ${subject} for Grade ${gradeNum}`,
    strand: `${subject} Core Content`,
    priorKnowledge: `Learners have background knowledge from previous ${subject} lessons.`,
    objectives: [
      `Understand and apply core ${subject} concepts`,
      'Engage in structured investigation or practice activities',
      'Record and communicate findings clearly',
      'Connect learning to real-life contexts'
    ],
    resources: [`CAPS-approved ${subject} textbook`, 'Worksheets', 'Whiteboard', 'Reference materials'],
    support: 'Simplify tasks and provide additional worked examples.',
    extension: 'Research an extension topic and present findings to the class.',
    homework: `Complete the assigned ${subject} activity and review today's notes.`
  }));
}

// ─── Topic lookup ─────────────────────────────────────────────────────────────

function getTopicEntry(
  subject: string,
  gradeNum: number,
  termNum: number,
  weekIndex: number,
  customTopic?: string
): TopicEntry {
  const subjectKey = subject.toLowerCase();

  let db: Record<number, Record<number, TopicEntry[]>> | null = null;

  if (/math/i.test(subjectKey)) db = MATHS_TOPICS;
  else if (/english/i.test(subjectKey)) db = ENGLISH_TOPICS;
  else if (/life skills?/i.test(subjectKey)) db = LIFE_SKILLS_TOPICS;
  else if (/natural science/i.test(subjectKey)) db = NATURAL_SCIENCES_TOPICS;
  else if (/social science/i.test(subjectKey)) db = SOCIAL_SCIENCES_TOPICS;
  else if (/xitsonga|tsonga/i.test(subjectKey)) db = XITSONGA_TOPICS;

  let entry: TopicEntry | undefined;

  if (db) {
    // Find nearest grade
    const gradesToTry = [gradeNum, gradeNum - 1, gradeNum + 1, 4, 7, 1];
    for (const g of gradesToTry) {
      if (db[g]?.[termNum]) {
        const list = db[g][termNum];
        entry = list[weekIndex % list.length];
        break;
      }
    }
  }

  if (!entry) {
    const generics = getGenericTopics(subject, gradeNum, termNum, 10);
    entry = generics[weekIndex % generics.length];
  }

  // Override with custom topic if provided
  if (customTopic) {
    return {
      ...entry,
      topic: customTopic,
      subTopic: `Focused lesson on: ${customTopic}`,
      objectives: [
        `Understand the key concepts of ${customTopic}`,
        `Apply knowledge of ${customTopic} to solve problems`,
        `Explain ${customTopic} using correct subject terminology`,
        `Demonstrate understanding through a practical or written task`
      ],
    };
  }

  return entry;
}

// ─── Lesson Plan Builder ──────────────────────────────────────────────────────

export function generateCAPSLessonPlan(
  subject: string,
  grade: string,
  term: string,
  week: number,
  duration: number,
  topic?: string
) {
  const gradeNum = parseGrade(grade);
  const termNum = parseTerm(term);
  const entry = getTopicEntry(subject, gradeNum, termNum, (week - 1), topic);

  const introTime = Math.max(5, Math.round(duration * 0.1));
  const devTime = Math.round(duration * 0.5);
  const practiceTime = Math.round(duration * 0.25);
  const consTime = duration - introTime - devTime - practiceTime;

  return {
    capsAlignment: {
      topic: entry.topic,
      subTopic: entry.subTopic,
      strand: entry.strand,
    },
    priorKnowledge: entry.priorKnowledge,
    learningObjectives: entry.objectives,
    resources: entry.resources,
    phases: [
      {
        name: 'Introduction / Activation of Prior Knowledge',
        duration: `${introTime} minutes`,
        teacherActivities: [
          'Settle the class and state the lesson objective clearly',
          `Pose a warm-up question linked to prior knowledge: ${entry.priorKnowledge}`,
          'Elicit responses from learners and briefly review key background knowledge',
          'Introduce the new topic and explain how it connects to what learners already know',
        ],
        learnerActivities: [
          'Respond to the warm-up question orally or on mini whiteboards',
          'Share what they already know about the topic',
          'Listen actively to the lesson introduction',
          'Write the learning objective in their exercise books',
        ],
      },
      {
        name: 'Lesson Development / Direct Instruction',
        duration: `${devTime} minutes`,
        teacherActivities: [
          `Introduce ${entry.topic} using clear explanations and worked examples on the board`,
          'Use questioning techniques to check for understanding throughout',
          'Demonstrate key steps or procedures with learner participation',
          'Introduce and explain key vocabulary and terminology',
          'Use visual aids and resources to support understanding',
        ],
        learnerActivities: [
          'Listen attentively and take notes in their exercise books',
          'Copy worked examples and annotate them',
          'Respond to teacher questions and ask clarifying questions',
          'Complete a guided example alongside the teacher',
        ],
      },
      {
        name: 'Guided and Independent Practice',
        duration: `${practiceTime} minutes`,
        teacherActivities: [
          'Set practice tasks at varying levels of difficulty',
          'Circulate the classroom to monitor progress and provide individual support',
          'Address common misconceptions with the whole class',
          'Use targeted questioning to extend thinking of learners who finish early',
        ],
        learnerActivities: [
          'Complete practice tasks independently or in pairs',
          'Apply the concept to new examples',
          'Peer-check answers and discuss reasoning',
          'Ask the teacher for help when stuck',
        ],
      },
      {
        name: 'Consolidation and Conclusion',
        duration: `${consTime} minutes`,
        teacherActivities: [
          'Summarise the key learning points of the lesson',
          'Ask 2–3 questions to check whole-class understanding',
          `Set homework: ${entry.homework}`,
          'Preview what the next lesson will cover',
        ],
        learnerActivities: [
          'Respond to consolidation questions',
          'Write down the homework task',
          'Reflect: write one thing they learned and one question they still have',
        ],
      },
    ],
    assessment: {
      type: 'Formative',
      methods: [
        'Observation of learner participation during activities',
        'Questioning technique throughout the lesson',
        'Review of classwork in exercise books',
      ],
      successCriteria: entry.objectives.map(o => o.replace(/^(By the end of this lesson, learners will be able to|Learners will)/, 'Learner can').trim()),
    },
    homework: entry.homework,
    differentiation: {
      support: entry.support,
      extension: entry.extension,
    },
    teacherReflection: 'Use this space to reflect: Were the objectives achieved? What worked well? What would you do differently? Which learners need additional support?',
  };
}

// ─── Term Plan Builder ────────────────────────────────────────────────────────

export function generateCAPSTermPlan(
  subject: string,
  grade: string,
  term: string,
  totalWeeks: number,
  topic?: string
) {
  const gradeNum = parseGrade(grade);
  const termNum = parseTerm(term);

  const weeklyPlans = Array.from({ length: totalWeeks }, (_, i) => {
    const entry = getTopicEntry(subject, gradeNum, termNum, i, i === 0 ? topic : undefined);
    return {
      week: i + 1,
      topic: entry.topic,
      subTopic: entry.subTopic,
      objectives: entry.objectives.slice(0, 3),
      keyActivities: `Direct instruction on ${entry.topic}. Guided practice activities using ${entry.resources[0]}. Independent classwork and peer review.`,
      resources: entry.resources.slice(0, 3),
      assessment: i % 3 === 2
        ? 'Formative assessment — classwork test or written task'
        : 'Formative — observation, questioning, classwork marking',
      homework: entry.homework,
    };
  });

  const firstEntry = getTopicEntry(subject, gradeNum, termNum, 0, topic);
  const midEntry = getTopicEntry(subject, gradeNum, termNum, Math.floor(totalWeeks / 2));

  const formalTasks: string[] = [];
  if (totalWeeks >= 4) formalTasks.push(`Test — Week ${Math.round(totalWeeks * 0.4)} (${firstEntry.strand})`);
  if (totalWeeks >= 8) formalTasks.push(`Assignment — Week ${Math.round(totalWeeks * 0.7)}`);
  if (totalWeeks >= 6) formalTasks.push(`Formal classwork assessment — Week ${totalWeeks}`);

  return {
    termOverview: {
      subject,
      grade,
      term,
      totalWeeks,
      focus: topic
        ? `This term focuses on ${topic} and related concepts within ${subject} for ${grade}.`
        : `This term covers the CAPS-prescribed content for ${subject} ${grade} ${term}, progressing from ${firstEntry.topic} through to ${midEntry.topic} and consolidation.`,
      strand: firstEntry.strand,
      formalAssessmentTasks: formalTasks,
      teachingApproach: `A structured, CAPS-aligned approach combining direct instruction, guided practice, and formative assessment. Differentiation strategies are embedded throughout to support all learners.`,
    },
    weeklyPlans,
    termReflection: 'Use this space at the end of term to reflect on pacing, learner achievement, and any adjustments needed for next term.',
  };
}
