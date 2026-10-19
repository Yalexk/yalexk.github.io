// All of the site's content lives here. Edit this file to update the page.

const CONTENT = {
  name: "Alex Yecies",
  // Rotating phrases in the hero typewriter.
  roles: ["Advanced CS Student @ UNSW", "ML & NLP Builder", "Australian Flying Disc Rep"],
  tagline:
    "I'm studying Advanced Computer Science (Honours) at UNSW, currently on exchange at the University of Copenhagen. I build machine learning and NLP systems, from retrieval pipelines to sports outcome predictors.",
  resumeUrl: "", // e.g. "resume.pdf" — leave empty to hide the button

  links: {
    github: "https://github.com/Yalexk",
    linkedin: "https://www.linkedin.com/in/alexander-yecies",
    email: "", // e.g. "you@example.com" — leave empty to keep it off the page
  },

  about: [
    "I'm a Bachelor of Advanced Computer Science (Honours) student at the University of New South Wales in Sydney, holding a Distinction average. This semester I'm on exchange at the University of Copenhagen, taking Advanced Deep Learning and Advanced Natural Language Processing.",
    "Most of my project work sits at the intersection of ML and language: fine-tuning embedding models for retrieval, extracting entities from news text, and building end-to-end prediction pipelines. Outside of code, I represent Australia internationally in flying disc.",
  ],

  skills: [
    "Python",
    "PyTorch",
    "HuggingFace",
    "LangChain",
    "scikit-learn",
    "pandas",
    "NumPy",
    "Java",
    "C",
    "SQL",
    "TypeScript",
    "Bash",
    "Git",
    "Docker",
    "Databricks",
    "MongoDB",
  ],

  education: [
    {
      title: "Bachelor of Advanced Computer Science (Honours)",
      org: "University of New South Wales · Sydney, NSW",
      date: "Feb 2024 — Nov 2027",
      details: ["Distinction average"],
    },
    {
      title: "Exchange Program",
      org: "University of Copenhagen · Copenhagen, Denmark",
      date: "Aug 2026 — Feb 2027",
      details: ["Coursework in Advanced Deep Learning and Advanced Natural Language Processing"],
    },
  ],

  experience: [
    {
      title: "IT Support Analyst",
      org: "Taco Technologies · Alexandria, NSW",
      date: "Jan 2026 — Aug 2026",
      details: [
        "Resolved 150+ Tier 2 and 3 escalations across 50+ enterprise clients for print management software, working cases through to root cause across Windows, macOS and Linux",
        "Correlated application logs, server traces and network captures across distributed client environments, delivering permanent fixes and writing internal documentation to speed up repeat cases",
      ],
    },
    {
      title: "Retail Sales Assistant",
      org: "Provincial Home Living · Kensington, NSW",
      date: "May 2024 — Jun 2025",
      details: [
        "Delivered customer service in a fast-paced retail environment while managing full-time study and international athletic commitments",
      ],
    },
  ],

  projects: [
    {
      name: "NLP Football Outcome Predictor",
      description:
        "An end-to-end match outcome predictor over 25,000 matches. It uses BERT-large-NER on pre-match news to tag injury and suspension signals, then trains classifiers with a temporal train/test split and ablation studies on each feature layer. Work in progress.",
      tags: ["Python", "PyTorch", "NLP", "ML"],
      repo: "",
      demo: "",
    },
    {
      name: "RAG Engine for News QA",
      description:
        "A retrieval-augmented QA pipeline over 1.3M news articles, built in a 5-person team. I fine-tuned a SentenceTransformer embedding model on Google Compute Engine, published it to Hugging Face Hub, and built the n-gram baseline the transformer systems were benchmarked against.",
      tags: ["Python", "PyTorch", "NLP", "ML"],
      repo: "",
      demo: "",
    },
    {
      name: "Connect 4 AI Engine",
      description:
        "An unbeatable Connect 4 agent built in a 4-person team. It uses minimax with alpha-beta pruning, a hash-based transposition table (20–32% cache hit rate) and iterative deepening, running 28,000× faster than naive search.",
      tags: ["Python", "Algorithms", "Game AI"],
      repo: "",
      demo: "",
    },
  ],

  hobbies: [
    {
      icon: "🥏",
      name: "Flying Disc",
      description:
        "Represented Australia at the 2024 World Juniors, the 2025 Asian Oceanic Championships (bronze) and the 2026 World Championships. I've also captained club and state teams.",
    },
    {
      icon: "♟️",
      name: "Chess",
      description: "Always up for a game. Come challenge me on chess.com.",
      link: "https://www.chess.com/member/yalex69",
      linkLabel: "chess.com profile",
    },
    {
      icon: "🇨🇳",
      name: "Learning Mandarin",
      description: "Building my Mandarin one daily streak at a time on Duolingo.",
      link: "https://www.duolingo.com/profile/alexyecies",
      linkLabel: "Duolingo profile",
    },
  ],
};
