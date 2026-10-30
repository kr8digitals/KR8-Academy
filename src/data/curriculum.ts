/* Real KR8 curricula, extracted from the KR8 Digitals production platform
   (src/kr8/data/store.ts) so the Academy never diverges from what is taught. */

export type Week = { week: string; title: string; points: string[] };

export const CURRICULA: Record<string, Week[]> = {
  "graphic": [
    {
      "week": "Week 1",
      "title": "Design Basics",
      "points": [
        "Intro to Graphic Design & Principles (balance, contrast, alignment, hierarchy, proximity)",
        "Typography & Color Theory",
        "Layout, Composition & Tool Setup (Canva, Photoshop)"
      ]
    },
    {
      "week": "Week 2",
      "title": "Social Media Flyer Design",
      "points": [
        "Intro to Flyer Design",
        "Design Hierarchy & Visual Engagement",
        "Practical Flyer Project (promotional + event flyer)"
      ]
    },
    {
      "week": "Week 3",
      "title": "Branding & Identity Design",
      "points": [
        "Intro to Logo Design",
        "Brand Identity Systems",
        "Mockups & Presentation"
      ]
    },
    {
      "week": "Week 4",
      "title": "Advanced Editing & Manipulation",
      "points": [
        "Photo Manipulation",
        "Retouching & Cinematic Effects",
        "Advanced Composition & Workflows"
      ]
    },
    {
      "week": "Week 5",
      "title": "Introduction to AI in Graphic Design",
      "points": [
        "What AI can/can't do",
        "Prompt Writing & AI Tools",
        "Generating & Editing AI Graphics to make them original"
      ]
    },
    {
      "week": "Week 6",
      "title": "Portfolio Building & Personal Branding",
      "points": [
        "Building a Strong Portfolio",
        "Presenting Projects Professionally",
        "Social Media Presence & Personal Branding"
      ]
    },
    {
      "week": "Week 7",
      "title": "Review & Reinforcement",
      "points": [
        "Full review of all prior weeks",
        "Open correction session"
      ]
    },
    {
      "week": "Week 8",
      "title": "Final Project & Graduation",
      "points": [
        "Project 1 (Paired) — Collaborative Brand Package (logo, brand colors/typography, flyer, social template, mockup) for a mock/local business.",
        "Project 2 (Individual) — Personal Portfolio with 5+ projects (including one AI-assisted piece) plus a written case study.",
        "Final presentations, portfolio review, community showcase, Certificate award ceremony."
      ]
    }
  ],
  "web": [
    {
      "week": "Week 1",
      "title": "Intro to Website Development & AI Websites",
      "points": [
        "What a website is, the three build paths (AI/CMS/coding)",
        "AI Website Design Part 1 (Framer AI, Wix AI, Durable, Mixo)",
        "AI Website Design Part 2 (customisation, domains)"
      ]
    },
    {
      "week": "Week 2",
      "title": "CMS & Domain/Hosting Setup",
      "points": [
        "What a CMS is, key terms",
        "Getting domain & hosting (free via InfinityFree, paid via Namecheap/Whogohost/Qservers)",
        "Installing WordPress & cPanel basics"
      ]
    },
    {
      "week": "Week 3",
      "title": "Getting Started with Website Creation",
      "points": [
        "Starter Templates",
        "Editing Website Body with Elementor",
        "Editing Header and Footer"
      ]
    },
    {
      "week": "Week 4",
      "title": "E-Commerce Website",
      "points": [
        "Installing E-Commerce Template (WooCommerce)",
        "Adding Products",
        "WooCommerce Configuration",
        "Editing E-Commerce Pages with Elementor",
        "Integrating Payment Gateway (Paystack/Flutterwave)"
      ]
    },
    {
      "week": "Week 5",
      "title": "LMS Website",
      "points": [
        "Installing an LMS Template (LearnDash/TutorLMS)",
        "Adding Courses",
        "Editing Your LMS Website"
      ]
    },
    {
      "week": "Week 6",
      "title": "Mastering Elementor & Landing Pages",
      "points": [
        "Elementor Interface Parts 1 & 2",
        "Free Training Landing Page Parts 1 & 2 (hero, opt-in, social proof, FAQ, publishing)"
      ]
    },
    {
      "week": "Week 7",
      "title": "Final Project",
      "points": [
        "Project 1 (Paired) — Business Directory Website (listings, categories, search filters, contact form)",
        "Project 2 (Individual) — Personal Portfolio Website (About, Skills, Projects, Services, Contact)"
      ]
    },
    {
      "week": "Week 8",
      "title": "Graduation & Certification",
      "points": [
        "Final presentations, portfolio review, community showcase, Certificate award ceremony.",
        "Optional continuation into a separate Coding Track (HTML/CSS/JavaScript)."
      ]
    }
  ],
  "video": [
    {
      "week": "Week 1",
      "title": "Intro to Video Editing",
      "points": [
        "Terminology, editing mindset",
        "CapCut & Inshot walkthroughs",
        "Types of video editing"
      ]
    },
    {
      "week": "Week 2",
      "title": "Short Form Viral Editing",
      "points": [
        "Raw Footage Cleanup",
        "Visual Enhancement (grading, captions)",
        "Pattern Interrupt & Sound"
      ]
    },
    {
      "week": "Week 3",
      "title": "Intro to Animation & AI Lip Sync",
      "points": [
        "Animation overview, AI lip sync tools, scriptwriting",
        "Generating voiceover & lip sync (only with proper consent for any real person's likeness/voice)",
        "Editing/retouching"
      ]
    },
    {
      "week": "Week 4",
      "title": "3D Animation & Kids Cartoon Songs",
      "points": [
        "Advanced 3D Animation intro",
        "Creating kids cartoon songs",
        "Combining 3D animation with song production"
      ]
    },
    {
      "week": "Week 5",
      "title": "Motion Graphics & Whiteboard Animation",
      "points": [
        "Motion Graphics I & II",
        "Whiteboard Animation"
      ]
    },
    {
      "week": "Week 6",
      "title": "Faceless Video Content",
      "points": [
        "Using animated elements",
        "Using still images with motion effects and voiceover"
      ]
    },
    {
      "week": "Week 7",
      "title": "UGC & AI Ad Video Creation",
      "points": [
        "UGC Ad Videos",
        "Stickman Animation Using AI",
        "Business Advert Video Creation Using AI"
      ]
    },
    {
      "week": "Week 8",
      "title": "Final Project & Graduation",
      "points": [
        "Project 1 (Paired) — collaborative short-form viral-style edited video.",
        "Project 2 (Individual) — an animation piece using any technique learned."
      ]
    }
  ],
  "content_creation": [
    {
      "week": "Week 1",
      "title": "Foundations of Content Creation & Creative Voice",
      "points": [
        "What makes great content in 2026 & creator mindset",
        "Choosing your niche & sub-topics",
        "The 4 Content Pillars (Educational, Entertaining, Inspiring, Relatable)",
        "High-retention storytelling frameworks"
      ]
    },
    {
      "week": "Week 2",
      "title": "Smartphone Cinematography & Mobile Audio",
      "points": [
        "Phone camera settings, resolution, frame rates (4K vs 1080p, 24fps vs 60fps)",
        "Rule of thirds, dynamic angles & smooth camera movement",
        "Budget lighting techniques (natural, ring light, 3-point setups)",
        "Clear mobile audio, external mics, and noise cancellation"
      ]
    },
    {
      "week": "Week 3",
      "title": "Mobile Video Editing for Creators (CapCut & InShot)",
      "points": [
        "Timeline editing, trimming & split workflows",
        "Cutting on action, dynamic pacing & pattern interrupts",
        "Sound effects (SFX), sound bridges & music layering",
        "Auto-captions, animated kinetic typography & overlays"
      ]
    },
    {
      "week": "Week 4",
      "title": "Scriptwriting & The 3-Second Hook",
      "points": [
        "The psychology of stopping the scroll (visual, verbal, text hooks)",
        "Structuring the body for maximum viewer retention",
        "Avoiding mid-video drop-offs & dead air",
        "Call-to-action (CTA) formulas that drive engagement and follows"
      ]
    },
    {
      "week": "Week 5",
      "title": "Visual Design & Thumbnail Mastery",
      "points": [
        "Canva for content creators: principles & workflows",
        "Designing high-CTR video thumbnails and cover cards",
        "Contrast, text hierarchy, emotion, and facial expressions",
        "Creating reusable branded templates & color palettes"
      ]
    },
    {
      "week": "Week 6",
      "title": "AI-Powered Creation & Generative Assets",
      "points": [
        "AI ideation and script generation with Claude & ChatGPT",
        "Generative AI B-roll, dynamic b-roll inserts & visual assets",
        "Voiceover enhancement & ethical AI voice synthesis",
        "Automating repurposing pipelines with AI"
      ]
    },
    {
      "week": "Week 7",
      "title": "Long-Form YouTube & Multi-Platform Repurposing",
      "points": [
        "Long-form YouTube architecture (concept, title, thumbnail, payoff)",
        "The 1-to-10 Repurposing Framework: turn 1 long video into 10 viral clips",
        "Platform adaptations: TikTok vs Reels vs Shorts vs LinkedIn",
        "Batch production scheduling: film a week's content in 3 hours"
      ]
    },
    {
      "week": "Week 8",
      "title": "Personal Branding, Media Kit & Creator Launch",
      "points": [
        "Project 1 (Paired) — A 3-part viral video series with retention analytics breakdown.",
        "Project 2 (Individual) — Live 7-day multi-format content portfolio + professional creator media kit.",
        "Rate card setting, pitching brands for sponsorship & graduation showcase."
      ]
    }
  ],
  "smm": [
    {
      "week": "Week 1",
      "title": "The SMM Profession & Strategic Ecosystem",
      "points": [
        "Role of a Social Media Manager vs. Content Creator",
        "Understanding client business models & digital marketing objectives",
        "Conducting a comprehensive brand profile audit",
        "Competitor research, benchmarking & SWOT analysis"
      ]
    },
    {
      "week": "Week 2",
      "title": "Profile Architecture & Social SEO Optimization",
      "points": [
        "Crafting high-converting business bios and value propositions",
        "Optimizing profile handles, SEO keywords & search indexing",
        "Highlights funnel architecture and lead capture link setups",
        "Algorithm mechanics across Instagram, TikTok, LinkedIn, Facebook, and X"
      ]
    },
    {
      "week": "Week 3",
      "title": "Content Strategy & 30-Day Editorial Calendars",
      "points": [
        "Defining core content pillars and sub-themes for a brand",
        "Building comprehensive 30-day editorial content calendars",
        "Balancing brand awareness, engagement, community trust, and direct sales",
        "Scheduling automation tools (Meta Business Suite, Buffer, Later)"
      ]
    },
    {
      "week": "Week 4",
      "title": "Persuasive Copywriting & Community Management",
      "points": [
        "Developing and documenting a brand tone of voice",
        "Writing persuasive captions with clear conversion triggers",
        "Community engagement strategy: proactive vs reactive engagement",
        "Direct message (DM) lead qualification, customer service & crisis management"
      ]
    },
    {
      "week": "Week 5",
      "title": "Organic Growth Hacking & Trend Hijacking",
      "points": [
        "Researching trending audios, hashtags & viral formats",
        "Ethical newsjacking and timely cultural trend integration",
        "Strategic collaborations, co-author posts & influencer outreach",
        "Cross-platform audience migration tactics"
      ]
    },
    {
      "week": "Week 6",
      "title": "Analytics, Performance Metrics & Client ROI Reporting",
      "points": [
        "Mastering native analytics dashboards (Meta Insights, TikTok Analytics, LinkedIn)",
        "Key metrics that matter: Reach, Impressions, ER, CTR, Saves & Shares",
        "Translating vanity metrics into real business outcomes and sales leads",
        "Building professional monthly client performance decks with actionable recommendations"
      ]
    },
    {
      "week": "Week 7",
      "title": "SMM Business Operations, Pricing & Client Acquisition",
      "points": [
        "Packaging your SMM services: management, strategy, community only",
        "Pricing models: monthly retainers vs project fees vs setup packages",
        "Crafting winning client proposals, contracts & scopes of work (SOW)",
        "Client onboarding checklists, communication boundaries & managing multiple accounts"
      ]
    },
    {
      "week": "Week 8",
      "title": "Capstone Project, Portfolio & SMM Certification",
      "points": [
        "Project 1 — Complete 30-day brand strategy and content calendar for a real business.",
        "Project 2 — Full social media audit report and strategic pitch deck ready for client presentation.",
        "Final client pitch presentation, portfolio review, and Certificate of Social Media Management."
      ]
    }
  ],
  "marketing": [
    {
      "week": "Week 1",
      "title": "Intro to Digital Marketing",
      "points": [
        "What it is",
        "Types and requirements",
        "Choosing your path among the three tracks"
      ]
    },
    {
      "week": "Week 2",
      "title": "China Importation: Getting Started",
      "points": [
        "What it is, capital expectations, scam red flags",
        "Opening a 1688 account",
        "Picture-searching and texting suppliers"
      ]
    },
    {
      "week": "Week 3",
      "title": "China Importation: Sourcing & Running",
      "points": [
        "Sourcing goods",
        "Running a pre-order business",
        "Addressing issues/challenges"
      ]
    },
    {
      "week": "Week 4",
      "title": "Intro to Affiliate Marketing",
      "points": [
        "The zero-capital model",
        "Amazon Associates account setup",
        "Setting up social platforms for affiliate marketing"
      ]
    },
    {
      "week": "Week 5",
      "title": "Running Your Affiliate Business",
      "points": [
        "Choosing a niche/products",
        "Getting product links and building a library",
        "Writing converting ad copy"
      ]
    },
    {
      "week": "Week 6",
      "title": "Video Content That Converts",
      "points": [
        "Intro to video editing",
        "Generative AI tools for video content",
        "Best way to post videos that convert"
      ]
    },
    {
      "week": "Week 7",
      "title": "Amazon Bounty Programmes",
      "points": [
        "What they are",
        "Promoting them at no cost",
        "Understanding dashboard and commissions"
      ]
    },
    {
      "week": "Week 8",
      "title": "Final Project & Graduation",
      "points": [
        "Choose 2 of 3 tracks (so lack of capital never blocks graduation)",
        "Track A: China Importation (documented pre-order cycle)",
        "Track B: Affiliate Marketing (live account, 5+ product library, 3 pieces of posted ad copy)",
        "Track C: Amazon Bounty (one real public promotion with dashboard proof)",
        "Students with little/no capital can graduate completing Tracks B and C only."
      ]
    }
  ],
  "frontend": [
    {
      "week": "Week 1",
      "title": "Semantic Foundations & Modern HTML",
      "points": [
        "How the web actually works: browser, server, request, response",
        "Semantic HTML5 structure and accessibility landmarks",
        "Forms, inputs, validation and native browser behaviour",
        "Build: a fully semantic, accessible multi-page site shell"
      ]
    },
    {
      "week": "Week 2",
      "title": "Responsive CSS & Tailwind Mastery",
      "points": [
        "The box model, flexbox and CSS grid done properly",
        "Fluid typography, spacing systems and design tokens",
        "Tailwind utilities, component extraction and responsive breakpoints",
        "Build: a pixel-tight, mobile-first landing page"
      ]
    },
    {
      "week": "Week 3",
      "title": "Modern JavaScript ES6+",
      "points": [
        "Scope, closures, modules, destructuring and spread",
        "Arrays & objects: map, filter, reduce in real UI problems",
        "DOM events, forms and state without a framework",
        "Build: an interactive filterable project gallery"
      ]
    },
    {
      "week": "Week 4",
      "title": "React Component Architecture",
      "points": [
        "Components, props, and one-way data flow",
        "State, effects, and lifting state without chaos",
        "Composition patterns, conditional rendering and lists",
        "Build: a multi-section dashboard UI in React"
      ]
    },
    {
      "week": "Week 5",
      "title": "Routing, Forms & State Management",
      "points": [
        "Client routing, nested layouts and dynamic params",
        "Controlled forms, validation and error states",
        "Context, reducers and persistent state in localStorage",
        "Build: a CRUD app with create, edit, delete and search"
      ]
    },
    {
      "week": "Week 6",
      "title": "APIs, Data Fetching & Async UX",
      "points": [
        "REST, JSON, fetch, async/await and error handling",
        "Loading, empty and error states that feel professional",
        "Caching, pagination and optimistic updates",
        "Build: a live data app consuming a public API"
      ]
    },
    {
      "week": "Week 7",
      "title": "Production Craft: Performance, SEO & Deployment",
      "points": [
        "Core Web Vitals, image strategy and bundle discipline",
        "Meta tags, Open Graph, sitemaps and structured data",
        "Git workflow, environment variables and deployment to Vercel",
        "Build: ship your app to a real domain"
      ]
    },
    {
      "week": "Week 8",
      "title": "Final Project & Graduation",
      "points": [
        "Project 1 (Paired) — a production-ready client web app with auth screens",
        "Project 2 (Individual) — a deployed portfolio application with case studies",
        "Code review, live defence and performance audit",
        "Final presentations, portfolio review and certificate award"
      ]
    }
  ]
};

export const CERTIFICATION_CRITERIA: Record<string,string> = {
  "graphic": "≥80% live session attendance · both Week 8 projects submitted · portfolio of 5+ projects including one AI-assisted piece · passing feedback in ≥2 Thursday review sessions · ≥2 Mindset Shift sessions + 1 Monthly Hangout attended · demonstrated proficiency across fundamentals, branding, advanced editing, and responsible AI collaboration.",
  "web": "≥80% live session attendance · both Week 7 final projects submitted · passing feedback in ≥2 Thursday review sessions · required Mindset Shift and Monthly Hangout attendance · demonstrated proficiency across AI websites, CMS/WordPress, e-commerce, and landing pages.",
  "frontend": "≥80% live session attendance · both Week 8 projects submitted · portfolio of 6+ frontend application builds including one React application · passing feedback in ≥2 Thursday review sessions · required Mindset Shift and Monthly Hangout attendance · demonstrated proficiency across modern HTML/CSS/Tailwind, JavaScript ES6+, React, and API integration.",
  "video": "≥80% live session attendance · both Week 8 projects submitted · portfolio of 6+ pieces covering both editing and animation · passing feedback in ≥2 Thursday review sessions · required Mindset Shift and Monthly Hangout attendance · demonstrated proficiency across editing fundamentals, short-form editing, and at least one animation technique.",
  "content_creation": "≥80% live session attendance · both Week 8 projects submitted · an active creator account with a 7-day multi-format portfolio + creator media kit · passing feedback in ≥2 Thursday review sessions · required Mindset Shift and Monthly Hangout attendance · demonstrated proficiency in mobile production, dynamic editing, and audience retention.",
  "content": "≥80% live session attendance · both Week 8 projects submitted · an active creator account with a 7-day multi-format portfolio + creator media kit · passing feedback in ≥2 Thursday review sessions · required Mindset Shift and Monthly Hangout attendance.",
  "smm": "≥80% live session attendance · complete 30-day brand strategy and content calendar submitted · professional social media audit and pitch deck for a real brand · passing feedback in ≥2 Thursday review sessions · required Mindset Shift and Monthly Hangout attendance · demonstrated competency in client reporting and KPI analytics.",
  "marketing": "≥80% live session attendance · real deliverables completed in ≥2 of the 3 final project tracks · a working 1688 account OR live/approved affiliate account OR active bounty promotion (matching chosen tracks) · passing feedback in ≥2 Thursday review sessions · ≥3 Mindset Shift sessions + 1 Monthly Hangout attended · demonstrated honest, professional communication with customers/suppliers."
};
