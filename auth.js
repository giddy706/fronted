// ============================================
// SkillPath Academy - Authentication System (Backend Connected)
// ============================================

// Helper to sync user session from backend to localStorage
async function syncUserSession() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.success) {
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            return data.user;
        } else {
            localStorage.removeItem('currentUser');
            return null;
        }
    } catch (e) {
        // If offline or error, return cached user
        const cached = localStorage.getItem('currentUser');
        return cached ? JSON.parse(cached) : null;
    }
}

// Sync session on load
document.addEventListener('DOMContentLoaded', () => {
    syncUserSession().then(() => {
        if (typeof updateNavigation === 'function') {
            updateNavigation();
        }
    });
});

// Register new user
async function registerUser(userData) {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        const result = await response.json();
        if (result.success) {
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            return { success: true, message: result.message, user: result.user };
        } else {
            return { success: false, message: result.message };
        }
    } catch (err) {
        return { success: false, message: 'Server connection failed. Please try again.' };
    }
}

// Login user
async function loginUser(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json();
        if (result.success) {
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            return { success: true, message: result.message, user: result.user };
        } else {
            return { success: false, message: result.message };
        }
    } catch (err) {
        return { success: false, message: 'Server connection failed. Please try again.' };
    }
}

// Enroll in course
async function enrollInCourse(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/enroll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const result = await response.json();
        if (result.success) {
            // Re-sync profile to get updated enrollments
            await syncUserSession();
            return { success: true, message: result.message };
        } else {
            return { success: false, message: result.message };
        }
    } catch (err) {
        return { success: false, message: 'Server connection failed.' };
    }
}

// Update lesson progress
async function updateLessonProgress(courseId, lessonId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const result = await response.json();
        if (result.success) {
            // Re-sync profile to get updated progress in localStorage
            const user = await syncUserSession();
            return { 
                success: true, 
                progress: result.progress, 
                completed: result.completed,
                user
            };
        } else {
            return { success: false, message: result.message };
        }
    } catch (err) {
        return { success: false, message: 'Server connection failed.' };
    }
}

// Apply for job
async function applyForJob(jobId, applicationData) {
    try {
        const response = await fetch(`/api/jobs/${jobId}/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(applicationData)
        });
        const result = await response.json();
        if (result.success) {
            // Re-sync profile to get updated applications in localStorage
            await syncUserSession();
            return { success: true, message: result.message };
        } else {
            return { success: false, message: result.message };
        }
    } catch (err) {
        return { success: false, message: 'Server connection failed.' };
    }
}

// Logout function
async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
        // Ignore network errors on logout
    }
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Get user profile functions (sync wrappers around localStorage)
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

function updateCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function getEnrolledCourses() {
    const user = getCurrentUser();
    return user ? user.enrolledCourses : [];
}

function getCertificates() {
    const user = getCurrentUser();
    return user ? user.certificates : [];
}

function getJobApplications() {
    const user = getCurrentUser();
    return user ? user.jobApplications : [];
}
