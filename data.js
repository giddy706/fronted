// ============================================
// SkillPath Academy - Sample Data
// ============================================

// Sample Courses Data
const coursesData = [
    {
        id: 1,
        title: "Full Stack Web Development",
        category: "IT & Programming",
        description: "Master HTML, CSS, JavaScript, React, Node.js and build real-world applications from scratch.",
        duration: "12 Weeks",
        price: 25000,
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop",
        instructor: "David Kariuki",
        level: "Beginner to Advanced",
        students: 1250,
        rating: 4.8,
        curriculum: [
            "HTML5 & CSS3 Fundamentals",
            "JavaScript ES6+",
            "React.js & State Management",
            "Node.js & Express",
            "MongoDB Database",
            "RESTful APIs",
            "Authentication & Security",
            "Deployment & DevOps"
        ],
        requirements: ["Basic computer skills", "Internet connection"],
        outcomes: ["Build full-stack web applications", "Create responsive websites", "Work with databases", "Deploy applications to production"]
    },
    {
        id: 2,
        title: "Digital Marketing Mastery",
        category: "Marketing",
        description: "Learn SEO, social media marketing, email campaigns, and analytics to grow any business online.",
        duration: "8 Weeks",
        price: 18000,
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop",
        instructor: "Grace Wanjiru",
        level: "Beginner",
        students: 980,
        rating: 4.7,
        curriculum: [
            "Digital Marketing Fundamentals",
            "SEO & Content Marketing",
            "Social Media Marketing",
            "Email Marketing",
            "Google Ads & PPC",
            "Analytics & Reporting",
            "Marketing Strategy",
            "Campaign Management"
        ],
        requirements: ["Basic internet knowledge"],
        outcomes: ["Run successful marketing campaigns", "Increase online visibility", "Generate leads", "Analyze marketing data"]
    },
    {
        id: 3,
        title: "Data Analytics & Visualization",
        category: "Data Science",
        description: "Transform raw data into actionable insights using Excel, SQL, Python, and Power BI.",
        duration: "10 Weeks",
        price: 22000,
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop",
        instructor: "Peter Ochieng",
        level: "Intermediate",
        students: 750,
        rating: 4.9,
        curriculum: [
            "Excel for Data Analysis",
            "SQL Database Queries",
            "Python for Data Science",
            "Data Cleaning & Preparation",
            "Statistical Analysis",
            "Power BI Dashboards",
            "Data Visualization",
            "Business Intelligence"
        ],
        requirements: ["Basic Excel knowledge", "Analytical mindset"],
        outcomes: ["Analyze complex datasets", "Create interactive dashboards", "Make data-driven decisions", "Present insights effectively"]
    },
    {
        id: 4,
        title: "Graphic Design & Branding",
        category: "Design",
        description: "Master Adobe Creative Suite and create stunning visual designs for print and digital media.",
        duration: "8 Weeks",
        price: 20000,
        image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=200&fit=crop",
        instructor: "Ann Muthoni",
        level: "Beginner",
        students: 650,
        rating: 4.6,
        curriculum: [
            "Design Principles",
            "Adobe Photoshop",
            "Adobe Illustrator",
            "Adobe InDesign",
            "Logo Design",
            "Brand Identity",
            "Print Design",
            "Digital Graphics"
        ],
        requirements: ["Creative mindset", "Computer with Adobe software"],
        outcomes: ["Design professional graphics", "Create brand identities", "Work with clients", "Build design portfolio"]
    },
    {
        id: 5,
        title: "Mobile App Development",
        category: "IT & Programming",
        description: "Build native mobile applications for iOS and Android using React Native.",
        duration: "14 Weeks",
        price: 28000,
        image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop",
        instructor: "Michael Kimani",
        level: "Intermediate",
        students: 520,
        rating: 4.8,
        curriculum: [
            "React Native Basics",
            "Mobile UI/UX Design",
            "Navigation & Routing",
            "State Management",
            "API Integration",
            "Push Notifications",
            "App Deployment",
            "App Store Optimization"
        ],
        requirements: ["JavaScript knowledge", "React basics"],
        outcomes: ["Build cross-platform apps", "Publish to app stores", "Integrate APIs", "Monetize applications"]
    },
    {
        id: 6,
        title: "Cybersecurity Fundamentals",
        category: "IT & Security",
        description: "Learn to protect systems, networks, and data from cyber threats and attacks.",
        duration: "10 Weeks",
        price: 24000,
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop",
        instructor: "John Mwangi",
        level: "Intermediate",
        students: 430,
        rating: 4.7,
        curriculum: [
            "Security Fundamentals",
            "Network Security",
            "Ethical Hacking",
            "Vulnerability Assessment",
            "Incident Response",
            "Security Tools",
            "Compliance & Standards",
            "Risk Management"
        ],
        requirements: ["Basic networking knowledge", "IT fundamentals"],
        outcomes: ["Identify security threats", "Implement security measures", "Conduct security audits", "Respond to incidents"]
    }
];

// Sample Jobs Data
const jobsData = [
    {
        id: 1,
        title: "Junior Web Developer",
        company: "TechSolutions Kenya",
        location: "Nairobi, Kenya",
        type: "Full-time",
        salary: "KSH 60,000 - 80,000",
        category: "IT & Programming",
        postedDate: "2025-12-20",
        description: "We're looking for a passionate junior web developer to join our growing team. You'll work on exciting projects for local and international clients.",
        requirements: [
            "Proficiency in HTML, CSS, JavaScript",
            "Experience with React or Vue.js",
            "Understanding of responsive design",
            "Good communication skills",
            "Portfolio of projects"
        ],
        responsibilities: [
            "Develop and maintain web applications",
            "Collaborate with design team",
            "Write clean, maintainable code",
            "Participate in code reviews",
            "Debug and troubleshoot issues"
        ],
        benefits: ["Health insurance", "Professional development", "Flexible hours", "Remote work options"],
        requiredCourse: 1
    },
    {
        id: 2,
        title: "Digital Marketing Specialist",
        company: "GrowthHub Agency",
        location: "Nairobi, Kenya",
        type: "Full-time",
        salary: "KSH 50,000 - 70,000",
        category: "Marketing",
        postedDate: "2025-12-19",
        description: "Join our dynamic marketing agency and help businesses grow their online presence through strategic digital marketing campaigns.",
        requirements: [
            "2+ years in digital marketing",
            "SEO and SEM expertise",
            "Social media management experience",
            "Google Analytics proficiency",
            "Excellent writing skills"
        ],
        responsibilities: [
            "Plan and execute marketing campaigns",
            "Manage social media accounts",
            "Optimize SEO strategies",
            "Analyze campaign performance",
            "Create marketing reports"
        ],
        benefits: ["Performance bonuses", "Training opportunities", "Modern office", "Team events"],
        requiredCourse: 2
    },
    {
        id: 3,
        title: "Data Analyst",
        company: "DataInsights Ltd",
        location: "Nairobi, Kenya",
        type: "Full-time",
        salary: "KSH 70,000 - 90,000",
        category: "Data Science",
        postedDate: "2025-12-18",
        description: "We need a detail-oriented data analyst to help our clients make data-driven business decisions.",
        requirements: [
            "Strong SQL skills",
            "Python or R programming",
            "Power BI or Tableau experience",
            "Statistical analysis knowledge",
            "Business acumen"
        ],
        responsibilities: [
            "Analyze complex datasets",
            "Create data visualizations",
            "Generate insights and reports",
            "Present findings to stakeholders",
            "Maintain data quality"
        ],
        benefits: ["Competitive salary", "Health coverage", "Learning budget", "Career growth"],
        requiredCourse: 3
    },
    {
        id: 4,
        title: "Graphic Designer",
        company: "Creative Studios",
        location: "Mombasa, Kenya",
        type: "Full-time",
        salary: "KSH 45,000 - 65,000",
        category: "Design",
        postedDate: "2025-12-17",
        description: "Creative studio seeking a talented graphic designer to work on diverse projects including branding, print, and digital design.",
        requirements: [
            "Adobe Creative Suite mastery",
            "Strong portfolio",
            "Brand identity experience",
            "Print and digital design skills",
            "Attention to detail"
        ],
        responsibilities: [
            "Design marketing materials",
            "Create brand identities",
            "Collaborate with clients",
            "Manage multiple projects",
            "Meet deadlines"
        ],
        benefits: ["Creative environment", "Portfolio building", "Flexible schedule", "Equipment provided"],
        requiredCourse: 4
    },
    {
        id: 5,
        title: "Mobile App Developer",
        company: "AppWorks Kenya",
        location: "Nairobi, Kenya (Remote)",
        type: "Contract",
        salary: "KSH 80,000 - 120,000",
        category: "IT & Programming",
        postedDate: "2025-12-16",
        description: "Looking for an experienced mobile developer to build innovative apps for our startup clients.",
        requirements: [
            "React Native or Flutter experience",
            "Published apps on App Store/Play Store",
            "API integration skills",
            "UI/UX understanding",
            "Problem-solving abilities"
        ],
        responsibilities: [
            "Develop mobile applications",
            "Integrate third-party services",
            "Optimize app performance",
            "Fix bugs and issues",
            "Collaborate with team remotely"
        ],
        benefits: ["Remote work", "Flexible hours", "Project bonuses", "Latest tech stack"],
        requiredCourse: 5
    },
    {
        id: 6,
        title: "Cybersecurity Analyst",
        company: "SecureNet Solutions",
        location: "Nairobi, Kenya",
        type: "Full-time",
        salary: "KSH 90,000 - 130,000",
        category: "IT & Security",
        postedDate: "2025-12-15",
        description: "Join our security team to protect client systems and data from cyber threats.",
        requirements: [
            "Security certifications (CEH, CompTIA Security+)",
            "Network security knowledge",
            "Incident response experience",
            "Security tools proficiency",
            "Analytical mindset"
        ],
        responsibilities: [
            "Monitor security systems",
            "Conduct vulnerability assessments",
            "Respond to security incidents",
            "Implement security measures",
            "Create security reports"
        ],
        benefits: ["High salary", "Certification support", "Advanced training", "Career advancement"],
        requiredCourse: 6
    }
];

// Save to localStorage on page load
if (typeof window !== 'undefined') {
    if (!localStorage.getItem('courses')) {
        localStorage.setItem('courses', JSON.stringify(coursesData));
    }
    if (!localStorage.getItem('jobs')) {
        localStorage.setItem('jobs', JSON.stringify(jobsData));
    }
}
