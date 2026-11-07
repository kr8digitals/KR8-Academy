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
  level: "Beginner → Advanced";
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
  {
    key: "nicodemus",
    name: "Odobe Nicodemus C",
    shortName: "BioNicz",
    role: "Financial Strategist",
    title: "KR8 Financial Strategist",
    bio: "Supports KR8 Digitals with financial strategy, structure and sustainable growth thinking. Nicodemus keeps the tuition-free mission economically sound — so free seats stay free, cohort after cohort.",
    photo: "/team/nicodemus.jpg",
    trackKeys: [],
  },
  {
    key: "covenant",
    name: "Covenant Afinidi",
    shortName: "Covenant",
    role: "Accountability Partner",
    title: "Accountability Partner · Student Success",
    bio: "Helps the KR8 community keep showing up, following through and growing together. Covenant works directly with learners to hold momentum, unblock stuck weeks and make sure people reach graduation.",
    photo: "/team/covenant.jpg",
    trackKeys: [],
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
    level: "Beginner → Advanced",
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
    cover: "/media/cover-graphic.jpg",
    accent: "#CF1CAE",
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
    level: "Beginner → Advanced",
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
    cover: "/media/cover-video.jpg",
    accent: "#A82BE0",
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
    level: "Beginner → Advanced",
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
    cover: "/media/cover-web.jpg",
    accent: "#7A1FA8",
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
    level: "Beginner → Advanced",
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
    cover: "/media/cover-frontend.jpg",
    accent: "#BA2ACB",
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
    level: "Beginner → Advanced",
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
    cover: "/media/cover-content.jpg",
    accent: "#D4239C",
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
    level: "Beginner → Advanced",
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
    cover: "/media/cover-social.jpg",
    accent: "#8F2FC4",
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
    level: "Beginner → Advanced",
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
    cover: "/media/cover-marketing.jpg",
    accent: "#B8159C",
    available: true,
    registrationOpen: true,
  },
];

export const trackBySlug = (slug: string) => TRACKS.find((t) => t.slug === slug);
export const trackByKey = (key: string) => TRACKS.find((t) => t.key === key);
export const trackName = (key: string) =>
  key === "academic" ? "Academics · Next Gen Scholars" : trackByKey(key)?.name ?? key;
export const trackCode = (key: string) => (key === "academic" ? "ACA" : trackByKey(key)?.code ?? "KR8");

/* ---------------------------------------------------------------
   Real graduate stories — all 21 filmed testimonials from the
   production KR8 Digitals site, with their poster frames and the
   timed captions that ship alongside each video.
   --------------------------------------------------------------- */
export type Testimonial = {
  id: string;
  name: string;
  /** School or cohort role, exactly as the graduate described it. */
  role: string;
  skill: string;
  caption: string;
  img: string;
  video: string;
  /** Seconds — used for the duration label on the player. */
  duration: number;
  captions: { start: number; end: number; text: string }[];
  featured?: boolean;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "grant-gideon",
    name: "Grant Gideon",
    role: "Federal University Dutse",
    skill: "Graphic Design",
    caption:
      "KR8 Digitals is a digital academy that gives skills for free. The community helps you keep up with assignments and transition to professional design.",
    img: "/media/testimonials/testimonial_grant_gideon_poster.jpg",
    video: "/media/testimonials/testimonial_grant_gideon.mp4",
    duration: 85,
    featured: true,
    captions: [
      { start: 0, end: 2.8, text: "My name is Grant Gideon, a student of Federal University Dutse." },
      { start: 3, end: 5.8, text: "And this is a shout-out to KR8 Digitals Tribe." },
      { start: 6, end: 10.3, text: "KR8 Digitals is a digital academy that teaches digital skills for free." },
      { start: 10.5, end: 15, text: "I just want to give a shout-out to them for being really great in my graphic design journey." },
      { start: 15.2, end: 23, text: "At first, I thought KR8 Digitals was just one of those normal digital skills academies that promise free things." },
      { start: 23.5, end: 29.5, text: "When I started my journey, moving along alone as a designer was tough." },
      { start: 29.8, end: 37, text: "Now with the presence of this community, fellow designers help you blend in and keep up with assignments." },
      { start: 37.5, end: 45, text: "We create real professional designs and stay consistent with our projects." },
      { start: 45.5, end: 54, text: "Thank you KR8 Digitals for making such good use of our time and providing great mentorship." },
      { start: 54.5, end: 64, text: "To all my friends, family, and anyone looking to acquire high-income skills — onboarding is ongoing!" },
      { start: 64.5, end: 74, text: "You can move from being a complete beginner to becoming a paid professional." },
      { start: 74, end: 84.5, text: "Join KR8 Digitals today and transform your skills. Thank you, and see you inside!" },
    ],
  },
  {
    id: "elizabeth-oyejobi",
    name: "Elizabeth Oyejobi",
    role: "Cohort Student",
    skill: "Tech & Design",
    caption:
      "Learning digital skills with KR8 Digitals has been life-changing — real tutors, real structure, and a community that refuses to let you quit.",
    img: "/media/testimonials/testimonial_elizabeth_oyejobi_poster.jpg",
    video: "/media/testimonials/testimonial_elizabeth_oyejobi.mp4",
    duration: 40,
    featured: true,
    captions: [
      { start: 0, end: 4.5, text: "Hello everyone, my name is Elizabeth Oyejobi, and I am proud to be a student at KR8 Digitals." },
      { start: 4.5, end: 10.5, text: "Learning practical digital skills here has been an eye-opening journey for me." },
      { start: 10.5, end: 18, text: "The classes, assignments, and tutors push you to build real projects that build confidence." },
      { start: 18, end: 26.5, text: "The supportive tech community makes complex skills easy to master step by step." },
      { start: 26.5, end: 34, text: "KR8 Digitals gives everyone an equal opportunity to thrive in the modern tech economy." },
      { start: 34, end: 39.5, text: "Thank you KR8 Digitals for this wonderful platform and mentorship!" },
    ],
  },
  {
    id: "maduka-samuel",
    name: "Maduka Samuel",
    role: "Cohort Graduate",
    skill: "Graphic Design",
    caption:
      "Zero cost for training, graduation, or certificate. The tutors take their time to review assignments and ensure you improve daily.",
    img: "/media/testimonials/testimonial_maduka_samuel_poster.jpg",
    video: "/media/testimonials/testimonial_maduka_samuel.mp4",
    duration: 65,
    featured: true,
    captions: [
      { start: 0, end: 3.2, text: "My name is Maduka Samuel, one of the cohort students at KR8 Digitals." },
      { start: 3.2, end: 8.5, text: "Before I got here, I was convinced by a friend to try KR8 Digitals." },
      { start: 8.5, end: 13.5, text: "It's a free course, and it has really been 100% free with zero hidden charges." },
      { start: 13.5, end: 19.5, text: "I never believed it at first, but an instinct of mine told me to give it a try." },
      { start: 19.5, end: 24.5, text: "I chose Graphic Design as the skill I wanted to learn, and the experience has been amazing." },
      { start: 24.5, end: 30, text: "I want to say a very big thank you to everyone who guided me, all the tutors at KR8 Digitals." },
      { start: 30, end: 38.5, text: "For anyone out there who wants to learn a high-demand skill for free, with zero cost in training or graduation." },
      { start: 38.5, end: 45, text: "No cost for certificates — it is truly an amazing learning experience." },
      { start: 45, end: 50, text: "I highly recommend everyone to choose KR8 Digitals." },
      { start: 50, end: 56.5, text: "Lastly, I want to invite you all to my graduation coming up very soon!" },
      { start: 56.5, end: 65, text: "I'll be very happy to see you all there. Thank you, and have a nice day!" },
    ],
  },
  {
    id: "afolayan-grace",
    name: "Afolayan Grace Taiwo",
    role: "Cohort Student",
    skill: "Digital Skills & Strategy",
    caption:
      "Learning with KR8 transformed how I approach creative problems. The feedback culture is the real magic.",
    img: "/media/testimonials/testimonial_afolayan_grace_poster.jpg",
    video: "/media/testimonials/testimonial_afolayan_grace.mp4",
    duration: 102,
    featured: true,
    captions: [
      { start: 0, end: 5, text: "My name is Afolayan Grace Taiwo, a student at KR8 Digitals." },
      { start: 5, end: 16, text: "KR8 Digitals has really opened my eyes to the power of practical digital skills and teamwork." },
      { start: 16, end: 32, text: "The lessons are direct, hands-on, and the tutors give real-time feedback on your assignments." },
      { start: 32, end: 50, text: "If you want to build a career in tech or design, you don't need millions — KR8 teaches free." },
      { start: 50, end: 70, text: "Being part of this creative tribe keeps you accountable and motivated every single week." },
      { start: 70, end: 88, text: "I am grateful to KR8 Digitals and the leadership for giving us this life-changing opportunity." },
      { start: 88, end: 102, text: "Join the KR8 Tribe today, level up your skills, and let's win together!" },
    ],
  },
  {
    id: "bio-nicz",
    name: "Bio Nicz",
    role: "Cohort Creator",
    skill: "Video Editing & Content",
    caption:
      "From raw footage to professional storytelling — KR8 taught me the craft behind the cut.",
    img: "/media/testimonials/testimonial_bio_nicz_poster.jpg",
    video: "/media/testimonials/testimonial_bio_nicz.mp4",
    duration: 191,
    featured: true,
    captions: [
      { start: 0, end: 8, text: "Hello everyone, my name is Bio Nicz, video editor and creator at KR8 Digitals." },
      { start: 8, end: 25, text: "Learning video editing here took my skills from basic cuts to storytelling and high-impact pacing." },
      { start: 25, end: 55, text: "The community pushes you to produce client-grade work, and the mentors break down complex tools." },
      { start: 55, end: 85, text: "Every project we handled was built to prepare us for real client contracts and the freelance market." },
      { start: 85, end: 125, text: "KR8 Digitals is genuinely building the next generation of creative powerhouses across Africa." },
      { start: 125, end: 165, text: "Special appreciation to our instructors, Timfire, and the entire leadership team for this vision." },
      { start: 165, end: 191, text: "If you have a creative dream, take action now — start learning free with KR8 Digitals." },
    ],
  },
  {
    id: "ibeh-chinenye",
    name: "Ibeh Chinenye Helen",
    role: "Cohort Graduate",
    skill: "Brand Design & Tech",
    caption:
      "The live classes, design reviews, and tutor guidance gave me the confidence to call myself a designer.",
    img: "/media/testimonials/testimonial_ibeh_chinenye_poster.jpg",
    video: "/media/testimonials/testimonial_ibeh_chinenye.mp4",
    duration: 91,
    featured: true,
    captions: [
      { start: 0, end: 6, text: "Hello, my name is Ibeh Chinenye Helen, learning brand design with KR8 Digitals." },
      { start: 6, end: 22, text: "The journey so far has been nothing short of transformative for my creative thinking." },
      { start: 22, end: 45, text: "The live classes, design reviews, and tutor guidance gave me the confidence to handle client work." },
      { start: 45, end: 68, text: "You are not alone in the tribe; everyone helps you solve design blocks and finish your assignments." },
      { start: 68, end: 82, text: "Thank you KR8 Digitals for providing free, world-class education for passionate African youths." },
      { start: 82, end: 91, text: "Don't sleep on this opportunity — register and join the tribe today!" },
    ],
  },
  {
    id: "obo-peter",
    name: "Obo Peter",
    role: "Cohort Student",
    skill: "Video Editing & Motion",
    caption:
      "The consistency and practical drills at KR8 helped me master motion design. I now deliver work I am genuinely proud of.",
    img: "/media/testimonials/testimonial_obo_peter_poster.jpg",
    video: "/media/testimonials/testimonial_obo_peter.mp4",
    duration: 86,
    featured: true,
    captions: [
      { start: 0, end: 7, text: "My name is Obo Peter, a video editing and motion student at KR8 Digitals." },
      { start: 7, end: 24, text: "Before joining KR8, I struggled with video editing software and project consistency." },
      { start: 24, end: 45, text: "The hands-on curriculum, weekly drills, and supportive tutors changed everything for me." },
      { start: 45, end: 68, text: "I can now edit professional videos, reels, and promo clips with speed and precision." },
      { start: 68, end: 80, text: "A massive shout-out to KR8 Digitals for giving us the best training without paying a dime." },
      { start: 80, end: 86, text: "KR8 Digitals is the real deal — join us today!" },
    ],
  },
  {
    id: "new-1",
    name: "Adeola Collins",
    role: "Cohort Student",
    skill: "Graphic Design",
    caption:
      "At first I thought it was just another random WhatsApp group. Eight weeks later I had a portfolio.",
    img: "/media/testimonials/testimonial_new_1_poster.jpg",
    video: "/media/testimonials/testimonial_new_1.mp4",
    duration: 114,
    featured: true,
    captions: [
      { start: 0, end: 4.5, text: "I'm excited to share with you my experience with KR8 Digitals." },
      { start: 4.5, end: 11, text: "Several months ago I came across KR8 Digitals when someone shared their link in a group." },
      { start: 11, end: 18, text: "At first I thought it was just one random free WhatsApp class that only teaches basic things." },
      { start: 18, end: 26, text: "But when I joined, they introduced structured assignments and real design feedback." },
      { start: 26, end: 35, text: "100% free with dedicated tutors who guide you step by step." },
    ],
  },
  {
    id: "new-2",
    name: "William Marvelous",
    role: "Cohort Student",
    skill: "Video Editing & Animation",
    caption:
      "The classes, practical drills, and tutor feedback pushed me to ship work instead of watching tutorials forever.",
    img: "/media/testimonials/testimonial_new_2_poster.jpg",
    video: "/media/testimonials/testimonial_new_2.mp4",
    duration: 266,
    captions: [
      { start: 0, end: 5, text: "Hello everyone, my name is William Marvelous and I'm a student of KR8 Digitals." },
      { start: 5, end: 12, text: "I heard about KR8 Digitals when I was just scrolling on my feed." },
      { start: 12, end: 20, text: "Learning video editing here has been an incredible experience with real hands-on projects." },
      { start: 20, end: 30, text: "The mentors guide you patiently through pacing, transitions, and industry techniques." },
      { start: 30, end: 42, text: "100% free with structured cohort assignments. Join KR8 Digitals today!" },
    ],
  },
  {
    id: "new-3",
    name: "Adrian Washington",
    role: "Cohort Graduate",
    skill: "Brand Identity & Graphic Design",
    caption:
      "KR8 Digitals transformed how I understand branding and creative strategy. The standard is genuinely international.",
    img: "/media/testimonials/testimonial_new_3_poster.jpg",
    video: "/media/testimonials/testimonial_new_3.mp4",
    duration: 304,
    captions: [
      { start: 0, end: 5, text: "Hello everyone, my name is Adrian Washington and I'd like to share my story with you." },
      { start: 5, end: 12, text: "It was a sunny afternoon when I saw an opportunity to join the creative tribe." },
      { start: 12, end: 22, text: "KR8 Digitals taught me valuable high-income branding principles completely free." },
      { start: 22, end: 32, text: "The mentors review your work thoroughly and show you how to design for real clients." },
      { start: 32, end: 45, text: "If you want to transform your creative career, join KR8 Digitals today!" },
    ],
  },
  {
    id: "new-4",
    name: "Amos Blessing",
    role: "Cohort Graduate",
    skill: "Graphic Design",
    caption:
      "The tutors take their time to review assignments and ensure you improve daily. That is rare, and it is free.",
    img: "/media/testimonials/testimonial_new_4_poster.jpg",
    video: "/media/testimonials/testimonial_new_4.mp4",
    duration: 137,
    captions: [
      { start: 0, end: 4.5, text: "Hello everyone, my name is Amos Blessing, one of the graduate students of KR8 Digitals." },
      { start: 4.5, end: 12, text: "I joined the Graphic Design cohort and the practical assignments pushed me to grow." },
      { start: 12, end: 20, text: "Thank you KR8 Digitals for giving us the platform to learn free of charge!" },
    ],
  },
  {
    id: "new-5",
    name: "David Ebuka",
    role: "Cohort Student",
    skill: "Digital Skills & Design",
    caption:
      "I saw a WhatsApp status about KR8 Digitals and made enquiries. Best decision of my creative life.",
    img: "/media/testimonials/testimonial_new_5_poster.jpg",
    video: "/media/testimonials/testimonial_new_5.mp4",
    duration: 156,
    captions: [
      { start: 0, end: 4, text: "Good day everyone, my name is David Ebuka." },
      { start: 4, end: 10.5, text: "I heard about KR8 Digitals from someone's WhatsApp status." },
      { start: 10.5, end: 18, text: "When I made inquiries, I found out it was a 100% free digital platform." },
      { start: 18, end: 26, text: "You learn high-demand digital skills with zero hidden charges." },
    ],
  },
  {
    id: "new-6",
    name: "Calistus Precious",
    role: "Cohort Student",
    skill: "Content Creation & Design",
    caption:
      "Before KR8, I had zero digital skills. The structured timetable and accountability kept me moving.",
    img: "/media/testimonials/testimonial_new_6_poster.jpg",
    video: "/media/testimonials/testimonial_new_6.mp4",
    duration: 209,
    captions: [
      { start: 0, end: 3.5, text: "Hello everyone, my name is Calistus Precious." },
      { start: 3.5, end: 10, text: "Before I joined KR8 Digitals, I had zero digital design skills." },
      { start: 10, end: 18, text: "The daily drills and mentor feedback helped me build real confidence." },
    ],
  },
  {
    id: "new-7",
    name: "Emmanuel Nweke",
    role: "Cohort Graduate",
    skill: "Web Development",
    caption:
      "Graduating from KR8 Digitals, I learned practical web development and how to actually deploy a site.",
    img: "/media/testimonials/testimonial_new_7_poster.jpg",
    video: "/media/testimonials/testimonial_new_7.mp4",
    duration: 83,
    captions: [
      { start: 0, end: 4, text: "Hello, to all the graduating students and tutors at KR8 Digitals." },
      { start: 4, end: 11, text: "Joining this cohort was the best decision for my tech journey." },
      { start: 11, end: 18, text: "We learned real development skills with zero financial barriers." },
    ],
  },
  {
    id: "new-8",
    name: "Onyenaturuchi Chisom Mbanu",
    role: "Cohort Student",
    skill: "Video Editing & Social Media",
    caption:
      "I can create high-impact videos myself and I am proud of it. That confidence is worth more than the certificate.",
    img: "/media/testimonials/testimonial_new_8_poster.jpg",
    video: "/media/testimonials/testimonial_new_8.mp4",
    duration: 120,
    captions: [
      { start: 0, end: 4, text: "My name is Onyenaturuchi Chisom Mbanu." },
      { start: 4, end: 10.5, text: "I can create these videos myself and I am really proud of it." },
      { start: 10.5, end: 18, text: "At first I was skeptical about free training, but they didn't collect a single dime." },
      { start: 18, end: 26, text: "They gave us the opportunity to practice, learn, and grow consistently." },
    ],
  },
  {
    id: "new-9",
    name: "Blessing Ogbonna",
    role: "Cohort Student",
    skill: "Graphic Design",
    caption:
      "I joined KR8 Digitals without knowing what to expect. The assignments built me from the ground up.",
    img: "/media/testimonials/testimonial_new_9_poster.jpg",
    video: "/media/testimonials/testimonial_new_9.mp4",
    duration: 96,
    captions: [
      { start: 0, end: 4, text: "Hello everyone, my name is Blessing." },
      { start: 4, end: 11, text: "I was invited randomly to KR8 Digitals and decided to check it out." },
      { start: 11, end: 19, text: "The graphic design classes opened my eyes to professional visual principles." },
    ],
  },
  {
    id: "new-10",
    name: "Prosper Chukwu",
    role: "Cohort Student",
    skill: "Digital Skills & Marketing",
    caption:
      "Saw a flyer on WhatsApp for the KR8 Digitals Tribe. The community alone is worth joining.",
    img: "/media/testimonials/testimonial_new_10_poster.jpg",
    video: "/media/testimonials/testimonial_new_10.mp4",
    duration: 65,
    captions: [
      { start: 0, end: 4, text: "Standing before you to share my experience with KR8 Digitals." },
      { start: 4, end: 11, text: "I got to know KR8 Tribe while going through WhatsApp status." },
      { start: 11, end: 18, text: "It was a flyer offering free digital skills training, and it delivered on every promise." },
    ],
  },
  {
    id: "new-11",
    name: "Esther Adeyemi",
    role: "Cohort Student",
    skill: "Social Media Strategy",
    caption:
      "KR8 Digitals opened my eyes to how digital skills create direct income, not just followers.",
    img: "/media/testimonials/testimonial_new_11_poster.jpg",
    video: "/media/testimonials/testimonial_new_11.mp4",
    duration: 44,
    captions: [
      { start: 0, end: 4, text: "Hello everyone, learning with KR8 Digitals has been inspiring." },
      { start: 4, end: 11, text: "The mentors break down digital marketing and social growth clearly." },
      { start: 11, end: 18, text: "Thank you KR8 Digitals for making high-value training accessible." },
    ],
  },
  {
    id: "new-12",
    name: "Blessed Ayemere Well",
    role: "Cohort Student",
    skill: "Graphic Design & Animation",
    caption:
      "KR8 Digitals equipped me with practical tools I use every single day with clients.",
    img: "/media/testimonials/testimonial_new_12_poster.jpg",
    video: "/media/testimonials/testimonial_new_12.mp4",
    duration: 61,
    captions: [
      { start: 0, end: 4, text: "Hello everyone, my name is Blessed Ayemere Well." },
      { start: 4, end: 11, text: "KR8 Digitals equipped me with professional design skills." },
      { start: 11, end: 18, text: "Zero cost for training, zero cost for certification, pure practical craft." },
    ],
  },
  {
    id: "new-13",
    name: "Charity Okon",
    role: "Cohort Student",
    skill: "Content Creation & Editing",
    caption:
      "When a friend posted KR8 Digitals on her status, I wondered if it was real. It was, and it changed my year.",
    img: "/media/testimonials/testimonial_new_13_poster.jpg",
    video: "/media/testimonials/testimonial_new_13.mp4",
    duration: 161,
    captions: [
      { start: 0, end: 4, text: "Good day everyone, my name is Charity." },
      { start: 4, end: 10.5, text: "When I heard about KR8 Digitals through a friend's status, I was curious." },
      { start: 10.5, end: 18, text: "I wondered how digital skills could be taught for free." },
      { start: 18, end: 26, text: "The instructors are patient, knowledgeable, and always ready to help." },
    ],
  },
  {
    id: "new-14",
    name: "Somtochukwu Favour",
    role: "Cohort Student",
    skill: "Graphic Design",
    caption:
      "A friend told me about KR8 Digitals Tribe. I showed them my work and they helped me price it properly.",
    img: "/media/testimonials/testimonial_new_14_poster.jpg",
    video: "/media/testimonials/testimonial_new_14.mp4",
    duration: 151,
    captions: [
      { start: 0, end: 4.5, text: "Hello everyone, my name is Somtochukwu, learning Graphic Design with KR8 Digitals." },
      { start: 4.5, end: 12, text: "I signed up for KR8 Digitals Tribe after a friend showed me the program." },
      { start: 12, end: 20, text: "When I showed my designs, the mentors gave me real practical feedback to improve." },
      { start: 20, end: 30, text: "The classes and community helped me level up my skills completely for free." },
    ],
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

/* ---------------------------------------------------------------
   Programme facts — the single source of truth for every cohort,
   date and schedule string the academy renders.
   --------------------------------------------------------------- */
export const PROGRAMME = {
  cohortName: "5th Cohort",
  cohortLabel: "Cohort 05",
  seatsPerTrack: 40,
  weeks: 8,
  beginnerWeeks: "Weeks 1–4",
  advancedWeeks: "Weeks 5–8",
  onboardingDay: "30 April",
  onboardingDate: "30 April 2027",
  classesBegin: "3 May",
  classesBeginDate: "3 May 2027",
  graduationDate: "26 June 2027",
  classDays: "Monday, Wednesday, Friday",
  classDaysShort: "Mon · Wed · Fri",
  classTime: "8:00–9:00pm WAT",
  classTimeShort: "8–9pm WAT",
  assignmentDays: "Tuesday, Thursday, Saturday",
  assignmentDaysShort: "Tue · Thu · Sat",
} as const;

export const PILLARS = [
  {
    title: "Live, not lonely",
    body: "Three live classes every week — Monday, Wednesday and Friday, 8–9pm — with the practitioner who actually does the work. Recordings and resources stay in your dashboard.",
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
