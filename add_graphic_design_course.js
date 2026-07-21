const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({ filename: 'database.sqlite', driver: sqlite3.Database });

  const courseTitle = 'SkillPath Academy — Graphic Design Course';

  // Check if course already exists
  const existing = await db.get('SELECT * FROM courses WHERE title = ?', [courseTitle]);
  if (existing) {
    console.log('Course already exists with id', existing.id);
    await db.close();
    process.exit(0);
  }

  // Prepare course fields -- only use columns that exist
  const cols = await db.all("PRAGMA table_info(courses)");
  const colNames = cols.map(c => c.name);

  const courseData = {
    title: courseTitle,
    category: 'Graphic Design',
    description: `Comprehensive Graphic Design course covering foundations, branding, social and print design, UI basics and a capstone rebrand project.`,
    image: '',
    price: 0,
    instructor: 'SkillPath Academy',
    level: 'Beginner → Intermediate',
    duration: 'Self-paced',
    requirements: JSON.stringify([]),
    outcomes: JSON.stringify([
      'Understand color theory and typography',
      'Create logo and brand guidelines',
      'Design social and print materials',
      'Produce a capstone rebrand package'
    ])
  };

  const keys = Object.keys(courseData).filter(k => colNames.includes(k));
  const placeholders = keys.map(() => '?').join(', ');
  const insertSQL = `INSERT INTO courses (${keys.join(', ')}) VALUES (${placeholders})`;
  const values = keys.map(k => courseData[k]);

  const result = await db.run(insertSQL, values);
  const courseId = result.lastID;
  console.log('Inserted course id', courseId);

  // Ensure lessons table has the newer columns `video_url` and `content` (migration)
  const lessonCols = await db.all("PRAGMA table_info(lessons)");
  const lessonColNames = lessonCols.map(c => c.name);
  if (!lessonColNames.includes('video_url')) {
    try { await db.run("ALTER TABLE lessons ADD COLUMN video_url TEXT DEFAULT ''"); console.log('Added lessons.video_url column'); } catch (e) { console.warn('Could not add video_url column:', e.message); }
  }
  if (!lessonColNames.includes('content')) {
    try { await db.run("ALTER TABLE lessons ADD COLUMN content TEXT DEFAULT ''"); console.log('Added lessons.content column'); } catch (e) { console.warn('Could not add content column:', e.message); }
  }

  const lessons = [
    // Module 1
    { title: '1.1 Color Theory (That Actually Works)', order_index: 1, video_url: '', content: `Key takeaways:\n\nPrimary, secondary, and complementary colors — the quick refresher\nWarm colors (red, orange) feel energetic and urgent. Cool colors (blue, green) feel calm and trustworthy\nThe 60-30-10 rule: 60% dominant color, 30% secondary, 10% accent\nBeginner mistake: using too many colors with no dominant one\nTool: Coolors.co or Adobe Color to generate palettes fast\n\nColor is the fastest way to make a design look either professional or amateur — and it's not about talent, it's about ratio. Instead of picking five colors and hoping they work together, use the 60-30-10 rule: one dominant color covering 60% of the design, one secondary color for 30% of the design, and one accent color used sparingly — usually for buttons or highlights — for the remaining 10%.\n\nWarm colors like red and orange create energy and urgency, which is why sales banners and "buy now" buttons often use them. Cool colors like blue create calm and trust, which is why banks and healthcare brands lean on them.\n\nPractice: Open Coolors.co, generate a palette, and identify which color will be your 60%, which your 30%, and which your 10%.` },
    { title: '1.2 Typography & Hierarchy', order_index: 2, video_url: '', content: `Key takeaways:\n\nHierarchy guides the eye: what should someone read first, second, third?\nStick to a maximum of two font families — one for headers, one for body text\nSize, weight, and color all create hierarchy, not just font choice\nBeginner mistake: making everything the same size, so nothing stands out\n\nIf color sets the mood, typography controls where people look first. Hierarchy means using size, weight, and sometimes color to show a reader what matters most, second-most, and least. A design where everything is the same size gives the eye nowhere obvious to start.\n\nThe simplest fix: limit yourself to two font families — one for headlines, one for body text — and let size and weight do the work of separating a big headline from a smaller subheading from small body copy.\n\nPractice: Take the palette from Lesson 1.1 and apply it to a simple layout with a headline, a subheading, and a caption — using only size and weight to separate them, no new colors yet.` },
    { title: '1.3 Layout & Composition Basics', order_index: 3, video_url: '', content: `Key takeaways:\n\nWhitespace isn't empty — it's a design tool\nAlignment: everything should line up to an invisible grid\nProximity: group related items close together so they read as one unit\nBeginner mistake: cramming the page to "use all the space"\n\nLayout is where a lot of beginner work falls apart — not because individual elements are bad, but because they're scattered with no underlying structure. Three principles fix most layout problems: alignment (line elements up to a consistent grid instead of eyeballing placement), proximity (group related items close together so they're read as one unit), and whitespace (give elements room to breathe instead of filling every inch of the page).\n\nPractice: Take your Lesson 1.2 layout and clean it up using only these three rules — don't add anything new, just organize what's already there.` },
    { title: '1.4 Tool Walkthrough', order_index: 4, video_url: '', content: `Key takeaways:\n\nCore panels: text tools, color tools, alignment/grid tools\nExporting correctly for web vs. print (full detail comes in Module 4)\nA few keyboard shortcuts that save real time\n\nBefore going further, it's worth getting comfortable with your primary design tool (Canva, Figma, or Photoshop — whichever you're using). The panels that matter most early on are the text tool, the color panel, and the alignment/grid tool — the last one is the one beginners tend to skip, but it's what makes a layout actually line up instead of relying on guesswork.\n\nExporting is a topic worth understanding early too: web exports and print exports use different settings, which is covered in full in Module 4.` },
    { title: 'Module 1 Project: Personal Mini Brand Kit', order_index: 5, video_url: '', content: `Project: A personal mini brand kit — one logomark, a 3-color palette (using 60-30-10), and one social post using both.\n\nDeliverables:\n- One simple logomark\n- 3 color palette with hex codes and 60/30/10 assignments\n- One social post mockup showing the palette and logomark` },
    // Module 2
    { title: '2.1 Logo Types', order_index: 6, video_url: '', content: `Key takeaways:\n\nWordmark (text-based) — e.g. Google, Coca-Cola\nIcon/symbol — e.g. Apple, Nike\nCombination mark — icon and text together\nA combination mark is generally the safest choice for a new business\n\nNot every logo needs to be an icon — that's a common beginner instinct, but the right choice depends on the brand. A wordmark works well for a name that's short and distinctive on its own. An icon works best for a brand that's already recognizable or that needs something scalable down to a tiny app icon. A combination mark — icon plus text — is usually the safest choice for a new business, since people learn the icon over time while still seeing the name upfront.\n\nPractice: For a fictional client brief, decide which of the three logo types fits best, and explain the choice in one sentence.` },
    { title: '2.2 Building a Brand Guideline', order_index: 7, video_url: '', content: `Key takeaways:\n\nLogo variations: full color, one-color, icon-only\nApproved color palette with exact hex codes\nFont pairing rules\nClear space rules — minimum space required around the logo\n\nA logo on its own isn't a brand — the guideline around it is what keeps everything consistent, and consistency is what makes a brand look professional instead of thrown together. At minimum, a one-page brand guide should include: the logo in full color and in one color, exact hex codes for the palette, which fonts pair with the logo, and how much empty space must stay around the logo so it's never cramped.\n\nPractice: Build a one-page brand guide for the logo you designed in Lesson 2.1.` },
    { title: '2.3 Presenting Logos in Mockups', order_index: 8, video_url: '', content: `Key takeaways:\n\nMockups make a flat logo look real: business card, sign, phone screen\nFree mockup resources are widely available online\nPresentation affects how "finished" work looks to a client\n\nA flat logo on a white background rarely impresses a client the way seeing it "in the real world" does. Dropping a logo into a free mockup template — a business card, a shirt, or a storefront sign all work well — instantly makes the work look more professional and finished.\n\nPractice: Place your Module 2 logo into at least one mockup template before considering it complete.` },
    { title: 'Module 2 Project: Logo + Brand Guide', order_index: 9, video_url: '', content: `Project: Full logo + one-page brand guide for a fictional client brief.` },
    // Module 3
    { title: '3.1 Instagram Grid & Carousel Design', order_index: 10, video_url: '', content: `Key takeaways:\n\nGrid consistency: same font/color system across every post\nCarousel structure: hook slide → content slides → CTA slide\nSafe zones so text isn't cut off on mobile screens\n\nSocial design isn't just about making one pretty square — it's about designing for a feed someone is scrolling through in half a second. Keeping the same colors and fonts across every post is what makes a grid look like a cohesive brand instead of a set of unrelated posts.\n\nFor carousels specifically: the first slide is the hook and has to stop the scroll, the middle slides carry the content, and the last slide holds a clear call-to-action.\n\nPractice: Design a 3-slide carousel for a fictional product launch, following the hook → content → CTA structure.` },
    { title: '3.2 Ad Creatives That Convert', order_index: 11, video_url: '', content: `Key takeaways:\n\nOne message per ad — don't try to say everything at once\nA clear call-to-action tells the viewer what to do next\nContrast: the offer/CTA should be the most visually dominant element\n\nA pretty ad that doesn't convert isn't doing its job. The fix is usually to pick one single message per ad — one offer, one product, one idea — and make sure the call-to-action is the most visually dominant thing on the page, not an afterthought tucked in a corner.\n\nPractice: Take the hook slide from Lesson 3.1 and turn it into a single standalone ad with one clear call-to-action.` },
    { title: '3.3 Designing at Scale with Templates', order_index: 12, video_url: '', content: `Key takeaways:\n\nBuild once, reuse the system — not just the design\nA template is a locked layout with swappable text/imagery\nThis is how agencies and freelancers deliver content quickly\n\nOnce a single good post is possible, the real skill is building a reusable system: a locked layout — same structure, same fonts, same color rules — where only the text and imagery change each time. This is how professionals deliver a month of content in a day rather than a week.\n\nPractice: Turn the Module 3 carousel into a reusable template, then create two more posts using it with different content.` },
    { title: 'Module 3 Project: One-Week Content Calendar', order_index: 13, video_url: '', content: `Project: A one-week content calendar mockup (5-7 posts) for a fictional business, built from a reusable template.` },
    // Module 4
    { title: '4.1 Flyers, Business Cards, Brochures', order_index: 14, video_url: '', content: `Key takeaways:\n\nStandard sizes exist for business cards, flyers, tri-fold brochures\nPrint layouts generally need more breathing room than digital ones\nTwo-sided pieces need front and back planned separately\n\nPrint design follows different rules than digital, starting with size — business cards, flyers, and brochures each have standard dimensions a client will expect. Print layouts also tend to need more whitespace than digital ones, since there's no scrolling to break up dense content — everything has to sit comfortably on one fixed page.` },
    { title: '4.2 Print Specs That Matter', order_index: 15, video_url: '', content: `Key takeaways:\n\nBleed: extend the design past the edge so trimming doesn't leave white gaps\nCMYK vs. RGB — print uses CMYK, screens use RGB\nResolution: 300 DPI minimum for print, not 72 DPI (which is for web)\n\nThis is one of the shortest lessons but one of the most important, since a print shop will reject a file that gets it wrong. Three things matter: add bleed by extending the design past the trim line so cutting doesn't leave a white gap; work in CMYK rather than RGB, since screens and printers read color differently; and set resolution to 300 DPI rather than 72 DPI, since 72 DPI looks blurry once printed.` },
    { title: '4.3 Fixing a Bad Layout', order_index: 16, video_url: '', content: `Key takeaways:\n\nCommon issues: no hierarchy, no alignment, too many fonts/colors\nFix by removing elements before adding new ones\nClient-ready doesn't mean more decoration — it means clarity\n\nThis lesson combines everything from Module 1 with a redesign exercise. Given a genuinely cluttered flyer — too many fonts, no hierarchy, no alignment — the fix starts with removing rather than adding: cut fonts down to two, cut colors down to a 60-30-10 palette, and align everything to a consistent grid. Most bad designs improve by taking things away, not by decorating further.` },
    { title: 'Module 4 Project: Print Set', order_index: 17, video_url: '', content: `Project: Business card + flyer set for a fictional client, delivered print-ready (bleed, CMYK, 300 DPI).` },
    // Module 5
    { title: '5.1 Wireframing Fundamentals', order_index: 18, video_url: '', content: `Key takeaways:\n\nA wireframe shows structure only — no colors or fonts yet\nBoxes and lines represent content blocks\nThe purpose is to solve layout problems before designing them in detail\n\nBefore any screen gets colors or fonts, it starts as a wireframe — just boxes and lines showing where content will go. The point of a wireframe is to solve layout and flow problems cheaply, before time is invested in visuals, since it's much faster to move a box than to redo a finished design.` },
    { title: '5.2 Mockups in Figma', order_index: 19, video_url: '', content: `Key takeaways:\n\nTurning a wireframe into a real-looking screen\nUsing components/frames keeps elements consistent\nDesign at actual screen dimensions, not a rough guess\n\nA wireframe becomes a real mockup once actual colors, fonts, and imagery are added. The key habit here is using frames set to real screen dimensions — designing at "rough screen sizes" tends to produce layouts that don't actually fit anywhere once built.` },
    { title: '5.3 Designing for Real Screen Sizes', order_index: 20, video_url: '', content: `Key takeaways:\n\nDesign for both desktop and mobile — they are not the same layout\nElements side-by-side on desktop often need to stack on mobile\nTest: would this actually make sense on a phone?` },
    { title: 'Module 5 Project: Landing Page Mockup', order_index: 21, video_url: '', content: `Project: A polished landing page mockup — desktop and mobile versions.` },
    // Capstone
    { title: 'Capstone: Real Client Brief', order_index: 22, video_url: '', content: `Key takeaways:\n\nFull rebrand for one fictional client: logo, social kit, one print piece, one digital layout\nSubmitted for peer review, then mentor/rubric review\nCertificate issued only after passing rubric review\n\nDeliverables:\n- Logo and logomark\n- Short social kit (3 posts)\n- One print piece (business card or flyer)\n- One digital layout (landing page mockup)\n\nRubric categories: Brand consistency, Hierarchy & alignment, Print-readiness, Execution vs brief.` }
  ];

  for (const l of lessons) {
    await db.run('INSERT INTO lessons (course_id, title, order_index, video_url, content) VALUES (?, ?, ?, ?, ?)', [courseId, l.title, l.order_index, l.video_url || '', l.content || '']);
  }

  console.log('Inserted', lessons.length, 'lessons');
  await db.close();
})();
