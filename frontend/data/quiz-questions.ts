export interface QuizQuestion {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
}

export const HARDCODED_QUIZ_QUESTIONS: QuizQuestion[] = [
  // CZ4070 - Cyber Threat Intelligence (6 questions)
  {
    id: "q1",
    courseId: "course-cz4070",
    courseCode: "CZ4070",
    courseName: "Cyber Threat Intelligence",
    questionText:
      "What is the primary purpose of threat intelligence in cybersecurity?",
    optionA: "To encrypt sensitive data",
    optionB:
      "To provide actionable insights about current and emerging security threats",
    optionC: "To manage user access controls",
    optionD: "To backup critical systems",
    correctAnswer: "B",
    explanation:
      "Threat intelligence provides actionable insights about current and emerging security threats, helping organizations make informed decisions about their security posture and defensive strategies.",
  },
  {
    id: "q2",
    courseId: "course-cz4070",
    courseCode: "CZ4070",
    courseName: "Cyber Threat Intelligence",
    questionText:
      "Which of the following is an example of an Indicator of Compromise (IoC)?",
    optionA: "A company's security policy",
    optionB: "A suspicious IP address communicating with malware",
    optionC: "The number of employees in IT department",
    optionD: "A software license agreement",
    correctAnswer: "B",
    explanation:
      "An Indicator of Compromise (IoC) is evidence that a security incident has occurred. A suspicious IP address communicating with malware is a classic example of a network-based IoC.",
  },
  {
    id: "q3",
    courseId: "course-cz4070",
    courseCode: "CZ4070",
    courseName: "Cyber Threat Intelligence",
    questionText: "What does the MITRE ATT&CK framework primarily provide?",
    optionA: "Encryption algorithms for data protection",
    optionB:
      "A knowledge base of adversary tactics, techniques, and procedures",
    optionC: "Network topology designs",
    optionD: "User authentication methods",
    correctAnswer: "B",
    explanation:
      "The MITRE ATT&CK framework is a globally accessible knowledge base of adversary tactics, techniques, and procedures (TTPs) based on real-world observations of cyberattacks.",
  },
  {
    id: "q4",
    courseId: "course-cz4070",
    courseCode: "CZ4070",
    courseName: "Cyber Threat Intelligence",
    questionText: "In threat hunting, what is the primary goal?",
    optionA: "To wait for security alerts to trigger",
    optionB:
      "To proactively search for threats that have evaded existing security measures",
    optionC: "To update antivirus signatures",
    optionD: "To configure firewall rules",
    correctAnswer: "B",
    explanation:
      "Threat hunting is a proactive approach where security professionals actively search for threats that have evaded existing security measures, rather than waiting for automated tools to detect them.",
  },
  {
    id: "q5",
    courseId: "course-cz4070",
    courseCode: "CZ4070",
    courseName: "Cyber Threat Intelligence",
    questionText: "What is STIX in the context of threat intelligence?",
    optionA: "A type of malware",
    optionB: "A structured language for describing cyber threat information",
    optionC: "A network protocol",
    optionD: "An encryption standard",
    correctAnswer: "B",
    explanation:
      "STIX (Structured Threat Information eXpression) is a structured language for describing cyber threat information in a standardized format, enabling better sharing and analysis of threat intelligence.",
  },
  {
    id: "q6",
    courseId: "course-cz4070",
    courseCode: "CZ4070",
    courseName: "Cyber Threat Intelligence",
    questionText: "What is TAXII used for in threat intelligence sharing?",
    optionA: "Encrypting threat data",
    optionB: "Transporting and sharing threat intelligence information",
    optionC: "Analyzing malware samples",
    optionD: "Managing user credentials",
    correctAnswer: "B",
    explanation:
      "TAXII (Trusted Automated eXchange of Intelligence Information) is a protocol designed for transporting and sharing threat intelligence information in a secure and automated manner.",
  },

  // CZ4022 - Wireless & Mobile Networks (6 questions)
  {
    id: "q7",
    courseId: "course-cz4022",
    courseCode: "CZ4022",
    courseName: "Wireless & Mobile Networks",
    questionText:
      "Which frequency band is commonly used by Wi-Fi 802.11n networks?",
    optionA: "900 MHz only",
    optionB: "2.4 GHz only",
    optionC: "Both 2.4 GHz and 5 GHz",
    optionD: "6 GHz only",
    correctAnswer: "C",
    explanation:
      "Wi-Fi 802.11n (Wi-Fi 4) operates in both the 2.4 GHz and 5 GHz frequency bands, providing flexibility and better performance compared to earlier standards that used only 2.4 GHz.",
  },
  {
    id: "q8",
    courseId: "course-cz4022",
    courseCode: "CZ4022",
    courseName: "Wireless & Mobile Networks",
    questionText: "What is the primary purpose of handoff in mobile networks?",
    optionA: "To encrypt data transmission",
    optionB:
      "To maintain connectivity as a mobile device moves between cell towers",
    optionC: "To compress voice data",
    optionD: "To authenticate users",
    correctAnswer: "B",
    explanation:
      "Handoff (or handover) is the process of maintaining connectivity as a mobile device moves from the coverage area of one cell tower to another, ensuring seamless communication without dropping the connection.",
  },
  {
    id: "q9",
    courseId: "course-cz4022",
    courseCode: "CZ4022",
    courseName: "Wireless & Mobile Networks",
    questionText: "What does MIMO stand for in wireless communications?",
    optionA: "Multiple Input, Multiple Output",
    optionB: "Mobile Internet, Mobile Operations",
    optionC: "Modular Interface, Modular Operations",
    optionD: "Maximum Input, Maximum Output",
    correctAnswer: "A",
    explanation:
      "MIMO stands for Multiple Input, Multiple Output, a technology that uses multiple antennas at both transmitter and receiver to improve communication performance and increase data throughput.",
  },
  {
    id: "q10",
    courseId: "course-cz4022",
    courseCode: "CZ4022",
    courseName: "Wireless & Mobile Networks",
    questionText:
      "Which generation of mobile networks introduced packet-switched data transmission?",
    optionA: "1G",
    optionB: "2G",
    optionC: "3G",
    optionD: "4G",
    correctAnswer: "C",
    explanation:
      "3G networks introduced packet-switched data transmission, enabling more efficient data communication and supporting internet access, multimedia messaging, and other data services.",
  },
  {
    id: "q11",
    courseId: "course-cz4022",
    courseCode: "CZ4022",
    courseName: "Wireless & Mobile Networks",
    questionText: "What is a key advantage of 5G networks over 4G?",
    optionA: "Lower frequency bands only",
    optionB: "Significantly lower latency and higher data rates",
    optionC: "Reduced network coverage",
    optionD: "Simplified network architecture",
    correctAnswer: "B",
    explanation:
      "5G networks offer significantly lower latency (as low as 1ms) and much higher data rates (up to 10 Gbps) compared to 4G, enabling new applications like autonomous vehicles and real-time AR/VR.",
  },
  {
    id: "q12",
    courseId: "course-cz4022",
    courseCode: "CZ4022",
    courseName: "Wireless & Mobile Networks",
    questionText: "In Wi-Fi networks, what is the purpose of CSMA/CA?",
    optionA: "To encrypt wireless data",
    optionB: "To avoid collisions in wireless medium access",
    optionC: "To compress data packets",
    optionD: "To authenticate wireless clients",
    correctAnswer: "B",
    explanation:
      "CSMA/CA (Carrier Sense Multiple Access with Collision Avoidance) is a protocol used in Wi-Fi networks to avoid collisions when multiple devices try to access the wireless medium simultaneously.",
  },

  // CZ4055 - Cyber Physical System Security (6 questions)
  {
    id: "q13",
    courseId: "course-cz4055",
    courseCode: "CZ4055",
    courseName: "Cyber Physical System Security",
    questionText: "What characterizes a Cyber-Physical System (CPS)?",
    optionA: "Only software components",
    optionB: "Integration of computational and physical processes",
    optionC: "Only hardware components",
    optionD: "Standalone computer systems",
    correctAnswer: "B",
    explanation:
      "A Cyber-Physical System (CPS) is characterized by the tight integration of computational and physical processes, where embedded computers monitor and control physical processes through networks.",
  },
  {
    id: "q14",
    courseId: "course-cz4055",
    courseCode: "CZ4055",
    courseName: "Cyber Physical System Security",
    questionText:
      "Which of the following is a common security challenge in Industrial Control Systems (ICS)?",
    optionA: "Too much encryption",
    optionB: "Legacy systems with limited security features",
    optionC: "Excessive user authentication",
    optionD: "Over-segmented networks",
    correctAnswer: "B",
    explanation:
      "Legacy systems with limited security features are a major challenge in ICS security, as many industrial systems were designed for reliability and availability rather than security, and upgrading them can be difficult and costly.",
  },
  {
    id: "q15",
    courseId: "course-cz4055",
    courseCode: "CZ4055",
    courseName: "Cyber Physical System Security",
    questionText: "What does SCADA stand for in industrial systems?",
    optionA: "Secure Control And Data Acquisition",
    optionB: "Supervisory Control And Data Acquisition",
    optionC: "System Control And Data Analysis",
    optionD: "Software Control And Data Access",
    correctAnswer: "B",
    explanation:
      "SCADA stands for Supervisory Control And Data Acquisition, a system used to monitor and control industrial processes and infrastructure from a central location.",
  },
  {
    id: "q16",
    courseId: "course-cz4055",
    courseCode: "CZ4055",
    courseName: "Cyber Physical System Security",
    questionText:
      "Which protocol is commonly used in industrial automation for communication between devices?",
    optionA: "HTTP",
    optionB: "SMTP",
    optionC: "Modbus",
    optionD: "FTP",
    correctAnswer: "C",
    explanation:
      "Modbus is a widely used communication protocol in industrial automation for connecting electronic devices, particularly in SCADA systems and industrial control networks.",
  },
  {
    id: "q17",
    courseId: "course-cz4055",
    courseCode: "CZ4055",
    courseName: "Cyber Physical System Security",
    questionText: "What is a major security concern with IoT devices in CPS?",
    optionA: "Too much processing power",
    optionB: "Weak authentication and default credentials",
    optionC: "Excessive memory usage",
    optionD: "Too many security features",
    correctAnswer: "B",
    explanation:
      "Weak authentication and default credentials are major security concerns with IoT devices in CPS, as many devices ship with default passwords that are never changed, making them vulnerable to attacks.",
  },
  {
    id: "q18",
    courseId: "course-cz4055",
    courseCode: "CZ4055",
    courseName: "Cyber Physical System Security",
    questionText:
      "What is the primary goal of air-gapping in critical infrastructure?",
    optionA: "To improve system performance",
    optionB: "To physically isolate critical systems from external networks",
    optionC: "To reduce power consumption",
    optionD: "To increase data storage capacity",
    correctAnswer: "B",
    explanation:
      "Air-gapping involves physically isolating critical systems from external networks and the internet to prevent remote cyberattacks, though it doesn't eliminate all security risks.",
  },

  // CZ4046 - Intelligent Agents (6 questions)
  {
    id: "q19",
    courseId: "course-cz4046",
    courseCode: "CZ4046",
    courseName: "Intelligent Agents",
    questionText: "What is a key characteristic of an intelligent agent?",
    optionA: "It only responds to direct commands",
    optionB:
      "It can perceive its environment and act autonomously to achieve goals",
    optionC: "It requires constant human supervision",
    optionD: "It only processes text data",
    correctAnswer: "B",
    explanation:
      "An intelligent agent is characterized by its ability to perceive its environment through sensors and act autonomously through actuators to achieve its goals, adapting its behavior based on environmental changes.",
  },
  {
    id: "q20",
    courseId: "course-cz4046",
    courseCode: "CZ4046",
    courseName: "Intelligent Agents",
    questionText:
      "In the A* search algorithm, what does the heuristic function h(n) represent?",
    optionA: "The exact cost from start to node n",
    optionB: "The estimated cost from node n to the goal",
    optionC: "The total path cost",
    optionD: "The number of nodes expanded",
    correctAnswer: "B",
    explanation:
      "In A* search, the heuristic function h(n) represents the estimated cost from node n to the goal. It must be admissible (never overestimate) for A* to guarantee finding the optimal solution.",
  },
  {
    id: "q21",
    courseId: "course-cz4046",
    courseCode: "CZ4046",
    courseName: "Intelligent Agents",
    questionText:
      "What is the main advantage of reinforcement learning over supervised learning?",
    optionA: "It requires more labeled training data",
    optionB:
      "It can learn from interaction with the environment without labeled examples",
    optionC: "It is always faster to train",
    optionD: "It only works with numerical data",
    correctAnswer: "B",
    explanation:
      "Reinforcement learning can learn from interaction with the environment through trial and error, receiving rewards or penalties, without requiring pre-labeled training examples like supervised learning.",
  },
  {
    id: "q22",
    courseId: "course-cz4046",
    courseCode: "CZ4046",
    courseName: "Intelligent Agents",
    questionText: "In multi-agent systems, what is coordination?",
    optionA: "Agents working independently without communication",
    optionB:
      "Agents working together to achieve individual or collective goals",
    optionC: "Agents competing against each other",
    optionD: "Agents shutting down when conflicts arise",
    correctAnswer: "B",
    explanation:
      "Coordination in multi-agent systems involves agents working together, often through communication and cooperation, to achieve their individual goals or collective objectives efficiently.",
  },
  {
    id: "q23",
    courseId: "course-cz4046",
    courseCode: "CZ4046",
    courseName: "Intelligent Agents",
    questionText:
      "What is the exploration vs exploitation dilemma in reinforcement learning?",
    optionA: "Choosing between different programming languages",
    optionB:
      "Balancing between trying new actions and using known good actions",
    optionC: "Deciding between supervised and unsupervised learning",
    optionD: "Choosing between different neural network architectures",
    correctAnswer: "B",
    explanation:
      "The exploration vs exploitation dilemma involves balancing between exploring new actions to potentially discover better strategies and exploiting known actions that provide good rewards.",
  },
  {
    id: "q24",
    courseId: "course-cz4046",
    courseCode: "CZ4046",
    courseName: "Intelligent Agents",
    questionText: "What is a rational agent in AI?",
    optionA: "An agent that always makes perfect decisions",
    optionB: "An agent that acts to maximize its expected performance measure",
    optionC: "An agent that only uses logical reasoning",
    optionD: "An agent that mimics human behavior exactly",
    correctAnswer: "B",
    explanation:
      "A rational agent is one that acts to maximize its expected performance measure given its knowledge and capabilities, making the best decisions possible with available information.",
  },

  // CZ2006 - Software Engineering (6 questions)
  {
    id: "q25",
    courseId: "course-cz2006",
    courseCode: "CZ2006",
    courseName: "Software Engineering",
    questionText: "What does the 'S' in SOLID principles stand for?",
    optionA: "Scalability Principle",
    optionB: "Single Responsibility Principle",
    optionC: "Security Principle",
    optionD: "Simplicity Principle",
    correctAnswer: "B",
    explanation:
      "The 'S' in SOLID stands for Single Responsibility Principle, which states that a class should have only one reason to change, meaning it should have only one job or responsibility.",
  },
  {
    id: "q26",
    courseId: "course-cz2006",
    courseCode: "CZ2006",
    courseName: "Software Engineering",
    questionText:
      "Which of the following is a key characteristic of Agile methodology?",
    optionA: "Extensive documentation over working software",
    optionB: "Following a plan over responding to change",
    optionC: "Iterative development with frequent customer feedback",
    optionD: "Individual work over team collaboration",
    correctAnswer: "C",
    explanation:
      "Agile methodology emphasizes iterative development with frequent customer feedback, allowing teams to adapt quickly to changing requirements and deliver working software incrementally.",
  },
  {
    id: "q27",
    courseId: "course-cz2006",
    courseCode: "CZ2006",
    courseName: "Software Engineering",
    questionText: "What is the primary purpose of unit testing?",
    optionA: "To test the entire system integration",
    optionB: "To test individual components or modules in isolation",
    optionC: "To test user interface design",
    optionD: "To test system performance under load",
    correctAnswer: "B",
    explanation:
      "Unit testing focuses on testing individual components or modules in isolation to ensure they work correctly on their own, helping to catch bugs early in the development process.",
  },
  {
    id: "q28",
    courseId: "course-cz2006",
    courseCode: "CZ2006",
    courseName: "Software Engineering",
    questionText:
      "Which design pattern is used to ensure a class has only one instance?",
    optionA: "Factory Pattern",
    optionB: "Observer Pattern",
    optionC: "Singleton Pattern",
    optionD: "Strategy Pattern",
    correctAnswer: "C",
    explanation:
      "The Singleton Pattern ensures that a class has only one instance and provides a global point of access to that instance, useful for resources like database connections or configuration settings.",
  },
  {
    id: "q29",
    courseId: "course-cz2006",
    courseCode: "CZ2006",
    courseName: "Software Engineering",
    questionText:
      "What is the main benefit of version control systems like Git?",
    optionA: "Faster code execution",
    optionB: "Tracking changes and enabling collaboration on code",
    optionC: "Automatic bug fixing",
    optionD: "Code compilation optimization",
    correctAnswer: "B",
    explanation:
      "Version control systems like Git track changes to code over time and enable multiple developers to collaborate on the same project, managing conflicts and maintaining a history of modifications.",
  },
  {
    id: "q30",
    courseId: "course-cz2006",
    courseCode: "CZ2006",
    courseName: "Software Engineering",
    questionText: "What is refactoring in software development?",
    optionA: "Adding new features to existing code",
    optionB: "Improving code structure without changing its external behavior",
    optionC: "Fixing bugs in the code",
    optionD: "Converting code to a different programming language",
    correctAnswer: "B",
    explanation:
      "Refactoring is the process of improving the internal structure and design of existing code without changing its external behavior, making it more maintainable, readable, and efficient.",
  },
  {
    id: "q31",
    courseId: "course-cz2069",
    courseCode: "CZ2069",
    courseName: "Software",
    questionText: "What is refactoring in software development?",
    optionA: "Adding new features to existing code",
    optionB: "Improving code structure without changing its external behavior",
    optionC: "Fixing bugs in the code",
    optionD: "Converting code to a different programming language",
    correctAnswer: "B",
    explanation:
      "Refactoring is the process of improving the internal structure and design of existing code without changing its external behavior, making it more maintainable, readable, and efficient.",
  },
];

// Helper functions for quiz management
export function getQuestionsByModule(moduleCode: string): QuizQuestion[] {
  return HARDCODED_QUIZ_QUESTIONS.filter((q) => q.courseCode === moduleCode);
}

export function getRandomQuestions(
  moduleCode: string,
  count: number
): QuizQuestion[] {
  const moduleQuestions = getQuestionsByModule(moduleCode);
  const shuffled = [...moduleQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getAllModules(): Array<{
  code: string;
  name: string;
  questionCount: number;
}> {
  const modules = new Map<string, { name: string; count: number }>();

  HARDCODED_QUIZ_QUESTIONS.forEach((q) => {
    if (modules.has(q.courseCode)) {
      modules.get(q.courseCode)!.count++;
    } else {
      modules.set(q.courseCode, { name: q.courseName, count: 1 });
    }
  });

  return Array.from(modules.entries()).map(([code, { name, count }]) => ({
    code,
    name,
    questionCount: count,
  }));
}
