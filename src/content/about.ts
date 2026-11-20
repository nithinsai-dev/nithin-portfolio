
export interface ValueItem {
  number: string
  title: string
  description: string
}

export interface BuildPillar {
  number: string
  title: string
  description: string
}

export interface SkillGroup {
  name: string
  skills: string[]
}

export interface OffScreenItem {
  name: string
  description: string
}

export const aboutContent = {
  intro: {
    label: '01 / about',
    shortLabel: 'about',
    statement:
      "I'm Nithin, a second-year Computer Science student at Amrita Vishwa Vidyapeetham, Coimbatore. My interest in computer science began with cybersecurity, which sparked my curiosity about how systems work and how they can be secured. I started building full-stack applications in my second semester and have since grown interested in backend engineering, AI-powered applications, and understanding the systems behind the products I build. I'm always exploring, experimenting, and looking for ways to get better.",
    values: [
      {
        number: '01',
        title: 'Build with purpose',
        description: 'I enjoy turning ideas into working products that solve real problems.',
      },
      {
        number: '02',
        title: 'Understand the why',
        description: 'I prefer understanding the systems behind a technology, not just using it.',
      },
      {
        number: '03',
        title: 'Stay curious',
        description: 'There is always something new to explore, question, and experiment with.',
      },
      {
        number: '04',
        title: 'Keep evolving',
        description: 'Every project and every challenge is an opportunity to get better.',
      },
    ],
  },

  buildPillars: {
    label: '02 / what I build',
    shortLabel: 'build',
    pillars: [
      {
        number: '01',
        title: 'Full-stack Engineering',
        description: 'Building complete products across frontend interfaces, backend systems, APIs, databases, and real-time communication.',
      },
      {
        number: '02',
        title: 'Agentic AI',
        description: 'Building LLM-powered applications that go beyond generating responses through tools, memory, and autonomous workflows.',
      },
      {
        number: '03',
        title: 'Cybersecurity',
        description: 'Exploring vulnerabilities, application security, and the principles behind building systems that are harder to exploit.',
      },
    ],
    closing: 'Different disciplines. One engineering mindset.',
  },

  nowNext: {
    label: '03 / now - next',
    shortLabel: 'now',
    nowSkills: [
      'Next.js',
      'Data Structures & Algorithms',
      'Go',
      'AI Engineering',
      'LangGraph',
      'LangChain',
      'Agentic AI',
      'Model Context Protocol (MCP)',
      'Retrieval-Augmented Generation (RAG)',
    ],
    nextSkills: [
      'Advanced Go',
      'Cloud Computing',
      'Kubernetes',
      'Cybersecurity Fundamentals',
      'Distributed Systems',
    ],
    legend: 'solid = learning now, dashed = up next',
  },

  skills: {
    label: '04 / skills',
    shortLabel: 'skills',
    groups: [
      {
        name: 'Languages',
        skills: [
          'C',
          'C++',
          'Java',
          'Python',
          'JavaScript',
          'TypeScript',
          'SQL',
          'HTML',
          'CSS',
        ],
      },
      {
        name: 'Concepts',
        skills: [
          'DSA',
          'OOP',
          'DBMS',
          'REST APIs',
          'Authentication',
          'RBAC',
          'Problem Solving',
        ],
      },
      {
        name: 'Tools',
        skills: [
          'VS Code',
          'IntelliJ IDEA',
          'Git',
          'GitHub',
          'Postman',
          'Docker',
        ],
      },
      {
        name: 'Frameworks',
        skills: [
          'React',
          'Node.js',
          'Express.js',
          'Tailwind CSS',
          'Socket.IO',
          'Prisma',
        ],
      },
      {
        name: 'Databases',
        skills: [
          'MongoDB',
          'PostgreSQL',
          'Redis',
        ],
      },
    ],
  },

  offScreenEducation: {
    offScreenLabel: '05 / off screen',
    shortLabel: 'life',
    items: [
      {
        name: 'Cinema',
        description: 'storytelling and cinematography',
      },
      {
        name: 'Reading',
        description: 'books, ideas, and perspectives',
      },
      {
        name: 'Gym',
        description: 'consistency and discipline',
      },
      {
        name: 'Economics',
        description: 'exploring how money, markets, and economies interact',
      },
    ],
    education:
      'B.Tech Computer Science and Engineering · Amrita Vishwa Vidyapeetham, Coimbatore · 2025 → 2029',
  },
}
