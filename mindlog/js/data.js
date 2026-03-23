// MindLog — App Constants & Data
"use strict";

// ═══════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════
const SYSTEM_PROMPT = `You are a mental wellness AI for engineering college students. Analyse the journal entry below and return a JSON object. Be accurate — a happy entry must reflect low stress and positive emotions. A stressed entry must reflect high stress. Do NOT return the same generic result regardless of content.

Return ONLY this JSON with no extra text, no markdown, no code blocks:
{
  "stress_level": <integer 1-10, where 1=completely relaxed, 10=extremely stressed>,
  "stress_reasoning": "<one sentence explaining the score based on what the student wrote>",
  "dominant_emotion": "<MUST be one of exactly: anxious, overwhelmed, lonely, burnt_out, motivated, neutral, sad, frustrated, hopeful, calm>",
  "emotion_reasoning": "<one sentence explaining why this emotion fits what was written>",
  "root_cause_tag": "<MUST be one of exactly: academic, social, family, health, financial, multiple, unclear>",
  "energy_level": "<MUST be one of exactly: low, medium, high>",
  "energy_pct": <integer 0-100 matching the energy level: low=10-35, medium=36-65, high=66-95>,
  "summary": "<2 sentences directly addressing the student about their specific day — must reference what they actually wrote>",
  "positive_signal": "<one genuine observation of something good — even in a bad day find something real>",
  "needs": ["<need1>", "<need2>"],
  "weekly_insight": "<2 sentences of insight referencing the specific content of their entry>",
  "action_title": "<4 words max — specific to their situation>",
  "action_desc": "<one concrete, specific action sentence tailored to what they wrote>"
}

NEEDS must only be chosen from: relaxation, social_connection, academic_support, physical_movement, creative_outlet, sleep, emotional_validation, focus_reset, family_contact, professional_support

CRITICAL RULES:
- A productive/happy entry: stress_level 1-3, dominant_emotion = motivated/hopeful/calm
- A lonely/sad entry: stress_level 4-6, dominant_emotion = lonely/sad
- A stressed/overwhelmed entry: stress_level 7-10, dominant_emotion = anxious/overwhelmed/burnt_out
- summary and action_desc MUST reference specific details from what the student wrote
- Return ONLY the JSON object. No text before or after it.`;

const MOOD_LABELS = [
  "",
  "Very poor 😭",
  "Poor 😢",
  "Low 😟",
  "Below average 😕",
  "Neutral 😐",
  "Okay 🙂",
  "Good 😊",
  "Very good 😄",
  "Great 🤩",
  "Excellent 🥳",
];
const DAILY_PROMPTS = [
  '"What has been weighing on your mind today?"',
  '"Describe the emotional tone of your day in a few sentences."',
  '"What challenged you most today, and how did you respond?"',
  '"Reflect on one interaction today — what did it bring up for you?"',
  '"What are you proud of today, however small?"',
  '"If your day had a colour, what would it be and why?"',
];

const DEMO_ENTRIES = {
  stressed: {
    mood: 3,
    text: "Today was difficult. I had an assignment deadline I almost missed, and my professor mentioned it in front of the entire class. I couldn't focus after that. I've been sleeping poorly all week and haven't spoken to my family in almost two weeks. I feel behind on everything and I'm not sure where to even begin catching up.",
  },
  motivated: {
    mood: 8,
    text: "Today actually went well. I woke up early and managed to complete most of my planned study sessions. Had a good conversation with a friend over lunch. Called home in the evening — it was a shorter call but it felt grounding. I feel like I finally have some momentum. I want to keep this up.",
  },
  lonely: {
    mood: 4,
    text: "Everyone seems to have their social circles and plans. I sat alone during dinner and nobody really checked in. I'm not sure if it's me or just the way things are, but I feel increasingly disconnected. My coursework is okay but even that feels hollow right now. I miss having people who feel like home.",
  },
};

const DEMO_RESPONSE = {
  stress_level: 7,
  dominant_emotion: "overwhelmed",
  root_cause_tag: "academic",
  energy_level: "low",
  energy_pct: 22,
  stress_reasoning:
    "The combination of academic pressure and social isolation has created a compounding burden that is difficult to manage alone.",
  emotion_reasoning:
    "Multiple unresolved stressors — deadlines, sleep deprivation, and limited connection — are contributing to a sense of being overwhelmed.",
  summary:
    "Today was genuinely difficult, and it makes sense that you feel stretched thin. Recognising that and choosing to reflect on it is itself an act of self-awareness that matters.",
  positive_signal:
    "The fact that you took time to write today suggests an underlying resilience and commitment to your own wellbeing.",
  needs: ["relaxation", "academic_support", "sleep"],
  weekly_insight:
    "Your stress pattern appears primarily academic in origin, but the lack of social connection is amplifying its impact. Addressing both — even with small steps — tends to have an outsized positive effect.",
  action_title: "Complete one small task",
  action_desc:
    "Identify the smallest actionable item on your to-do list and complete only that — building momentum through a single, concrete step is often the most effective way to begin.",
};

const CRISIS_KEYWORDS = [
  "suicide",
  "suicidal",
  "end my life",
  "hurt myself",
  "harm myself",
  "self-harm",
  "kill myself",
  "don't want to be here",
];

const NEEDS_DB = {
  relaxation: {
    emoji: "🌿",
    label: "Stress Relief",
    color: "#81B29A",
    bg: "#E8F4EE",
    items: [
      "4-7-8 Breathing technique — 4 minutes",
      "Lo-fi ambient study playlist",
      "Guided body scan meditation",
    ],
    doctors: ["emma", "kati", "drjulie"],
  },
  academic_support: {
    emoji: "📚",
    label: "Academic Recovery",
    color: "#E07A5F",
    bg: "#FDF5F2",
    items: [
      "Pomodoro session — 25 min focus, 5 min break",
      "Brain dump: write every pending task on paper",
      "Identify the single most important task for today",
    ],
    doctors: ["huberman", "adhd", "braincraft"],
  },
  social_connection: {
    emoji: "🤝",
    label: "Social Reconnection",
    color: "#81B29A",
    bg: "#E8F4EE",
    items: [
      "Call or message a family member — 10 minutes",
      "Reach out to one friend you haven't spoken to recently",
      "Spend time in a shared space, even without conversation",
    ],
    doctors: ["matthias", "kati", "healthygamer"],
  },
  emotional_validation: {
    emoji: "💜",
    label: "Emotional Processing",
    color: "#9B8BB4",
    bg: "#F0EAF8",
    items: [
      "Name It to Tame It — write your emotion and its cause",
      "Guided emotional awareness journal prompt",
      "Self-compassion break — 5 minutes",
    ],
    doctors: ["nicole", "kati", "drjulie"],
  },
  sleep: {
    emoji: "😴",
    label: "Sleep Improvement",
    color: "#7BA7BC",
    bg: "#E8F2F8",
    items: [
      "Screens off 30 minutes before sleep",
      "Sleep sounds or white noise playlist",
      "Keep room dark and at a comfortable temperature",
    ],
    doctors: ["huberman", "emma", "psychhub"],
  },
  focus_reset: {
    emoji: "🎯",
    label: "Focus Restoration",
    color: "#E07A5F",
    bg: "#FDF5F2",
    items: [
      "2-Minute Rule: act immediately on anything under 2 minutes",
      "Brain dump on paper to clear mental clutter",
      "5-minute grounding exercise: 5-4-3-2-1 senses",
    ],
    doctors: ["huberman", "adhd", "emma"],
  },
  physical_movement: {
    emoji: "🏃",
    label: "Physical Activation",
    color: "#F2CC8F",
    bg: "#FEF8EC",
    items: [
      "7-minute bodyweight workout — no equipment needed",
      "10-minute walk without your phone",
      "5-minute stretching sequence",
    ],
    doctors: ["huberman", "nicole", "teded"],
  },
  family_contact: {
    emoji: "🏠",
    label: "Family Connection",
    color: "#E07A5F",
    bg: "#FDF5F2",
    items: [
      "Call home — even a brief conversation makes a difference",
      "Write 5 things you are grateful for about your family",
      "Look at a comforting photo from home",
    ],
    doctors: ["matthias", "kati", "nicole"],
  },
  creative_outlet: {
    emoji: "🎨",
    label: "Creative Expression",
    color: "#81B29A",
    bg: "#E8F4EE",
    items: [
      "Sketch or doodle freely for 10 minutes",
      "Curate a music playlist that reflects how you feel",
      "Free writing — no structure, no judgement",
    ],
    doctors: ["psych2go", "ali", "braincraft"],
  },
  professional_support: {
    emoji: "💚",
    label: "Professional Support",
    color: "#5F9580",
    bg: "#E8F4EE",
    items: [
      "iCall Free Counselling: 9152987821",
      "Student Counselling Cell — confidential and free",
      "Explore online therapy options",
    ],
    doctors: ["psychhub", "healthygamer", "drramani"],
  },
};

const EMOTIONS = {
  overwhelmed: { emoji: "😵", color: "#E07A5F", label: "Overwhelmed" },
  anxious: { emoji: "😰", color: "#F2CC8F", label: "Anxious" },
  lonely: { emoji: "😔", color: "#7BA7BC", label: "Lonely" },
  burnt_out: { emoji: "🥱", color: "#C48B7A", label: "Burnt Out" },
  motivated: { emoji: "💪", color: "#81B29A", label: "Motivated" },
  neutral: { emoji: "😐", color: "#A8AAC0", label: "Neutral" },
  sad: { emoji: "😢", color: "#7BA7BC", label: "Sad" },
  frustrated: { emoji: "😤", color: "#E07A5F", label: "Frustrated" },
  hopeful: { emoji: "🌟", color: "#F2CC8F", label: "Hopeful" },
  calm: { emoji: "😌", color: "#81B29A", label: "Calm" },
};

const DOCTORS = {
  kati: {
    emoji: "💙",
    name: "Kati Morton",
    cred: "Licensed Therapist (LMFT)",
    specialty: "Anxiety, depression and eating disorders",
    subs: "1.16M",
    color: "#7BA7BC",
    bg: "#E8F2F8",
    tag: "Therapy",
    url: "https://www.youtube.com/@KatiMorton",
  },
  nicole: {
    emoji: "🌿",
    name: "Dr. Nicole LePera",
    cred: "Clinical Psychologist (Cornell)",
    specialty: "Trauma recovery, self-healing and mind-body",
    subs: "817K",
    color: "#81B29A",
    bg: "#E8F4EE",
    tag: "Holistic",
    url: "https://www.youtube.com/@theholisticpsychologist",
  },
  huberman: {
    emoji: "🔬",
    name: "Andrew Huberman",
    cred: "Neuroscientist, Stanford University",
    specialty: "Sleep, stress, dopamine regulation and focus",
    subs: "6M+",
    color: "#E07A5F",
    bg: "#FDF5F2",
    tag: "Neuroscience",
    url: "https://www.youtube.com/@hubermanlab",
  },
  emma: {
    emoji: "🧩",
    name: "Emma McAdam",
    cred: "Licensed MFT — Therapy in a Nutshell",
    specialty: "CBT tools for anxiety and depression",
    subs: "1M",
    color: "#9B8BB4",
    bg: "#F0EAF8",
    tag: "CBT Tools",
    url: "https://www.youtube.com/@TherapyinaNutshell",
  },
  matthias: {
    emoji: "🤝",
    name: "Matthias J. Barker",
    cred: "Clinical Psychotherapist",
    specialty: "Grief, burnout and relationship dynamics",
    subs: "500K+",
    color: "#E07A5F",
    bg: "#FDF5F2",
    tag: "Relationships",
    url: "https://www.youtube.com/@matthiasjbarker",
  },
  ali: {
    emoji: "🎓",
    name: "Dr. Ali Mattu",
    cred: "Clinical Psychologist (Columbia)",
    specialty: "Psychology explained through pop culture",
    subs: "221K",
    color: "#7BA7BC",
    bg: "#E8F2F8",
    tag: "Psychology",
    url: "https://www.youtube.com/@DocAliMattu",
  },
  kirk: {
    emoji: "🗣️",
    name: "Dr. Kirk Honda",
    cred: "Licensed Therapist & Professor",
    specialty: "In-depth discussions on mental health topics",
    subs: "419K",
    color: "#9B8BB4",
    bg: "#F0EAF8",
    tag: "Deep Dives",
    url: "https://www.youtube.com/@PsychologyInSeattle",
  },
  psych2go: {
    emoji: "🎬",
    name: "Psych2Go",
    cred: "Psychology Media Organisation",
    specialty: "Animated, beginner-friendly psychology content",
    subs: "10M+",
    color: "#E07A5F",
    bg: "#FDF5F2",
    tag: "Animated",
    url: "https://www.youtube.com/@Psych2Go",
  },
  adhd: {
    emoji: "⚡",
    name: "How to ADHD",
    cred: "Creator — Jessica McCabe",
    specialty: "ADHD management, focus and organisation",
    subs: "1.1M",
    color: "#F2CC8F",
    bg: "#FEF8EC",
    tag: "ADHD & Focus",
    url: "https://www.youtube.com/@HowtoADHD",
  },
  anxiety: {
    emoji: "😮",
    name: "The Anxiety Guy",
    cred: "Coach — Dennis Simsek",
    specialty: "Managing anxiety, panic attacks and stress",
    subs: "300K+",
    color: "#81B29A",
    bg: "#E8F4EE",
    tag: "Anxiety",
    url: "https://www.youtube.com/@TheAnxietyGuy",
  },
  psychhub: {
    emoji: "🏥",
    name: "Psych Hub",
    cred: "Founded by Marjorie Morrison",
    specialty: "Professional education on mental health topics",
    subs: "200K+",
    color: "#81B29A",
    bg: "#E8F4EE",
    tag: "Education",
    url: "https://www.youtube.com/@PsychHub",
  },
  teded: {
    emoji: "💡",
    name: "TED-Ed Psychology",
    cred: "TED Education Platform",
    specialty: "High-quality animated psychology explainers",
    subs: "18M+",
    color: "#E07A5F",
    bg: "#FDF5F2",
    tag: "Concepts",
    url: "https://www.youtube.com/@TEDEd",
  },
  healthygamer: {
    emoji: "🎮",
    name: "HealthyGamerGG",
    cred: "Dr. Alok Kanojia, Psychiatrist (Harvard)",
    specialty:
      "Gaming, identity, motivation and mental health for young people",
    subs: "1.7M+",
    color: "#6C7FD8",
    bg: "#EEEFFE",
    tag: "Psychiatry",
    url: "https://www.youtube.com/@HealthyGamerGG",
  },
  drjulie: {
    emoji: "📔",
    name: "Dr. Julie Smith",
    cred: "Clinical Psychologist & Author",
    specialty:
      "Journaling, emotional regulation and everyday mental health tools",
    subs: "900K+",
    color: "#D4617E",
    bg: "#FEF0F4",
    tag: "Journaling",
    url: "https://www.youtube.com/@DrJulieSmith",
  },
  braincraft: {
    emoji: "🧬",
    name: "BrainCraft",
    cred: "Vanessa Hill, Science Communicator",
    specialty: "Neuroscience, brain performance and behaviour explained simply",
    subs: "800K+",
    color: "#81B29A",
    bg: "#E8F4EE",
    tag: "Neuroscience",
    url: "https://www.youtube.com/@braincraft",
  },
  apa: {
    emoji: "🏛️",
    name: "American Psychological Association",
    cred: "APA — Official Psychology Body",
    specialty: "Evidence-based mental health education and research insights",
    subs: "150K+",
    color: "#6C7FD8",
    bg: "#EEEFFE",
    tag: "Research",
    url: "https://www.youtube.com/@APAVideo",
  },
  drramani: {
    emoji: "💜",
    name: "DoctorRamani",
    cred: "Dr. Ramani Durvasula, Clinical Psychologist",
    specialty: "Narcissism, toxic relationships and trauma recovery",
    subs: "1.3M+",
    color: "#9B8BB4",
    bg: "#F0EAF8",
    tag: "Psychiatry",
    url: "https://www.youtube.com/@DoctorRamani",
  },
};

const EXPERT_CATS = {
  all: Object.keys(DOCTORS),
  therapists: [
    "kati",
    "nicole",
    "emma",
    "matthias",
    "ali",
    "kirk",
    "drjulie",
    "drramani",
  ],
  science: ["huberman", "teded", "braincraft", "apa"],
  animated: ["psych2go", "psychhub"],
  niche: ["adhd", "anxiety", "healthygamer"],
  psychiatry: ["healthygamer", "drramani", "kirk"],
};

// ═══ LANDING + ONBOARDING + HOME (NEW) ═══

const SK_USER = "mindlog_user";
const SK_UP = "mindlog_upcoming";
const ML_KEY = "ml_key";
const GMODEL = "gemini-2.5-flash";
const GBASE = "https://generativelanguage.googleapis.com/v1beta/models/";

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(SK_USER) || "null");
  } catch {
    return null;
  }
};
const getUpcoming = () => {
  try {
    return JSON.parse(localStorage.getItem(SK_UP) || "[]");
  } catch {
    return [];
  }
};
const getApiKey = () => sessionStorage.getItem(ML_KEY) || "";

const DAILY_PROMPTS_H = [
  "What has been the heaviest thing on your mind today?",
  "Describe one moment today that made you feel something — anything.",
  "What are you carrying right now that you haven't told anyone?",
  "If your day were a weather report, what would it say?",
  "What challenged you today, and how did you show up for it?",
  "Who or what gave you energy today — and what drained it?",
  "What do you wish had gone differently today?",
];

const EXPERT_MAP_H = {
  anxious: "kati",
  overwhelmed: "emma",
  lonely: "matthias",
  burnt_out: "nicole",
  motivated: "huberman",
  sad: "kati",
  frustrated: "matthias",
  hopeful: "huberman",
  calm: "teded",
  neutral: "psych2go",
};
const DOCS_H = {
  kati: {
    emoji: "💙",
    name: "Kati Morton",
    cred: "Licensed Therapist (LMFT)",
    spec: "Anxiety, depression and eating disorders",
    subs: "1.16M",
    c: "#7BA7BC",
    bg: "#E8F2F8",
    tag: "Therapy",
    url: "https://www.youtube.com/@KatiMorton",
  },
  nicole: {
    emoji: "🌿",
    name: "Dr. Nicole LePera",
    cred: "Clinical Psychologist (Cornell)",
    spec: "Trauma recovery, self-healing and mind-body",
    subs: "817K",
    c: "#81B29A",
    bg: "#E8F4EE",
    tag: "Holistic",
    url: "https://www.youtube.com/@theholisticpsychologist",
  },
  huberman: {
    emoji: "🔬",
    name: "Andrew Huberman",
    cred: "Neuroscientist, Stanford",
    spec: "Sleep, stress, dopamine and focus",
    subs: "6M+",
    c: "#E07A5F",
    bg: "#FDF5F2",
    tag: "Neuroscience",
    url: "https://www.youtube.com/@hubermanlab",
  },
  emma: {
    emoji: "🧩",
    name: "Emma McAdam",
    cred: "Licensed MFT",
    spec: "CBT tools for anxiety and depression",
    subs: "1M",
    c: "#9B8BB4",
    bg: "#F0EAF8",
    tag: "CBT Tools",
    url: "https://www.youtube.com/@TherapyinaNutshell",
  },
  matthias: {
    emoji: "🤝",
    name: "Matthias J. Barker",
    cred: "Clinical Psychotherapist",
    spec: "Grief, burnout and relationship dynamics",
    subs: "500K+",
    c: "#E07A5F",
    bg: "#FDF5F2",
    tag: "Relationships",
    url: "https://www.youtube.com/@matthiasjbarker",
  },
  teded: {
    emoji: "💡",
    name: "TED-Ed Psychology",
    cred: "TED Education Platform",
    spec: "Animated psychology explainers",
    subs: "18M+",
    c: "#E07A5F",
    bg: "#FDF5F2",
    tag: "Concepts",
    url: "https://www.youtube.com/@TEDEd",
  },
  psych2go: {
    emoji: "🎬",
    name: "Psych2Go",
    cred: "Psychology Media Organisation",
    spec: "Beginner-friendly psychology content",
    subs: "10M+",
    c: "#E07A5F",
    bg: "#FDF5F2",
    tag: "Animated",
    url: "https://www.youtube.com/@Psych2Go",
  },
};
const PROMPTS_H = [
  '"What is one thing weighing on your mind right now?"',
  '"Describe the emotional tone of your day so far."',
  '"What challenged you most today, and how did you respond?"',
  '"Reflect on one interaction today — what did it bring up for you?"',
  '"What are you proud of today, however small?"',
  '"If your day had a colour, what would it be and why?"',
  '"What would you do differently if you could replay today?"',
];
const GREET_MSGS_H = {
  overwhelmed: (n) =>
    `Yesterday felt heavy. Today is a new page, ${n} — one small step is enough.`,
  anxious: (n) =>
    `It's okay to feel uncertain. You showed up yesterday — and you're here again today, ${n}.`,
  lonely: (n) =>
    `Reaching out — even in writing — takes courage. You did that, ${n}. That matters.`,
  burnt_out: (n) =>
    `Rest is productive too, ${n}. You recognised how you felt — that's the first step.`,
  motivated: (n) =>
    `You had a strong day yesterday, ${n}. Let's carry that forward.`,
  hopeful: (n) =>
    `Yesterday you found something to hold onto. Carry that with you today, ${n}.`,
  calm: (n) =>
    `You carried calm energy yesterday, ${n}. Let that set the tone for today.`,
  sad: (n) =>
    `It's okay to have hard days, ${n}. You're here — and that is enough.`,
  frustrated: (n) =>
    `Frustration signals you care deeply, ${n}. Channel that energy today.`,
  neutral: (n) =>
    `A steady day yesterday, ${n}. Today is another opportunity to check in with yourself.`,
};
