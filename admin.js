let token = localStorage.getItem('adminToken') || null;

function el(id){return document.getElementById(id)}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    event.target.classList.add('active');
    el(tab + 'Tab').classList.add('active');
}

async function api(path, opts={}){
  opts.headers = opts.headers || {};
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(path, opts);
  if (res.status===401 || res.status===403) {
    logout();
    throw new Error('Unauthorized');
  }
  return res.json();
}

async function showAdmin(){
  el('loginPage').classList.add('hidden');
  el('adminPage').classList.remove('hidden');
  await loadCourses();
  await loadTraffic();
}

el('loginBtn').addEventListener('click', async ()=>{
  const email = el('email').value.trim();
  const password = el('password').value;
  el('loginMsg').textContent = '';
  try{
    const data = await api('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
    if (!data.success) { el('loginMsg').textContent = data.message || 'Login failed'; return; }
    token = data.token;
    localStorage.setItem('adminToken', token);
    await showAdmin();
  }catch(e){ el('loginMsg').textContent = e.message || 'Login error'; }
});

el('logoutBtn').addEventListener('click', logout);

function logout(){ token = null; localStorage.removeItem('adminToken'); el('adminPage').classList.add('hidden'); el('loginPage').classList.remove('hidden'); }

async function loadCourses(){
  try{
    const data = await api('/api/admin/courses');
    if (!data.success) return;
    const out = ['<table><tr><th>ID</th><th>Title</th><th>Category</th><th>Price</th><th>Actions</th></tr>'];
    const courseOptions = [];
    const editOptions = ['<option value="">Select a course</option>'];
    const lessonOptions = ['<option value="">Select a course</option>'];
    for (const c of data.courses){
      out.push(`<tr><td>${c.id}</td><td>${c.title}</td><td>${c.category}</td><td>KSH ${c.price}</td><td><button class="deleteCourse" data-id="${c.id}">Delete</button> <button class="editCourse" data-id="${c.id}">Edit</button> <button class="viewLessons" data-id="${c.id}">Lessons</button></td></tr>`);
      courseOptions.push(`<option value="${c.id}">${c.title}</option>`);
      editOptions.push(`<option value="${c.id}">${c.title}</option>`);
      lessonOptions.push(`<option value="${c.id}">${c.title}</option>`);
    }
    out.push('</table>');
    el('coursesList').innerHTML = out.join('');
    el('lesson_course').innerHTML = courseOptions.join('') || '<option value="">No courses</option>';
    el('lesson_list_course').innerHTML = lessonOptions.join('') || '<option value="">No courses</option>';
    el('edit_course').innerHTML = editOptions.join('');

    document.querySelectorAll('.deleteCourse').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this course and all lessons?')) return;
        try {
          const courseId = btn.dataset.id;
          const res = await api(`/api/admin/courses/${courseId}`, { method:'DELETE' });
          if (res.success) { alert('Course deleted'); await loadCourses(); }
          else alert(res.message || 'Delete failed');
        } catch (e) { alert('Delete error'); }
      });
    });
    document.querySelectorAll('.editCourse').forEach(btn => {
      btn.addEventListener('click', async () => {
        el('edit_course').value = btn.dataset.id;
        await loadEditCourse();
      });
    });
    document.querySelectorAll('.viewLessons').forEach(btn => {
      btn.addEventListener('click', async () => {
        el('lesson_list_course').value = btn.dataset.id;
        await loadLessonList();
      });
    });
  }catch(e){ el('coursesList').textContent = 'Failed to load'; }
}

el('refreshCourses').addEventListener('click', loadCourses);

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

el('createCourse').addEventListener('click', async ()=>{
  const title = el('c_title').value.trim();
  const category = el('c_category').value.trim();
  let image = el('c_image').value.trim();
  const description = el('c_description').value.trim();
  const price = parseFloat(el('c_price').value) || 0;
  const instructor = el('c_instructor').value.trim();
  const level = el('c_level').value.trim();
  const duration = el('c_duration').value.trim();
  const requirements = el('c_requirements').value.split(',').map(s => s.trim()).filter(Boolean);
  const outcomes = el('c_outcomes').value.split(',').map(s => s.trim()).filter(Boolean);
  try{
    const imageFile = el('c_image').files[0];
    if (imageFile) image = await fileToBase64(imageFile);
    const res = await api('/api/admin/courses', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, category, image, description, price, instructor, level, duration, requirements, outcomes }) });
    if (res.success){
      alert('Course created');
      el('c_title').value = '';
      el('c_category').value = '';
      el('c_image').value = '';
      el('c_duration').value = '';
      el('c_description').value = '';
      el('c_price').value = '';
      el('c_instructor').value = '';
      el('c_level').value = '';
      el('c_requirements').value = '';
      el('c_outcomes').value = '';
      await loadCourses();
    } else alert(res.message || 'Failed');
  }catch(e){ alert('Error: ' + e.message); }
});

async function loadEditCourse(){
  const courseId = el('edit_course').value;
  if (!courseId) { el('courseEditForm').classList.add('hidden'); return; }
  try{
    const data = await api(`/api/admin/courses/${courseId}`);
    if (!data.success) return;
    const course = data.course;
    el('e_title').value = course.title || '';
    el('e_category').value = course.category || '';
    el('e_description').value = course.description || '';
    el('e_price').value = course.price || '';
    el('e_instructor').value = course.instructor || '';
    el('courseEditForm').classList.remove('hidden');
  } catch (e) {
    alert('Error loading course');
  }
}

el('updateCourse').addEventListener('click', async ()=>{
  const courseId = el('edit_course').value;
  if (!courseId) return alert('Select a course');
  const title = el('e_title').value.trim();
  const category = el('e_category').value.trim();
  const description = el('e_description').value.trim();
  const price = parseFloat(el('e_price').value) || 0;
  const instructor = el('e_instructor').value.trim();
  try{
    const res = await api(`/api/admin/courses/${courseId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, category, description, price, instructor }) });
    if (res.success){ alert('Course updated'); await loadCourses(); }
    else alert(res.message || 'Failed');
  } catch (e){ alert('Error updating'); }
});

el('addLesson').addEventListener('click', async ()=>{
  const courseId = el('lesson_course').value;
  const title = el('lesson_title').value.trim();
  const video_url = el('lesson_video').value.trim();
  const content = el('lesson_content').value.trim();
  if (!courseId) return alert('Select a course');
  if (!title) return alert('Lesson title required');
  try{
    const res = await api(`/api/admin/courses/${courseId}/lessons`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, video_url, content }) });
    if (res.success){ alert('Lesson added'); el('lesson_title').value = ''; el('lesson_video').value = ''; el('lesson_content').value = ''; if (el('lesson_list_course').value == courseId) await loadLessonList(); }
    else alert(res.message || 'Failed');
  }catch(e){ alert('Error adding lesson'); }
});

async function loadLessonList(){
  const courseId = el('lesson_list_course').value;
  if (!courseId) { el('lessonList').innerHTML = ''; return; }
  try{
    const data = await api(`/api/admin/courses/${courseId}`);
    if (!data.success) return;
    const lessons = data.course.lessons || [];
    if (lessons.length === 0){ el('lessonList').innerHTML = '<p>No lessons yet.</p>'; return; }
    const rows = ['<table><tr><th>#</th><th>Title</th><th>Video</th><th>Content Preview</th><th>Actions</th></tr>'];
    for (const lesson of lessons){
      const contentPreview = lesson.content ? lesson.content.substring(0, 50) + '...' : '-';
      rows.push(`<tr><td>${lesson.order_index}</td><td>${lesson.title}</td><td>${lesson.video_url ? '<a href="' + lesson.video_url + '" target="_blank">Link</a>' : '-'}</td><td>${contentPreview}</td><td><button class="editLesson" data-lesson-id="${lesson.id}" data-course-id="${courseId}">Edit</button> <button class="deleteLesson delete" data-lesson-id="${lesson.id}" data-course-id="${courseId}">Delete</button></td></tr>`);
    }
    rows.push('</table>');
    el('lessonList').innerHTML = rows.join('');
    
    document.querySelectorAll('.editLesson').forEach(btn => {
      btn.addEventListener('click', () => editLesson(btn.dataset.courseId, btn.dataset.lessonId));
    });
    document.querySelectorAll('.deleteLesson').forEach(btn => {
      btn.addEventListener('click', () => deleteLesson(btn.dataset.courseId, btn.dataset.lessonId));
    });
  } catch (e) {
    el('lessonList').textContent = 'Failed to load lessons';
  }
}

async function editLesson(courseId, lessonId) {
  const newTitle = prompt('Edit lesson title:');
  if (newTitle === null) return;
  const newContent = prompt('Edit lesson content:');
  if (newContent === null) return;
  try {
    const res = await api(`/api/admin/courses/${courseId}/lessons/${lessonId}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ title: newTitle, content: newContent })
    });
    if (res.success) { alert('Lesson updated'); await loadLessonList(); }
    else alert(res.message || 'Failed');
  } catch (e) { alert('Error updating lesson'); }
}

async function deleteLesson(courseId, lessonId) {
  if (!confirm('Delete this lesson?')) return;
  try {
    const res = await api(`/api/admin/courses/${courseId}/lessons/${lessonId}`, { method: 'DELETE' });
    if (res.success) { alert('Lesson deleted'); await loadLessonList(); }
    else alert(res.message || 'Failed');
  } catch (e) { alert('Error deleting lesson'); }
}

async function loadTraffic(){
  try{
    const data = await api('/api/admin/traffic');
    if (!data.success) return;
    const logs = data.logs || [];
    const rows = ['<table><tr><th>Time</th><th>IP</th><th>URL</th><th>Session</th><th>User</th></tr>'];
    for (const l of logs.slice(0, 100)){ rows.push(`<tr><td>${l.timestamp}</td><td>${l.ip_address}</td><td>${l.page_url}</td><td>${l.session_id.substring(0, 8)}</td><td>${l.user_id || '-'}</td></tr>`); }
    rows.push('</table>');
    el('trafficList').innerHTML = rows.join('');
  }catch(e){ el('trafficList').textContent = 'Failed to load'; }
}

el('refreshTraffic').addEventListener('click', loadTraffic);

if (token) {
  showAdmin().catch(() => logout());
}
