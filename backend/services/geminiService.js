// Mock Gemini AI Analysis service replicating Java behavior
const geminiKey = process.env.GEMINI_API_KEY;

const analyzeResume = (text) => {
  const hasKey = !!(geminiKey && geminiKey.trim());
  return JSON.stringify({
    candidateProfile: {
      name: "Candidate Demo",
      email: "candidate_demo@hiremind.ai",
      phone: "+1-555-0199",
      summary: "Java Developer with experience building backend microservices."
    },
    education: [],
    experience: [],
    skills: {
      programmingLanguages: ["Java", "JavaScript"],
      frameworks: ["Spring Boot"],
      databases: ["MySQL"],
      cloud: ["AWS"],
      devOps: [],
      tools: ["Git"]
    },
    projects: [],
    certifications: [],
    achievements: [],
    isRealAI: hasKey
  });
};

const analyzeJobDescription = (title, description) => {
  const hasKey = !!(geminiKey && geminiKey.trim());
  return JSON.stringify({
    summary: "Backend engineer role specializing in core stack optimization.",
    responsibilities: ["Develop RESTful microservices", "Integrate with cloud database services"],
    requiredSkills: ["Java", "Spring Boot", "MySQL"],
    preferredSkills: ["AWS", "Docker"],
    education: "Bachelor's degree in Computer Science or equivalent experience.",
    certifications: [],
    technologies: ["Java", "Spring Boot", "MySQL", "AWS", "Docker"],
    seniorityLevel: "MID",
    isRealAI: hasKey
  });
};

const generateInterviewQuestions = (candidateName, jobTitle, gapsJson) => {
  return JSON.stringify({
    questions: [
      {
        question: "How do you manage database transaction isolation in Spring Boot applications using JPA?",
        category: "TECHNICAL",
        difficulty: "MEDIUM",
        evaluationCriteria: "Understanding of @Transactional, isolation levels, and Hibernate behaviors."
      },
      {
        question: "Describe a scenario where you had to debug a memory leak in a Java garbage collected runtime.",
        category: "TECHNICAL",
        difficulty: "HARD",
        evaluationCriteria: "Familiarity with heap profiling tools like JProfiler or VisualVM."
      }
    ]
  });
};

const generateRoadmap = (gapsJson) => {
  return JSON.stringify({
    roadmap: {
      tasks: [
        {
          week: 1,
          title: "Docker Containers Fundamentals",
          description: "Learn image creation, docker-compose orchestration, and port mapping guidelines.",
          estimatedTime: "6 hours",
          difficulty: "EASY"
        },
        {
          week: 2,
          title: "Spring Cloud Microservices Config",
          description: "Set up Eureka registry servers, Feign HTTP clients, and Spring cloud gateway routes.",
          estimatedTime: "8 hours",
          difficulty: "MEDIUM"
        },
        {
          week: 3,
          title: "Java Concurrency & Threading",
          description: "Understand ExecutorService wrappers, lock conditions, and Atomic Integer synchronization.",
          estimatedTime: "10 hours",
          difficulty: "HARD"
        },
        {
          week: 4,
          title: "AWS RDS Deployments & Migration",
          description: "Deploy high-availability database engines, configure VPC security groups, and run database seeding.",
          estimatedTime: "5 hours",
          difficulty: "MEDIUM"
        }
      ]
    }
  });
};

module.exports = {
  analyzeResume,
  analyzeJobDescription,
  generateInterviewQuestions,
  generateRoadmap
};
