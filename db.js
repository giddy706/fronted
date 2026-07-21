const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

let db = null;

async function getDB() {
    if (db) return db;
    db = await open({
        filename: path.join(__dirname, '../../database.sqlite'),
        driver: sqlite3.Database
    });
    return db;
}

async function initDB() {
    const database = await getDB();
    
    // Enable Foreign Keys
    await database.run('PRAGMA foreign_keys = ON;');

    // Users Table
    await database.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'student',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Courses Table
    await database.exec(`
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            duration TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT NOT NULL,
            instructor TEXT NOT NULL,
            level TEXT NOT NULL,
            rating REAL DEFAULT 5.0,
            students_count INTEGER DEFAULT 0,
            requirements TEXT DEFAULT '[]',
            outcomes TEXT DEFAULT '[]'
        );
    `);

    // Lessons Table
    await database.exec(`
        CREATE TABLE IF NOT EXISTS lessons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            order_index INTEGER NOT NULL,
            video_url TEXT DEFAULT '',
            content TEXT DEFAULT '',
            FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
        );
    `);

    const lessonInfo = await database.all("PRAGMA table_info(lessons)");
    const hasVideoUrl = lessonInfo.some(col => col.name === 'video_url');
    const hasContent = lessonInfo.some(col => col.name === 'content');
    if (!hasVideoUrl) {
        await database.run('ALTER TABLE lessons ADD COLUMN video_url TEXT DEFAULT ""');
    }
    if (!hasContent) {
        await database.run('ALTER TABLE lessons ADD COLUMN content TEXT DEFAULT ""');
    }

    // Enrollments Table
    await database.exec(`
        CREATE TABLE IF NOT EXISTS enrollments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            progress INTEGER DEFAULT 0,
            completed INTEGER DEFAULT 0,
            enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
            UNIQUE(user_id, course_id)
        );
    `);

    // Lesson Progress Table
    await database.exec(`
        CREATE TABLE IF NOT EXISTS lesson_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            enrollment_id INTEGER NOT NULL,
            lesson_id INTEGER NOT NULL,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (enrollment_id) REFERENCES enrollments (id) ON DELETE CASCADE,
            FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
            UNIQUE(enrollment_id, lesson_id)
        );
    `);

    // Jobs Table
    await database.exec(`
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT NOT NULL,
            type TEXT NOT NULL,
            salary TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            requirements TEXT NOT NULL, -- JSON string array
            responsibilities TEXT NOT NULL, -- JSON string array
            benefits TEXT NOT NULL, -- JSON string array
            required_course_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (required_course_id) REFERENCES courses (id) ON DELETE SET NULL
        );
    `);

    // Job Applications Table
    await database.exec(`
        CREATE TABLE IF NOT EXISTS job_applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            cover_letter TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(job_id, user_id)
        );
    `);

    // Traffic Logs Table
    await database.exec(`
        CREATE TABLE IF NOT EXISTS traffic_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            ip_address TEXT,
            page_url TEXT NOT NULL,
            page_title TEXT,
            referrer TEXT,
            user_agent TEXT,
            user_id INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Seed Admin User
    const adminCheck = await database.get("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
    if (!adminCheck) {
        const hash = await bcrypt.hash('Admin123!', 10);
        await database.run(
            `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
            ['Administrator', 'admin@skillpath.com', hash, 'admin']
        );
        console.log('Seeded admin user: admin@skillpath.com / Admin123!');
    }

    // Seed Initial Courses & Lessons
    const courseCheck = await database.get("SELECT COUNT(*) as count FROM courses");
    if (courseCheck.count === 0) {
        const initialCourses = [
            {
                title: "Full Stack Web Development",
                category: "IT & Programming",
                description: "Master HTML, CSS, JavaScript, React, Node.js and build real-world applications from scratch.",
                duration: "12 Weeks",
                price: 25000,
                image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop",
                instructor: "David Kariuki",
                level: "Beginner to Advanced",
                rating: 4.8,
                requirements: ["Basic computer skills", "Internet connection"],
                outcomes: ["Build full-stack web applications", "Create responsive websites", "Work with databases", "Deploy applications to production"],
                lessons: [
                    "HTML5 & CSS3 Fundamentals",
                    "JavaScript ES6+",
                    "React.js & State Management",
                    "Node.js & Express",
                    "MongoDB Database",
                    "RESTful APIs",
                    "Authentication & Security",
                    "Deployment & DevOps"
                ]
            },
            {
                title: "Digital Marketing Mastery",
                category: "Marketing",
                description: "Learn SEO, social media marketing, email campaigns, and analytics to grow any business online.",
                duration: "8 Weeks",
                price: 18000,
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop",
                instructor: "Grace Wanjiru",
                level: "Beginner",
                rating: 4.7,
                requirements: ["Basic internet knowledge"],
                outcomes: ["Run successful marketing campaigns", "Increase online visibility", "Generate leads", "Analyze marketing data"],
                lessons: [
                    "Digital Marketing Fundamentals",
                    "SEO & Content Marketing",
                    "Social Media Marketing",
                    "Email Marketing",
                    "Google Ads & PPC",
                    "Analytics & Reporting",
                    "Marketing Strategy",
                    "Campaign Management"
                ]
            },
            {
                title: "Data Analytics & Visualization",
                category: "Data Science",
                description: "Transform raw data into actionable insights using Excel, SQL, Python, and Power BI.",
                duration: "10 Weeks",
                price: 22000,
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop",
                instructor: "Peter Ochieng",
                level: "Intermediate",
                rating: 4.9,
                requirements: ["Basic Excel knowledge", "Analytical mindset"],
                outcomes: ["Analyze complex datasets", "Create interactive dashboards", "Make data-driven decisions", "Present insights effectively"],
                lessons: [
                    "Excel for Data Analysis",
                    "SQL Database Queries",
                    "Python for Data Science",
                    "Data Cleaning & Preparation",
                    "Statistical Analysis",
                    "Power BI Dashboards",
                    "Data Visualization",
                    "Business Intelligence"
                ]
            },
            {
                title: "Graphic Design & Branding",
                category: "Design",
                description: "Master Adobe Creative Suite and create stunning visual designs for print and digital media.",
                duration: "8 Weeks",
                price: 20000,
                image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=200&fit=crop",
                instructor: "Ann Muthoni",
                level: "Beginner",
                rating: 4.6,
                requirements: ["Creative mindset", "Computer with Adobe software"],
                outcomes: ["Design professional graphics", "Create brand identities", "Work with clients", "Build design portfolio"],
                lessons: [
                    "Design Principles",
                    "Adobe Photoshop",
                    "Adobe Illustrator",
                    "Adobe InDesign",
                    "Logo Design",
                    "Brand Identity",
                    "Print Design",
                    "Digital Graphics"
                ]
            },
            {
                title: "Mobile App Development",
                category: "IT & Programming",
                description: "Build native mobile applications for iOS and Android using React Native.",
                duration: "14 Weeks",
                price: 28000,
                image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop",
                instructor: "Michael Kimani",
                level: "Intermediate",
                rating: 4.8,
                requirements: ["JavaScript knowledge", "React basics"],
                outcomes: ["Build cross-platform apps", "Publish to app stores", "Integrate APIs", "Monetize applications"],
                lessons: [
                    "React Native Basics",
                    "Mobile UI/UX Design",
                    "Navigation & Routing",
                    "State Management",
                    "API Integration",
                    "Push Notifications",
                    "App Deployment",
                    "App Store Optimization"
                ]
            },
            {
                title: "Cybersecurity Fundamentals",
                category: "IT & Security",
                description: "Learn to protect systems, networks, and data from cyber threats and attacks.",
                duration: "10 Weeks",
                price: 24000,
                image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop",
                instructor: "John Mwangi",
                level: "Intermediate",
                rating: 4.7,
                requirements: ["Basic networking knowledge", "IT fundamentals"],
                outcomes: ["Identify security threats", "Implement security measures", "Conduct security audits", "Respond to incidents"],
                lessons: [
                    "Security Fundamentals",
                    "Network Security",
                    "Ethical Hacking",
                    "Vulnerability Assessment",
                    "Incident Response",
                    "Security Tools",
                    "Compliance & Standards",
                    "Risk Management"
                ]
            }
        ];

        for (const course of initialCourses) {
            const result = await database.run(
                `INSERT INTO courses (title, category, description, duration, price, image, instructor, level, rating, requirements, outcomes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    course.title, 
                    course.category, 
                    course.description, 
                    course.duration, 
                    course.price, 
                    course.image, 
                    course.instructor, 
                    course.level, 
                    course.rating,
                    JSON.stringify(course.requirements),
                    JSON.stringify(course.outcomes)
                ]
            );
            const courseId = result.lastID;

            for (let i = 0; i < course.lessons.length; i++) {
                await database.run(
                    `INSERT INTO lessons (course_id, title, order_index) VALUES (?, ?, ?)`,
                    [courseId, course.lessons[i], i + 1]
                );
            }
        }
        console.log('Seeded initial courses and curriculum.');
    }

    // Seed Initial Jobs
    const jobCheck = await database.get("SELECT COUNT(*) as count FROM jobs");
    if (jobCheck.count === 0) {
        const initialJobs = [
            {
                title: "Junior Web Developer",
                company: "TechSolutions Kenya",
                location: "Nairobi, Kenya",
                type: "Full-time",
                salary: "KSH 60,000 - 80,000",
                category: "IT & Programming",
                description: "We're looking for a passionate junior web developer to join our growing team. You'll work on exciting projects for local and international clients.",
                requirements: JSON.stringify([
                    "Proficiency in HTML, CSS, JavaScript",
                    "Experience with React or Vue.js",
                    "Understanding of responsive design",
                    "Good communication skills",
                    "Portfolio of projects"
                ]),
                responsibilities: JSON.stringify([
                    "Develop and maintain web applications",
                    "Collaborate with design team",
                    "Write clean, maintainable code",
                    "Participate in code reviews",
                    "Debug and troubleshoot issues"
                ]),
                benefits: JSON.stringify(["Health insurance", "Professional development", "Flexible hours", "Remote work options"]),
                requiredCourseTitle: "Full Stack Web Development"
            },
            {
                title: "Digital Marketing Specialist",
                company: "GrowthHub Agency",
                location: "Nairobi, Kenya",
                type: "Full-time",
                salary: "KSH 50,000 - 70,000",
                category: "Marketing",
                description: "Join our dynamic marketing agency and help businesses grow their online presence through strategic digital marketing campaigns.",
                requirements: JSON.stringify([
                    "2+ years in digital marketing",
                    "SEO and SEM expertise",
                    "Social media management experience",
                    "Google Analytics proficiency",
                    "Excellent writing skills"
                ]),
                responsibilities: JSON.stringify([
                    "Plan and execute marketing campaigns",
                    "Manage social media accounts",
                    "Optimize SEO strategies",
                    "Analyze campaign performance",
                    "Create marketing reports"
                ]),
                benefits: JSON.stringify(["Performance bonuses", "Training opportunities", "Modern office", "Team events"]),
                requiredCourseTitle: "Digital Marketing Mastery"
            },
            {
                title: "Data Analyst",
                company: "DataInsights Ltd",
                location: "Nairobi, Kenya",
                type: "Full-time",
                salary: "KSH 70,000 - 90,000",
                category: "Data Science",
                description: "We need a detail-oriented data analyst to help our clients make data-driven business decisions.",
                requirements: JSON.stringify([
                    "Strong SQL skills",
                    "Python or R programming",
                    "Power BI or Tableau experience",
                    "Statistical analysis knowledge",
                    "Business acumen"
                ]),
                responsibilities: JSON.stringify([
                    "Analyze complex datasets",
                    "Create data visualizations",
                    "Generate insights and reports",
                    "Present findings to stakeholders",
                    "Maintain data quality"
                ]),
                benefits: JSON.stringify(["Competitive salary", "Health coverage", "Learning budget", "Career growth"]),
                requiredCourseTitle: "Data Analytics & Visualization"
            }
        ];

        for (const job of initialJobs) {
            // Find course ID
            const courseRow = await database.get("SELECT id FROM courses WHERE title = ?", [job.requiredCourseTitle]);
            const requiredCourseId = courseRow ? courseRow.id : null;

            await database.run(
                `INSERT INTO jobs (title, company, location, type, salary, category, description, requirements, responsibilities, benefits, required_course_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [job.title, job.company, job.location, job.type, job.salary, job.category, job.description, job.requirements, job.responsibilities, job.benefits, requiredCourseId]
            );
        }
        console.log('Seeded initial job openings.');
    }
}

module.exports = {
    getDB,
    initDB
};
