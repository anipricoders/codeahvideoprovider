import React, { useState, useEffect } from 'react';
import { BookOpen, Film, User, BarChart3, Plus, Trash, Edit2, ShieldAlert, Sparkles, RefreshCw, UserCheck, Eye, Check } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
}

interface Video {
  id: string;
  courseId: string;
  topicName: string;
  title: string;
  url: string;
  order: number;
}

interface Student {
  id: string;
  name: string;
  username: string;
  password?: string;
  assignedCourses: string[];
  createdAt: string;
}

interface AnalyticsRecord {
  studentId: string;
  studentName: string;
  username: string;
  courseId: string;
  courseTitle: string;
  totalVideos: number;
  completedVideosCount: number;
  overallPercentage: number;
  progressList: any[];
  code: string;
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'videos' | 'students' | 'analytics'>('courses');
  
  // Data State
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsRecord[]>([]);
  
  // Select state for Managing Videos
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  // Modals state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [vidTopic, setVidTopic] = useState('');
  const [vidTitle, setVidTitle] = useState('');
  const [vidUrl, setVidUrl] = useState('');
  const [vidOrder, setVidOrder] = useState<number>(1);
  const [uploading, setUploading] = useState(false);

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentAssignedCourses, setStudentAssignedCourses] = useState<string[]>([]);

  const [selectedAnalyticsDetails, setSelectedAnalyticsDetails] = useState<AnalyticsRecord | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const getHeaders = () => {
    const token = localStorage.getItem('codeah_admin_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    };
  };

  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchVideos(selectedCourseId);
    } else {
      setVideos([]);
    }
  }, [selectedCourseId]);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_URL}/courses`, { headers: getHeaders() });
      const data = await res.json();
      setCourses(data);
      if (data.length > 0 && !selectedCourseId) {
        setSelectedCourseId(data[0].id);
      }
    } catch (err) {
      showErr('Error fetching courses');
    }
  };

  const fetchVideos = async (courseId: string) => {
    try {
      const res = await fetch(`${API_URL}/courses/${courseId}/videos`, { headers: getHeaders() });
      const data = await res.json();
      setVideos(data);
    } catch (err) {
      showErr('Error fetching video topics');
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/students`, { headers: getHeaders() });
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      showErr('Error fetching student accounts');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/analytics`, { headers: getHeaders() });
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      showErr('Error fetching analytics telemetry');
    }
  };

  const showMsg = (txt: string) => {
    setMessage(txt);
    setTimeout(() => setMessage(null), 3000);
  };

  const showErr = (txt: string) => {
    setError(txt);
    setTimeout(() => setError(null), 4000);
  };

  // Course actions
  const openCourseModal = (course: Course | null = null) => {
    if (course) {
      setEditingCourse(course);
      setCourseTitle(course.title);
      setCourseDesc(course.description);
    } else {
      setEditingCourse(null);
      setCourseTitle('');
      setCourseDesc('');
    }
    setShowCourseModal(true);
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) return;

    try {
      let res;
      if (editingCourse) {
        res = await fetch(`${API_URL}/admin/courses/${editingCourse.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ title: courseTitle, description: courseDesc })
        });
      } else {
        res = await fetch(`${API_URL}/admin/courses`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ title: courseTitle, description: courseDesc })
        });
      }
      
      if (!res.ok) throw new Error('Action failed');
      
      showMsg(editingCourse ? 'Course updated successfully' : 'Course created successfully');
      setShowCourseModal(false);
      fetchCourses();
    } catch (err) {
      showErr('Failed to save course');
    }
  };

  const handleCourseDelete = async (id: string) => {
    if (!window.confirm('Warning: Deleting this course will also delete all associated videos, student progress logs and course bindings. Proceed?')) return;

    try {
      const res = await fetch(`${API_URL}/admin/courses/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Delete failed');
      showMsg('Course successfully deleted');
      fetchCourses();
      if (selectedCourseId === id) {
        setSelectedCourseId('');
      }
    } catch (err) {
      showErr('Failed to delete course');
    }
  };

  // Video actions
  const openVideoModal = (video: Video | null = null) => {
    if (video) {
      setEditingVideo(video);
      setVidTopic(video.topicName);
      setVidTitle(video.title);
      setVidUrl(video.url);
      setVidOrder(video.order);
    } else {
      setEditingVideo(null);
      setVidTopic('');
      setVidTitle('');
      setVidUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4');
      setVidOrder(videos.length + 1);
    }
    setShowVideoModal(true);
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vidTopic.trim() || !vidUrl.trim() || !selectedCourseId) return;

    try {
      let res;
      if (editingVideo) {
        res = await fetch(`${API_URL}/admin/videos/${editingVideo.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ topicName: vidTopic, title: vidTitle || vidTopic, url: vidUrl, order: Number(vidOrder) })
        });
      } else {
        res = await fetch(`${API_URL}/admin/courses/${selectedCourseId}/videos`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ topicName: vidTopic, title: vidTitle || vidTopic, url: vidUrl, order: Number(vidOrder) })
        });
      }

      if (!res.ok) throw new Error('Action failed');

      showMsg(editingVideo ? 'Video topic updated successfully' : 'Video topic added successfully');
      setShowVideoModal(false);
      fetchVideos(selectedCourseId);
    } catch (err) {
      showErr(editingVideo ? 'Failed to update video topic' : 'Failed to add video topic');
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch(`${API_URL}/admin/videos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('codeah_admin_token')
        },
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setVidUrl(data.url);
      showMsg('Video file uploaded successfully!');
    } catch (err) {
      showErr('Failed to upload video file');
    } finally {
      setUploading(false);
    }
  };

  const handleVideoDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this topic from the course?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/videos/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Delete failed');
      showMsg('Video topic deleted');
      fetchVideos(selectedCourseId);
    } catch (err) {
      showErr('Failed to delete video topic');
    }
  };

  // Student Account actions
  const openStudentModal = (student: Student | null = null) => {
    if (student) {
      setEditingStudent(student);
      setStudentName(student.name);
      setStudentUsername(student.username);
      setStudentPassword(student.password || '');
      setStudentAssignedCourses(student.assignedCourses);
    } else {
      setEditingStudent(null);
      setStudentName('');
      setStudentUsername('');
      setStudentPassword('123'); // Default simple password
      setStudentAssignedCourses([]);
    }
    setShowStudentModal(true);
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentUsername.trim() || !studentPassword.trim()) {
      showErr('Name, username, and password are required');
      return;
    }

    const payload = {
      name: studentName.trim(),
      username: studentUsername.trim().toLowerCase(),
      password: studentPassword.trim(),
      assignedCourses: studentAssignedCourses
    };

    try {
      let res;
      if (editingStudent) {
        res = await fetch(`${API_URL}/admin/students/${editingStudent.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/admin/students`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save student account');
      }

      showMsg(editingStudent ? 'Student credentials updated' : 'Student account provisioned');
      setShowStudentModal(false);
      fetchStudents();
    } catch (err: any) {
      showErr(err.message || 'Action failed');
    }
  };

  const handleStudentDelete = async (student: Student) => {
    if (!window.confirm(`Delete student account for ${student.name} (${student.username})? All watch progress will be permanently deleted.`)) return;
    try {
      const res = await fetch(`${API_URL}/admin/students/${student.id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Deletion failed');
      showMsg('Student account deleted');
      fetchStudents();
    } catch (err) {
      showErr('Failed to delete student account');
    }
  };

  const toggleCourseAssignment = (courseId: string) => {
    setStudentAssignedCourses(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };

  // Helper to fetch course title
  const getCourseTitle = (courseId: string): string => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : courseId;
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Panel */}
      <div className="sidebar">
        <button
          className={`sidebar-item ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <BookOpen size={18} />
          Courses Manager
        </button>
        <button
          className={`sidebar-item ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          <Film size={18} />
          Video Lessons
        </button>
        <button
          className={`sidebar-item ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('students');
            fetchStudents();
          }}
        >
          <User size={18} />
          Student Accounts
        </button>
        <button
          className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('analytics');
            fetchAnalytics();
          }}
        >
          <BarChart3 size={18} />
          Student Analytics
        </button>
        
        <div style={{ marginTop: 'auto', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
          <Sparkles size={16} style={{ color: '#06b6d4', marginBottom: '0.25rem' }} />
          <div>Admin Mode</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Credentials: mahaniyaTechnology / pass123</div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="main-content">
        {error && <div className="alert alert-danger"><ShieldAlert size={18} /><span>{error}</span></div>}
        {message && <div className="alert alert-success"><UserCheck size={18} /><span>{message}</span></div>}

        {/* TAB 1: COURSES MANAGER */}
        {activeTab === 'courses' && (
          <div>
            <div className="header-actions">
              <div>
                <h2>Courses Catalogue</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Create academic courses and configure syllabus modules.</p>
              </div>
              <button className="btn-primary" onClick={() => openCourseModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}>
                <Plus size={16} /> Create Course
              </button>
            </div>

            <div className="grid-cards">
              {courses.map(course => {
                return (
                  <div className="glass-card card-course" key={course.id}>
                    <div className="card-course-header">
                      <h3>{course.title}</h3>
                      <p>{course.description || 'No description provided.'}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Course ID: <span style={{ fontFamily: 'monospace', color: 'white' }}>{course.id}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <div className="card-actions">
                          <button className="btn-icon edit" onClick={() => openCourseModal(course)} title="Edit details">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn-icon delete" onClick={() => handleCourseDelete(course.id)} title="Delete Course">
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {courses.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No courses found. Click "Create Course" to populate.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: VIDEO LESSONS */}
        {activeTab === 'videos' && (
          <div>
            <div className="header-actions">
              <div>
                <h2>Curriculum Video Manager</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Configure sequence order and add media streams for each topic.</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="input-control"
                  style={{ width: '220px', padding: '0.5rem 1rem' }}
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>

                <button
                  className="btn-primary"
                  onClick={() => openVideoModal()}
                  disabled={!selectedCourseId}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}
                >
                  <Plus size={16} /> Add Video Topic
                </button>
              </div>
            </div>

            {selectedCourseId ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Order</th>
                      <th>Topic Name</th>
                      <th>Video Title</th>
                      <th>Video Resource Path</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map(video => (
                      <tr key={video.id}>
                        <td style={{ fontWeight: 700, color: 'var(--secondary)' }}>#{video.order}</td>
                        <td style={{ fontWeight: 600 }}>{video.topicName}</td>
                        <td>{video.title}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={video.url}>
                          {video.url}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn-icon edit" onClick={() => openVideoModal(video)} title="Edit video details">
                              <Edit2 size={14} />
                            </button>
                            <button className="btn-icon delete" onClick={() => handleVideoDelete(video.id)} title="Delete video topic">
                              <Trash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {videos.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                          No topics found for this course. Click "Add Video Topic" to register videos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                Please select an active course from the top dropdown to manage its curriculum sequence.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STUDENT ACCOUNTS */}
        {activeTab === 'students' && (
          <div>
            <div className="header-actions">
              <div>
                <h2>Student Accounts (Total: {students.length})</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Create student credentials and assign access permissions to courses.</p>
              </div>
              <button className="btn-primary" onClick={() => openStudentModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}>
                <Plus size={16} /> Create Student
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Username</th>
                    <th>Assigned Course Scope</th>
                    <th>Password</th>
                    <th>Created On</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td><span className="code-badge">{s.username}</span></td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {s.assignedCourses.length > 0 ? (
                            s.assignedCourses.map(cId => (
                              <span key={cId} className="badge badge-student" style={{ fontSize: '0.7rem' }}>
                                {getCourseTitle(cId)}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>No assigned courses</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>{s.password}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="btn-icon edit" onClick={() => openStudentModal(s)} title="Modify details">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn-icon delete" onClick={() => handleStudentDelete(s)} title="Delete account">
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No student accounts generated yet. Click "Create Student" to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: STUDENT ANALYTICS */}
        {activeTab === 'analytics' && (
          <div>
            <div className="header-actions">
              <div>
                <h2>Cohort Analytics Dashboard</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Track individual student playhead indexes, completion rates, and active watchlist statistics.</p>
              </div>
              <button className="btn-secondary" onClick={fetchAnalytics} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw size={14} /> Refresh Logs
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Username</th>
                    <th>Course Syllabus</th>
                    <th>Videos Completed</th>
                    <th style={{ width: '220px' }}>Completion Progress</th>
                    <th style={{ width: '100px', textAlign: 'right' }}>Telemetry Log</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.map((record, index) => (
                    <tr key={`${record.studentId}-${record.courseId}-${index}`}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{record.studentName}</div>
                      </td>
                      <td><span className="code-badge">{record.username}</span></td>
                      <td>{record.courseTitle}</td>
                      <td style={{ fontWeight: 500 }}>
                        {record.completedVideosCount} / {record.totalVideos} videos
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="progress-bar-container" style={{ flex: 1 }}>
                            <div className="progress-bar-fill" style={{ width: `${record.overallPercentage}%` }} />
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '35px', color: record.overallPercentage === 100 ? 'var(--success)' : 'white' }}>
                            {record.overallPercentage}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button className="btn-icon" onClick={() => setSelectedAnalyticsDetails(record)} title="View Detailed Log">
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {analytics.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No records to display. Provision student accounts and check watchlist metrics.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Add/Edit Course */}
      {showCourseModal && (
        <div className="modal-overlay">
          <form onSubmit={handleCourseSubmit} className="modal-content">
            <div className="modal-header">
              <h3>{editingCourse ? 'Modify Course Metadata' : 'Provision New Course'}</h3>
              <button type="button" className="btn-icon" onClick={() => setShowCourseModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label htmlFor="modalCourseTitle">Course Title</label>
              <input
                id="modalCourseTitle"
                type="text"
                required
                className="input-control"
                placeholder="e.g. Advanced Java Structures"
                value={courseTitle}
                onChange={e => setCourseTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="modalCourseDesc">Description</label>
              <textarea
                id="modalCourseDesc"
                rows={4}
                className="input-control"
                placeholder="Details summarizing curriculum goals..."
                value={courseDesc}
                onChange={e => setCourseDesc(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowCourseModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                {editingCourse ? 'Save Changes' : 'Initialize Course'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Add/Edit Video Lesson */}
      {showVideoModal && (
        <div className="modal-overlay">
          <form onSubmit={handleVideoSubmit} className="modal-content">
            <div className="modal-header">
              <h3>{editingVideo ? 'Modify Lesson Parameters' : 'Add Topic Video'}</h3>
              <button type="button" className="btn-icon" onClick={() => setShowVideoModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label htmlFor="modalTopicName">Topic / Subject Name</label>
              <input
                id="modalTopicName"
                type="text"
                required
                className="input-control"
                placeholder="e.g. Topic 1: Memory Stack Allocation"
                value={vidTopic}
                onChange={e => setVidTopic(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="modalVidTitle">Video Display Title</label>
              <input
                id="modalVidTitle"
                type="text"
                className="input-control"
                placeholder="Short video label (Optional)"
                value={vidTitle}
                onChange={e => setVidTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="modalVidUrl">Video Source URL (Direct MP4)</label>
              <input
                id="modalVidUrl"
                type="url"
                required
                className="input-control"
                placeholder="https://..."
                value={vidUrl}
                onChange={e => setVidUrl(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Must be a direct link to an MP4 video file so browser player can stream.
              </span>
            </div>
            <div className="form-group" style={{ border: '1px dashed var(--border-color)', padding: '1rem', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
              <label htmlFor="uploadVideoFile" style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Or Upload Local Video File</label>
              <input
                id="uploadVideoFile"
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                style={{ fontSize: '0.85rem' }}
                disabled={uploading}
              />
              {uploading && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>
                  ⏳ Uploading video file... Please wait.
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="modalVidOrder">Sequence Index Order</label>
              <input
                id="modalVidOrder"
                type="number"
                min={1}
                required
                className="input-control"
                value={vidOrder}
                onChange={e => setVidOrder(Number(e.target.value))}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowVideoModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                {editingVideo ? 'Save Changes' : 'Append Lesson'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Create/Modify Student Account */}
      {showStudentModal && (
        <div className="modal-overlay">
          <form onSubmit={handleStudentSubmit} className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{editingStudent ? 'Modify Student Credentials' : 'Provision Student Account'}</h3>
              <button type="button" className="btn-icon" onClick={() => setShowStudentModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label htmlFor="modalStudentName">Student Reference Name</label>
              <input
                id="modalStudentName"
                type="text"
                required
                className="input-control"
                placeholder="e.g. Charlie Brown"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="modalStudentUsername">Username (For Login)</label>
              <input
                id="modalStudentUsername"
                type="text"
                required
                className="input-control"
                placeholder="e.g. charlie"
                value={studentUsername}
                onChange={e => setStudentUsername(e.target.value)}
                style={{ textTransform: 'lowercase' }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="modalStudentPassword">Password</label>
              <input
                id="modalStudentPassword"
                type="text"
                required
                className="input-control"
                placeholder="Secure access password"
                value={studentPassword}
                onChange={e => setStudentPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label style={{ marginBottom: '0.5rem', display: 'block' }}>Course Enrollment Bindings</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {courses.map(course => {
                  const isChecked = studentAssignedCourses.includes(course.id);
                  return (
                    <div 
                      key={course.id} 
                      onClick={() => toggleCourseAssignment(course.id)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '4px',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div 
                        style={{ 
                          width: '18px', 
                          height: '18px', 
                          borderRadius: '4px', 
                          border: '2px solid var(--border-color)',
                          background: isChecked ? 'var(--secondary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'var(--transition-smooth)'
                        }}
                      >
                        {isChecked && <Check size={12} style={{ color: 'black' }} />}
                      </div>
                      <span style={{ fontSize: '0.875rem', color: isChecked ? 'white' : 'var(--text-muted)' }}>
                        {course.title}
                      </span>
                    </div>
                  );
                })}
                {courses.length === 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No courses available in catalogue yet.
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowStudentModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                {editingStudent ? 'Save Changes' : 'Create Student'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Detailed Progress Analytics */}
      {selectedAnalyticsDetails && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Classroom Activity Log</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Student: <span style={{ color: 'white', fontWeight: 600 }}>{selectedAnalyticsDetails.studentName} ({selectedAnalyticsDetails.username})</span>
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Course: <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{selectedAnalyticsDetails.courseTitle}</span>
                </p>
              </div>
              <button type="button" className="btn-icon" onClick={() => setSelectedAnalyticsDetails(null)}>×</button>
            </div>

            <div style={{ margin: '1.5rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <span>Overall Completion</span>
                <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{selectedAnalyticsDetails.overallPercentage}%</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${selectedAnalyticsDetails.overallPercentage}%` }} />
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Topic Playhead Telemetry
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {selectedAnalyticsDetails.progressList && selectedAnalyticsDetails.progressList.length > 0 ? (
                selectedAnalyticsDetails.progressList.map((prog, idx) => {
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.75rem', 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '8px' 
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Topic: {prog.topicName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Title: {prog.videoTitle}
                        </div>
                        {prog.lastWatchedAt && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Last Ping: {new Date(prog.lastWatchedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span 
                          style={{ 
                            fontSize: '0.75rem', 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '4px', 
                            fontWeight: 600, 
                            background: prog.completed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: prog.completed ? 'var(--success)' : 'var(--warning)',
                            border: `1px solid ${prog.completed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                            marginRight: '0.5rem'
                          }}
                        >
                          {prog.completed ? 'Completed' : 'Watching'}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 600 }}>
                          {Math.floor(prog.secondsWatched / 60)}m {prog.secondsWatched % 60}s watched
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No playhead telemetry has been reported yet. Student has not launched the player workspace.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedAnalyticsDetails(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
