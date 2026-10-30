import { CURRICULA, CERTIFICATION_CRITERIA, type Week } from "./curriculum";

export type { Week };

export type Mentor = {
  key: string;
  name: string;
  shortName: string;
  role: string;
  title: string;
  bio: string;
  photo: string;
  photoWide?: string;
  trackKeys: string[];
  links?: { label: string; href: string }[];
};

export type Track = {
  key: string;
  slug: string;
  name: string;
  code: string;
  tagline: string;
  snippet: string;
  icon: "palette" | "video" | "code" | "layout" | "camera" | "megaphone" | "trending";
  level: "Beginner" | "Beginner → Intermediate" | "Intermediate";
  duration: string;
  commitment: string;
  seats: number;
  mentorKey: string;
  curriculum: Week[];
  criteria: string;
  outcomes: string[];
  tools: string[];
  cover: string;
  accent: string;
  available: boolean;
  registrationOpen: boolean;
};

/* ---------------------------------------------------------------
   Real people. Real portraits pulled from the KR8 production repo.
   --------------------------------------------------------------- */
export const MENTORS: Mentor[] = [
  {
    key: "timfire",
    name: "Kenneth Timothy Iziogo",
    shortName: "Timfire",
    role: "Founder & CEO",
    title: "Founder & CEO · Website Development Instructor",
    bio: "Founded KR8 Digitals on a simple conviction: world-class creative education should not be rationed by money. Timfire is an AI agent developer, website developer, graphic designer, video editor and linguistics student — and he still teaches the website development cohort himself.",
    photo: "/team/founder-timfire.jpg",
    photoWide: "/team/founder-timfire-wide.jpg",
    trackKeys: ["web"],
    links: [{ label: "Email Timfire", href: "mailto:kr8digitals01@gmail.com" }],
  },
  {
    key: "stevenson",
    name: "Stevenson",
    shortName: "Motionverse",
    role: "Co-Founder · Media Director",
    title: "Co-Founder · Media Director · Graphic Design Instructor",
    bio: "Stevenson leads Graphic Design at KR8 Digitals under his creative studio, Motionverse. He has spent years turning raw ideas into brand-ready visuals, and brings that same eye for clarity and impact into every lesson he teaches.",
    photo: "/team/stevenson.jpg",
    trackKeys: ["graphic", "content_creation"],
  },
  {
    key: "daniel",
    name: "Daniel",
    shortName: "Creative Expression",
    role: "Co-Founder · COO",
    title: "Co-Founder · COO · Video Editing & Animation Instructor",
    bio: "Daniel heads Video Editing & Animation at KR8 Digitals, running his own studio, Creative Expression. From raw footage to polished, scroll-stopping content, he teaches students to edit with intention — not just software skills.",
    photo: "/team/daniel.jpg",
    trackKeys: ["video", "marketing"],
  },
  {
    key: "nonye",
    name: "Chimnonyerem Mercy",
    shortName: "Nonye Mercy",
    role: "Project Director",
    title: "Project Director & Frontend Coach",
    bio: "Mercy coordinates technical initiatives and coaches builders toward clear, practical frontend execution. She oversees project lifecycles, ensuring student developers bridge theory into real, responsive web interfaces.",
    photo: "/team/nonye.jpg",
    trackKeys: ["frontend"],
  },
  {
    key: "favour",
    name: "Nwefuru Favour Chizurum",
    shortName: "Favour",
    role: "General Manager",
    title: "General Manager · Cohort Operations",
    bio: "Favour keeps people, programmes and academy operations moving in one synchronised direction — managing daily administrative workflows, cohort schedules and institutional logistics across every skill track.",
    photo: "/team/favour.jpg",
    trackKeys: ["smm"],
  },
];

export const mentorByKey = (key: string) => MENTORS.find((m) => m.key === key);

/* ---------------------------------------------------------------
   Tracks — mirrored 1:1 with the live KR8 academy catalogue.
   --------------------------------------------------------------- */
export const TRACKS: Track[] = [
  {
    key: "graphic",
    slug: "graphic-design",
    name: "Graphic Design",
    code: "GDVFD",
    tagline: "From blank canvas to a brand people trust.",
    snippet:
      "An 8-week programme taking complete beginners from zero design knowledge to a professional portfolio — covering design fundamentals, flyer design, branding & identity, advanced photo manipulation, and responsible AI-assisted design.",
    icon: "palette",
    level: "Beginner",
    duration: "8 weeks",
    commitment: "6–8 hrs / week",
    seats: 40,
    mentorKey: "stevenson",
    curriculum: CURRICULA.graphic,
    criteria: CERTIFICATION_CRITERIA.graphic,
    outcomes: [
      "A 5+ project portfolio with a full brand identity case study",
      "Confident command of typography, hierarchy and colour systems",
      "Client-ready flyer, logo and social template workflows",
      "An honest, responsible AI-assisted design practice",
    ],
    tools: ["Photoshop", "Canva", "Illustrator", "AI tools"],
    cover: "/img/hero-studio.jpg",
    accent: "#D62A9C",
    available: true,
    registrationOpen: true,
  },
  {
    key: "video",
    slug: "video-editing",
    name: "Video Editing & Animation",
    code: "VEVFD",
    tagline: "Edit with intention, not just software skills.",
    snippet:
      "An 8-week programme covering both professional video editing (short-form, viral, raw footage to polish) and animation (3D, motion graphics, whiteboard, faceless content, AI-assisted ad videos).",
    icon: "video",
    level: "Beginner",
    duration: "8 weeks",
    commitment: "6–8 hrs / week",
    seats: 40,
    mentorKey: "daniel",
    curriculum: CURRICULA.video,
    criteria: CERTIFICATION_CRITERIA.video,
    outcomes: [
      "A showreel that holds attention from the first frame",
      "Short-form retention craft: pacing, sound design, captions",
      "At least one animation technique shipped end-to-end",
      "A repeatable client delivery workflow",
    ],
    tools: ["CapCut", "Premiere Pro", "After Effects", "AI lip-sync"],
    cover: "/img/editor-at-work.jpg",
    accent: "#7C3AED",
    available: true,
    registrationOpen: true,
  },
  {
    key: "web",
    slug: "website-development",
    name: "Website Development",
    code: "WDVFD",
    tagline: "Build and launch real websites, week by week.",
    snippet:
      "An 8-week programme building real websites — from AI website builders and WordPress/Elementor to e-commerce stores, LMS platforms, and landing pages — ending with a live personal portfolio site.",
    icon: "code",
    level: "Beginner",
    duration: "8 weeks",
    commitment: "6–8 hrs / week",
    seats: 40,
    mentorKey: "timfire",
    curriculum: CURRICULA.web,
    criteria: CERTIFICATION_CRITERIA.web,
    outcomes: [
      "Launch a live personal portfolio on your own domain",
      "Ship an e-commerce store with a working payment gateway",
      "Build landing pages that convert, not just look good",
      "Understand hosting, CMS and cPanel without fear",
    ],
    tools: ["WordPress", "Elementor", "WooCommerce", "Framer AI", "cPanel"],
    cover: "/media/work-afristem.jpg",
    accent: "#0F766E",
    available: true,
    registrationOpen: true,
  },
  {
    key: "frontend",
    slug: "frontend-development",
    name: "Front-End Development",
    code: "FEDVFD",
    tagline: "Engineering craft for interfaces people love.",
    snippet:
      "An 8-week engineering track taking you from semantic foundations to production-ready interfaces — mastering responsive CSS & Tailwind, modern JavaScript ES6+, React component architecture, API data fetching, state management, and real client web application deployment.",
    icon: "layout",
    level: "Beginner → Intermediate",
    duration: "8 weeks",
    commitment: "8–10 hrs / week",
    seats: 30,
    mentorKey: "nonye",
    curriculum: CURRICULA.frontend,
    criteria: CERTIFICATION_CRITERIA.frontend,
    outcomes: [
      "A deployed React application with real state and routing",
      "Production habits: accessibility, performance, git workflow",
      "The ability to read an API and build against it",
      "A portfolio that survives a technical interview",
    ],
    tools: ["HTML/CSS", "Tailwind", "JavaScript", "React", "Vite", "Git"],
    cover: "/media/work-chitom.png",
    accent: "#2563EB",
    available: true,
    registrationOpen: true,
  },
  {
    key: "content_creation",
    slug: "content-creation",
    name: "Content Creation",
    code: "CCVFD",
    tagline: "Shoot, cut and publish content that travels.",
    snippet:
      "An 8-week creator programme taking you from zero to a high-retention creator — covering smartphone cinematography, mobile lighting & audio, CapCut editing, Canva visual design, AI B-roll & ideation, short-form vs long-form architecture, personal branding, and creator media kits.",
    icon: "camera",
    level: "Beginner",
    duration: "8 weeks",
    commitment: "5–7 hrs / week",
    seats: 40,
    mentorKey: "stevenson",
    curriculum: CURRICULA.content_creation,
    criteria: CERTIFICATION_CRITERIA.content_creation,
    outcomes: [
      "A 7-day multi-format content portfolio",
      "A creator media kit and rate card",
      "Hook writing that survives the 3-second test",
      "A batch-production system you can actually sustain",
    ],
    tools: ["Smartphone", "CapCut", "Canva", "AI B-roll"],
    cover: "/img/cohort-room.jpg",
    accent: "#EA580C",
    available: true,
    registrationOpen: true,
  },
  {
    key: "smm",
    slug: "social-media-management",
    name: "Social Media Management",
    code: "SMMVFD",
    tagline: "Run brand pages like a business, not a hobby.",
    snippet:
      "An 8-week business programme training you to manage and scale brand pages professionally — covering social SEO & algorithm mechanics, 30-day editorial calendars, persuasive social copywriting, community management & lead nurture, analytics & ROI reporting, pricing, contracts, and client pitching.",
    icon: "megaphone",
    level: "Beginner",
    duration: "8 weeks",
    commitment: "5–7 hrs / week",
    seats: 35,
    mentorKey: "favour",
    curriculum: CURRICULA.smm,
    criteria: CERTIFICATION_CRITERIA.smm,
    outcomes: [
      "A 30-day editorial calendar for a real brand",
      "A professional social audit and pitch deck",
      "Monthly reporting that speaks in revenue, not likes",
      "Retainer pricing, contracts and onboarding systems",
    ],
    tools: ["Meta Suite", "Buffer", "Canva", "Analytics"],
    cover: "/media/work-fashion.jpg",
    accent: "#9333EA",
    available: true,
    registrationOpen: true,
  },
  {
    key: "marketing",
    slug: "digital-marketing",
    name: "Digital Marketing",
    code: "DMVFD",
    tagline: "Real income tracks, not theory.",
    snippet:
      "An 8-week programme built around real, low-to-no-capital income tracks: China Importation, Affiliate Marketing, and Amazon Bounty Programmes — students graduate having completed real deliverables, not just theory.",
    icon: "trending",
    level: "Beginner",
    duration: "8 weeks",
    commitment: "5–7 hrs / week",
    seats: 35,
    mentorKey: "daniel",
    curriculum: CURRICULA.marketing,
    criteria: CERTIFICATION_CRITERIA.marketing,
    outcomes: [
      "A live affiliate account with a product library",
      "A documented pre-order importation cycle",
      "Ad copy and video content that converts",
      "A graduate path that needs little or no capital",
    ],
    tools: ["1688", "Amazon Associates", "Meta Ads", "AI tools"],
    cover: "/media/work-afristem.jpg",
    accent: "#B1862D",
    available: true,
    registrationOpen: true,
  },
];

export const trackBySlug = (slug: string) => TRACKS.find((t) => t.slug === slug);
export const trackByKey = (key: string) => TRACKS.find((t) => t.key === key);
export const trackName = (key: string) => trackByKey(key)?.name ?? key;
export const trackCode = (key: string) => trackByKey(key)?.code ?? "KR8";

/* ---------------------------------------------------------------
   Real graduate stories (21), from the production testimonial wall.
   --------------------------------------------------------------- */
export type Testimonial = {
  id: string;
  name: string;
  skill: string;
  caption: string;
  img: string;
  video?: string;
  featured?: boolean;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "grant",
    name: "Grant Gideon",
    skill: "Graphic Design",
    caption:
      "KR8 Digitals is a digital academy that gives skills for free. The community helps you keep up with assignments and transition to professional design.",
    img: "/media/p-grant.jpg",
    featured: true,
  },
  {
    id: "maduka",
    name: "Maduka Samuel",
    skill: "Graphic Design",
    caption:
      "Zero cost for training, graduation, or certificate. The tutors take their time to review assignments and ensure you improve daily.",
    img: "/media/p-maduka.jpg",
    video: "/media/v-maduka.mp4",
    featured: true,
  },
  {
    id: "elizabeth",
    name: "Elizabeth Oyejobi",
    skill: "Tech & Design",
    caption:
      "Learning digital skills with KR8 Digitals has been life-changing — real tutors, real structure, and a community that refuses to let you quit.",
    img: "/media/p-elizabeth.jpg",
    video: "/media/v-elizabeth.mp4",
    featured: true,
  },
  {
    id: "peter",
    name: "Obo Peter",
    skill: "Video Editing & Motion",
    caption:
      "The consistency and practical drills at KR8 helped me master motion design. I now deliver work I am genuinely proud of.",
    img: "/media/p-peter.jpg",
    video: "/media/v-peter.mp4",
    featured: true,
  },
  {
    id: "chinenye",
    name: "Ibeh Chinenye Helen",
    skill: "Brand Design & Tech",
    caption:
      "The live classes, design reviews, and tutor guidance gave me the confidence to call myself a designer.",
    img: "/media/p-chinenye.jpg",
  },
  {
    id: "grace",
    name: "Afolayan Grace Taiwo",
    skill: "Digital Skills & Strategy",
    caption:
      "Learning with KR8 transformed how I approach creative problems. The feedback culture is the real magic.",
    img: "/media/p-grace.jpg",
  },
  {
    id: "nicz",
    name: "Bio Nicz",
    skill: "Video Editing & Content",
    caption:
      "From raw footage to professional storytelling — KR8 taught me the craft behind the cut.",
    img: "/media/p-nicz.jpg",
  },
  {
    id: "collins",
    name: "Adeola Collins",
    skill: "Graphic Design",
    caption:
      "At first I thought it was just another random WhatsApp group. Eight weeks later I had a portfolio.",
    img: "/media/p-1.jpg",
  },
  {
    id: "marvelous",
    name: "William Marvelous",
    skill: "Video Editing & Animation",
    caption:
      "The classes, practical drills, and tutor feedback pushed me to ship work instead of watching tutorials forever.",
    img: "/media/p-2.jpg",
  },
  {
    id: "adrian",
    name: "Adrian Washington",
    skill: "Brand Identity",
    caption:
      "KR8 Digitals transformed how I understand branding and creative strategy. The standard is genuinely international.",
    img: "/media/p-3.jpg",
  },
  {
    id: "amos",
    name: "Amos Blessing",
    skill: "Graphic Design",
    caption:
      "The tutors take their time to review assignments and ensure you improve daily. That is rare, and it is free.",
    img: "/media/p-4.jpg",
  },
  {
    id: "ebuka",
    name: "David Ebuka",
    skill: "Digital Skills & Design",
    caption:
      "I saw a WhatsApp status about KR8 Digitals and made enquiries. Best decision of my creative life.",
    img: "/media/p-5.jpg",
  },
  {
    id: "precious",
    name: "Calistus Precious",
    skill: "Content Creation & Design",
    caption:
      "Before KR8, I had zero digital skills. The structured timetable and accountability kept me moving.",
    img: "/media/p-6.jpg",
  },
  {
    id: "emmanuel",
    name: "Emmanuel Nweke",
    skill: "Website Development",
    caption:
      "Graduating from KR8 Digitals, I learned practical web development and how to actually deploy a site.",
    img: "/media/p-7.jpg",
  },
  {
    id: "chisom",
    name: "Onyenaturuchi Chisom Mbanu",
    skill: "Video & Social Media",
    caption:
      "I can create high-impact videos myself and I am proud of it. That confidence is worth more than the certificate.",
    img: "/media/p-8.jpg",
  },
  {
    id: "blessing",
    name: "Blessing Ogbonna",
    skill: "Graphic Design",
    caption:
      "I joined KR8 Digitals without knowing what to expect. The assignments built me from the ground up.",
    img: "/media/p-9.jpg",
  },
  {
    id: "prosper",
    name: "Prosper Chukwu",
    skill: "Digital Marketing",
    caption:
      "Saw a flyer on WhatsApp for the KR8 Digitals Tribe. The community alone is worth joining.",
    img: "/media/p-10.jpg",
  },
  {
    id: "esther",
    name: "Esther Adeyemi",
    skill: "Social Media Strategy",
    caption:
      "KR8 Digitals opened my eyes to how digital skills create direct income, not just followers.",
    img: "/media/p-11.jpg",
  },
  {
    id: "blessed",
    name: "Blessed Ayemere Well",
    skill: "Graphic Design & Animation",
    caption:
      "KR8 Digitals equipped me with practical tools I use every single day with clients.",
    img: "/media/p-12.jpg",
  },
  {
    id: "charity",
    name: "Charity Okon",
    skill: "Content Creation",
    caption:
      "When a friend posted KR8 Digitals on her status, I wondered if it was real. It was, and it changed my year.",
    img: "/media/p-13.jpg",
  },
  {
    id: "somto",
    name: "Somtochukwu Favour",
    skill: "Graphic Design",
    caption:
      "A friend told me about KR8 Digitals Tribe. I showed them my work and they helped me price it properly.",
    img: "/media/p-14.jpg",
  },
];

export const FEATURED_TESTIMONIALS = TESTIMONIALS.filter((t) => t.featured);

/* Cohort facts used across the marketing pages — kept honest and editable. */
export const ACADEMY_STATS = [
  { label: "Tuition, forever", value: "₦0" },
  { label: "Skill tracks", value: "7" },
  { label: "Weeks per cohort", value: "8" },
  { label: "Graduates & counting", value: "772+" },
];

export const PILLARS = [
  {
    title: "Live, not lonely",
    body: "Two live sessions every week with the practitioner who actually does the work. Recordings and resources stay in your dashboard.",
    icon: "radio" as const,
  },
  {
    title: "Proof over paper",
    body: "You graduate with a deployed portfolio, a verified KR8 ID and a certificate anyone can check in one click.",
    icon: "badge" as const,
  },
  {
    title: "Accountability built in",
    body: "Weekly submissions, attendance tracking and a leaderboard that rewards showing up — not just talent.",
    icon: "flame" as const,
  },
  {
    title: "Free means free",
    body: "No tuition, no graduation fee, no certificate fee. KR8 Academy is funded by the agency side of KR8 Digitals.",
    icon: "heart" as const,
  },
];

export const ADMISSION_STEPS = [
  {
    step: "01",
    title: "Apply in 3 minutes",
    body: "Tell us who you are, where you are, and which track you want. One application, no essay gauntlet.",
  },
  {
    step: "02",
    title: "Claim your KR8 ID",
    body: "Your unique, verifiable student identity. It appears on your dashboard, your certificate and your public profile.",
  },
  {
    step: "03",
    title: "Show up and ship",
    body: "Live drills, weekly assignments, portfolio reviews. Attendance and submissions feed your XP and your rank.",
  },
  {
    step: "04",
    title: "Graduate with proof",
    body: "Meet the criteria and your certificate is issued — scannable, verifiable, downloadable as PDF, permanently checkable.",
  },
];
