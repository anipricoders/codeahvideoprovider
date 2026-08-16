import React, { useState, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { 
  CheckCircle2, 
  Lock, 
  PlayCircle, 
  LogOut, 
  Award, 
  ShieldAlert, 
  Search, 
  Bell, 
  GraduationCap, 
  Heart, 
  BarChart3, 
  Settings, 
  User, 
  ChevronDown,
  Menu,
  Compass
} from 'lucide-react';

interface Video {
  id: string;
  courseId: string;
  topicName: string;
  title: string;
  url: string;
  order: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
}

interface StudentDashboardProps {
  studentData: {
    studentId: string;
    token: string;
    username: string;
    name: string;
    assignedCourses: string[];
  };
  onLogout: () => void;
}

interface LocalProgress {
  videoId: string;
  secondsWatched: number;
  completed: boolean;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ studentData, onLogout }) => {
  const { studentId, name: studentName, token, assignedCourses = [] } = studentData || {};

  const [courses, setCourses] = useState<Course[]>([]);
  const [activeAssignedCourses, setActiveAssignedCourses] = useState<string[]>(assignedCourses);
  const [courseVideosMap, setCourseVideosMap] = useState<Record<string, Video[]>>({});
  
  // LMS Menu State
  const [activeMenu, setActiveMenu] = useState<'available' | 'my-courses' | 'wishlist' | 'progress' | 'certificates' | 'settings'>('my-courses');
  const [isViewingCourse, setIsViewingCourse] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [courseVideos, setCourseVideos] = useState<Video[]>([]);
  const [progressList, setProgressList] = useState<LocalProgress[]>([]);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [videoDurations, setVideoDurations] = useState<Record<string, string>>({});

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchInitialData();
  }, [studentId]);

  // Dynamically load durations of the video files in the playlist
  useEffect(() => {
    courseVideos.forEach(vid => {
      // Create a temporary video element to extract duration
      const tempVideo = document.createElement('video');
      tempVideo.src = vid.url;
      tempVideo.preload = 'metadata';
      
      tempVideo.onloadedmetadata = () => {
        const duration = tempVideo.duration;
        if (!isNaN(duration) && isFinite(duration)) {
          const mins = Math.floor(duration / 60);
          const secs = Math.floor(duration % 60);
          const formatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
          setVideoDurations(prev => {
            if (prev[vid.id] === formatted) return prev;
            return { ...prev, [vid.id]: formatted };
          });
        }
      };

      tempVideo.onerror = () => {
        setVideoDurations(prev => {
          if (prev[vid.id] === '10:00') return prev;
          return { ...prev, [vid.id]: '10:00' };
        });
      };
    });
  }, [courseVideos]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // 0. Fetch latest profile to sync assigned courses
      let currentAssigned = assignedCourses;
      try {
        const profileRes = await fetch(`${API_URL}/students/profile`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.assignedCourses) {
            currentAssigned = profileData.assignedCourses;
            setActiveAssignedCourses(currentAssigned);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }

      // 1. Fetch all courses
      const coursesRes = await fetch(`${API_URL}/courses`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!coursesRes.ok) throw new Error('Failed to load courses');
      const coursesData = await coursesRes.json();
      setCourses(coursesData);

      // 2. Fetch progress
      const progressRes = await fetch(`${API_URL}/progress/${studentId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!progressRes.ok) throw new Error('Failed to load progress');
      const progressData = await progressRes.json();
      setProgressList(progressData);

      // 3. Fetch videos for all assigned courses
      const videosMap: Record<string, Video[]> = {};
      await Promise.all(
        coursesData
          .filter((c: Course) => currentAssigned.includes(c.id))
          .map(async (c: Course) => {
            try {
              const res = await fetch(`${API_URL}/courses/${c.id}/videos`, {
                headers: { 'Authorization': 'Bearer ' + token }
              });
              if (res.ok) {
                const data = await res.json();
                videosMap[c.id] = data;
              }
            } catch (err) {
              console.error(`Failed to load videos for course ${c.id}`, err);
            }
          })
      );
      setCourseVideosMap(videosMap);

      // 4. Set default selected course from assigned courses if available
      const assigned = coursesData.filter((c: Course) => currentAssigned.includes(c.id));
      if (assigned.length > 0) {
        setSelectedCourseId(assigned[0].id);
      } else if (coursesData.length > 0) {
        setSelectedCourseId(coursesData[0].id);
      }
    } catch (err) {
      console.error('Error fetching initial student dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentProgressOnly = async () => {
    try {
      const res = await fetch(`${API_URL}/progress/${studentId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        setProgressList(data);
      }
    } catch (err) {
      console.error('Error refreshing student progress:', err);
    }
  };

  // Sync course videos when selectedCourseId changes
  useEffect(() => {
    if (!selectedCourseId) return;

    const isAssigned = activeAssignedCourses.includes(selectedCourseId);
    if (isAssigned) {
      fetchCourseVideos(selectedCourseId);
    } else {
      setCourseVideos([]);
      setActiveVideoIndex(0);
    }
  }, [selectedCourseId, activeAssignedCourses]);

  const fetchCourseVideos = async (courseId: string) => {
    try {
      const res = await fetch(`${API_URL}/courses/${courseId}/videos`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('Failed to load videos');
      const data: Video[] = await res.json();
      setCourseVideos(data);

      // Determine active video index (first uncompleted unlocked video)
      if (data.length > 0) {
        let firstUnfinishedIndex = 0;
        for (let i = 0; i < data.length; i++) {
          const isCompleted = progressList.some(p => p.videoId === data[i].id && p.completed);
          if (!isCompleted) {
            firstUnfinishedIndex = i;
            break;
          }
        }

        // Double check that it's unlocked (i.e. all preceding videos are completed)
        let isUnlocked = true;
        for (let i = 0; i < firstUnfinishedIndex; i++) {
          const isCompleted = progressList.some(p => p.videoId === data[i].id && p.completed);
          if (!isCompleted) {
            isUnlocked = false;
            break;
          }
        }

        if (isUnlocked) {
          setActiveVideoIndex(firstUnfinishedIndex);
        } else {
          setActiveVideoIndex(0);
        }
      }
    } catch (err) {
      console.error('Error fetching course videos:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const isSelectedCourseAssigned = activeAssignedCourses.includes(selectedCourseId);

  // Helper to determine if a specific video index is unlocked
  const isVideoUnlocked = (index: number): boolean => {
    if (index === 0) return true;
    const prevVideo = courseVideos[index - 1];
    return progressList.some(p => p.videoId === prevVideo.id && p.completed);
  };

  // Helper to check if video is completed
  const isVideoCompleted = (videoId: string): boolean => {
    return progressList.some(p => p.videoId === videoId && p.completed);
  };

  // Helper to get seconds watched for a video
  const getVideoSecondsWatched = (videoId: string): number => {
    const record = progressList.find(p => p.videoId === videoId);
    return record ? record.secondsWatched : 0;
  };

  const handleProgressUpdate = async (seconds: number, completed: boolean) => {
    const activeVideo = courseVideos[activeVideoIndex];
    if (!activeVideo) return;

    try {
      const res = await fetch(`${API_URL}/progress/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          studentId,
          videoId: activeVideo.id,
          secondsWatched: seconds,
          completed
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.resetTo !== undefined && res.status === 400) {
          showToast('Alert: Playback sync issue. Restoring correct playhead index.');
          fetchStudentProgressOnly();
          return;
        }
        throw new Error(data.error);
      }

      // Update local state directly to keep UI snappy
      setProgressList(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(p => p.videoId === activeVideo.id);
        if (idx === -1) {
          copy.push({ videoId: activeVideo.id, secondsWatched: seconds, completed });
        } else {
          copy[idx] = {
            ...copy[idx],
            secondsWatched: Math.max(copy[idx].secondsWatched, seconds),
            completed: copy[idx].completed || completed
          };
        }
        return copy;
      });

      if (completed && !isVideoCompleted(activeVideo.id)) {
        showToast(`Congratulations! You have completed: "${activeVideo.topicName}"`);
      }
    } catch (err: any) {
      console.error('Progress sync error:', err.message);
    }
  };

  const handleVideoEnded = () => {
    const activeVideo = courseVideos[activeVideoIndex];
    showToast(`Topic completed: "${activeVideo?.topicName || ''}"`);
    
    const nextIdx = activeVideoIndex + 1;
    if (nextIdx < courseVideos.length) {
      setActiveVideoIndex(nextIdx);
      showToast(`Loading next topic: "${courseVideos[nextIdx].topicName}"`);
    } else {
      showToast('Mastery achieved! You have completed the entire course curriculum.');
    }
  };

  const handlePlaylistItemClick = (index: number) => {
    if (isVideoUnlocked(index)) {
      setActiveVideoIndex(index);
    } else {
      showToast('Topic is locked. You must watch all preceding lessons to unlock.');
    }
  };

  // Get course-level progress details
  const getCourseProgress = (courseId: string) => {
    const videos = courseVideosMap[courseId] || [];
    if (videos.length === 0) return { percentage: 0, completedCount: 0, totalCount: 0 };
    
    const completedCount = videos.filter(v => 
      progressList.some(p => p.videoId === v.id && p.completed)
    ).length;
    
    return {
      percentage: Math.round((completedCount / videos.length) * 100),
      completedCount,
      totalCount: videos.length
    };
  };

  // Calculate course progress percentage helper (for current course videos sidebar)
  const calculateCourseProgress = (courseId: string, totalVids: number): number => {
    if (totalVids === 0) return 0;
    if (courseId === selectedCourseId) {
      const completedCount = courseVideos.filter(v => isVideoCompleted(v.id)).length;
      return courseVideos.length > 0 ? Math.round((completedCount / courseVideos.length) * 100) : 0;
    }
    return 0;
  };

  // Map backend courses to detailed LMS course data
  const getCourseLmsDetails = (courseId: string) => {
    const isReact = courseId.includes('react');
    return {
      thumbnail: isReact 
        ? 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80' 
        : 'https://images.unsplash.com/photo-1516116211223-5c359a36298a?auto=format&fit=crop&w=800&q=80',
      instructor: isReact ? 'Dr. Sarah Mitchell' : 'Prof. Alan Vance',
      instructorTitle: isReact ? 'Lead Frontend Architect' : 'Compiler Design Engineer',
      instructorAvatar: isReact 
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80'
        : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
      duration: isReact ? '12h 45m' : '8h 15m',
      level: isReact ? 'Beginner' : 'Advanced',
      rating: isReact ? 4.9 : 4.8,
      reviews: isReact ? 142 : 89,
      students: isReact ? '3,450' : '1,280',
      price: isReact ? '$89.99' : '$119.99',
      lessons: isReact ? 3 : 2
    };
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 600, fontFamily: 'var(--font-sans)', background: 'var(--bg-dark)' }}>
        Loading Classroom Workspace...
      </div>
    );
  }

  // Lists filter
  const allCoursesList = courses;
  const myCoursesList = courses.filter(c => activeAssignedCourses.includes(c.id));
  
  const currentList = activeMenu === 'available' ? allCoursesList : myCoursesList;
  const filteredCourses = currentList.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const selectedCourseLms = selectedCourse ? getCourseLmsDetails(selectedCourse.id) : null;
  const currentVideo = courseVideos[activeVideoIndex];

  const handleViewCourse = (courseId: string) => {
    if (courseId !== selectedCourseId) {
      setCourseVideos([]);
      setActiveVideoIndex(0);
    }
    setSelectedCourseId(courseId);
    setIsViewingCourse(true);
  };

  return (
    <div className="lms-layout" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Top Navbar */}
      <header className="lms-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="lms-btn lms-btn-secondary" style={{ display: 'none', padding: '0.4rem' }} onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)' }}>
            <GraduationCap size={28} />
            <span>Code Academy</span>
          </div>
        </div>

        {/* Search Bar - hidden when viewing course to maintain cleaner workspace */}
        {!isViewingCourse && (
          <div className="lms-search-container">
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search courses..." 
              className="lms-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative' }}>
          <button className="lms-btn lms-btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }}>
            <Bell size={18} />
          </button>
          
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden' }}>
              <User size={18} />
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {studentName}
              <ChevronDown size={14} />
            </span>
          </div>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div style={{ position: 'absolute', top: '48px', right: 0, width: '180px', backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', padding: '0.5rem', zIndex: 1100 }}>
              <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                Signed in as <strong style={{ color: 'var(--text-dark)' }}>{studentName}</strong>
              </div>
              <button 
                onClick={() => { setShowProfileDropdown(false); onLogout(); }}
                className="lms-sidebar-btn" 
                style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', width: '100%', fontSize: '0.85rem' }}
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left Sidebar */}
        <aside className={`lms-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="lms-sidebar-nav">

            
            <button 
              className={`lms-sidebar-btn ${activeMenu === 'my-courses' && !isViewingCourse ? 'active' : ''}`}
              onClick={() => { setActiveMenu('my-courses'); setIsViewingCourse(false); setSidebarOpen(false); }}
            >
              <GraduationCap size={18} />
              <span>My Courses</span>
            </button>
            
            <button 
              className={`lms-sidebar-btn ${activeMenu === 'wishlist' ? 'active' : ''}`}
              onClick={() => { setActiveMenu('wishlist'); setIsViewingCourse(false); setSidebarOpen(false); }}
            >
              <Heart size={18} />
              <span>Wishlist</span>
            </button>
            
            <button 
              className={`lms-sidebar-btn ${activeMenu === 'progress' ? 'active' : ''}`}
              onClick={() => { setActiveMenu('progress'); setIsViewingCourse(false); setSidebarOpen(false); }}
            >
              <BarChart3 size={18} />
              <span>Progress</span>
            </button>
            
            <button 
              className={`lms-sidebar-btn ${activeMenu === 'certificates' ? 'active' : ''}`}
              onClick={() => { setActiveMenu('certificates'); setIsViewingCourse(false); setSidebarOpen(false); }}
            >
              <Award size={18} />
              <span>Certificates</span>
            </button>
            
            <button 
              className={`lms-sidebar-btn ${activeMenu === 'settings' ? 'active' : ''}`}
              onClick={() => { setActiveMenu('settings'); setIsViewingCourse(false); setSidebarOpen(false); }}
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </div>

          <button 
            className="lms-sidebar-btn" 
            style={{ color: 'var(--danger)' }} 
            onClick={onLogout}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </aside>

        {/* Main Content Workspace */}
        <main className="lms-main">
          {isViewingCourse && selectedCourse ? (
            /* ==================== DETAILED COURSE WORKSPACE ==================== */
            !isSelectedCourseAssigned ? (
              /* Access Restricted Page */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '400px' }}>
                <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '2.5rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: '0 10px 30px rgba(239,68,68,0.05)' }}>
                  <ShieldAlert size={56} style={{ color: 'var(--danger)', marginBottom: '1.25rem' }} />
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-dark)' }}>Access Policy Restriction</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    The course <strong>"{selectedCourse.title}"</strong> has not been assigned to your student profile yet.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button className="lms-btn lms-btn-secondary" onClick={() => setIsViewingCourse(false)}>
                      Back to Courses
                    </button>
                    <div style={{ padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>
                      Syllabus is Locked
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Assigned Active Course Workspace */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                {/* Header view course row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button className="lms-btn lms-btn-secondary" onClick={() => setIsViewingCourse(false)}>
                    ← Back
                  </button>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                    {selectedCourse.title}
                  </h1>
                </div>

                <div className="lms-viewer-grid">
                  {/* Left Column: Player & Metadata */}
                  <div className="lms-viewer-panel">
                    <div className="custom-player">
                      {currentVideo ? (
                        <VideoPlayer
                          key={currentVideo.id}
                          videoId={currentVideo.id}
                          videoUrl={currentVideo.url}
                          initialSecondsWatched={getVideoSecondsWatched(currentVideo.id)}
                          onProgressUpdate={handleProgressUpdate}
                          onVideoEnded={handleVideoEnded}
                        />
                      ) : (
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          No videos registered for this course syllabus.
                        </div>
                      )}
                    </div>

                    {/* Lesson description information panel */}
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <div>
                          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                            {currentVideo ? currentVideo.title : 'Overview'}
                          </h2>
                          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span>Topic: <strong>{currentVideo?.topicName || 'General'}</strong></span>
                            <span>Order Index: #<strong>{currentVideo?.order || 0}</strong></span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img 
                            src={selectedCourseLms?.instructorAvatar} 
                            alt={selectedCourseLms?.instructor} 
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{selectedCourseLms?.instructor}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedCourseLms?.instructorTitle}</div>
                          </div>
                        </div>
                      </div>

                      {/* Course progress indicator */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Course Completion Progress</span>
                          <span style={{ color: 'var(--primary)' }}>{calculateCourseProgress(selectedCourseId, courseVideos.length)}%</span>
                        </div>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${calculateCourseProgress(selectedCourseId, courseVideos.length)}%` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                          <span>Completed {courseVideos.filter(v => isVideoCompleted(v.id)).length} of {courseVideos.length} topics</span>
                          <span>Course Duration: {selectedCourseLms?.duration}</span>
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Course Syllabus Overview</h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                          {selectedCourse.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Scrollable Playlist Content */}
                  <div className="lms-content-panel">
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)' }}>Course Content</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{courseVideos.length} lessons</span>
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                      {courseVideos.map((vid, idx) => {
                        const unlocked = isVideoUnlocked(idx);
                        const completed = isVideoCompleted(vid.id);
                        const active = idx === activeVideoIndex;

                        return (
                          <button
                            key={vid.id}
                            disabled={!unlocked}
                            onClick={() => handlePlaylistItemClick(idx)}
                            className={`lms-lesson-item ${active ? 'active' : ''}`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '80%' }}>
                              {completed ? (
                                <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                              ) : unlocked ? (
                                <PlayCircle size={16} style={{ color: active ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0 }} />
                              ) : (
                                <Lock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                              )}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', overflow: 'hidden' }}>
                                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                                  Lesson {idx + 1}
                                </span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {vid.topicName}
                                </span>
                              </div>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{videoDurations[vid.id] || 'Loading...'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* ==================== STANDARD PAGES LIST GRID ==================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                    {activeMenu === 'available' ? 'Available Course Catalog' : 'My Enrolled Courses'}
                  </h1>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {activeMenu === 'available' 
                      ? 'Browse and choose any course curriculum to preview and lock access credentials.'
                      : 'Resume learning from modules enrolled in your curriculum.'}
                  </p>
                </div>
              </div>

              {/* Course catalogue cards grid */}
              {activeMenu === 'wishlist' || activeMenu === 'progress' || activeMenu === 'certificates' || activeMenu === 'settings' ? (
                /* Mockups for unimplemented tabs */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '3rem', textAlign: 'center' }}>
                  <Compass size={48} style={{ color: 'var(--primary)', marginBottom: '1rem', opacity: 0.8 }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-dark)' }}>Module Coming Soon</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '360px', marginTop: '0.5rem', lineHeight: '1.5' }}>
                    This dashboard module is under development and will be integrated with full progress statistics in a future release.
                  </p>
                </div>
              ) : filteredCourses.length > 0 ? (
                <div className="lms-grid">
                  {filteredCourses.map(course => {
                    const isAssigned = activeAssignedCourses.includes(course.id);
                    const lms = getCourseLmsDetails(course.id);
                    const progress = getCourseProgress(course.id);

                    return (
                      <div key={course.id} className="lms-card">
                        <img src={lms.thumbnail} alt={course.title} className="lms-card-thumb" />
                        <div className="lms-card-content">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={`lms-card-level ${lms.level.toLowerCase()}`}>{lms.level}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600, color: '#b45309' }}>
                              ★ {lms.rating}
                            </div>
                          </div>
                          
                          <h3 className="lms-card-title">{course.title}</h3>
                          <p className="lms-card-desc">{course.description}</p>
                          
                          <div className="lms-card-meta">
                            <span className="lms-card-meta-item">👤 {lms.instructor}</span>
                            <span className="lms-card-meta-item">⏱ {lms.duration}</span>
                          </div>

                          {/* Render Progress Bar on My Courses */}
                          {isAssigned && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 500 }}>
                                <span>Enrolled Progress</span>
                                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{progress.percentage}%</span>
                              </div>
                              <div className="progress-bar-container" style={{ border: 'none', height: '6px' }}>
                                <div className="progress-bar-fill" style={{ width: `${progress.percentage}%`, background: 'var(--primary)' }} />
                              </div>
                            </div>
                          )}

                          <div className="lms-card-price-row">
                            <span className="lms-card-price">{lms.price}</span>
                            <button 
                              className="lms-btn lms-btn-primary"
                              onClick={() => handleViewCourse(course.id)}
                            >
                              {isAssigned ? 'Resume Study' : 'View Syllabus'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '16px', marginTop: '1.5rem' }}>
                  No courses found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Floating Notifications */}
      {toastMessage && (
        <div className="toast">
          <Award size={18} style={{ color: 'var(--primary)' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
