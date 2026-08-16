import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'data', 'db.json');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Type Declarations
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

interface AccessCode {
  code: string;
  studentName: string;
  courseId: string;
  createdAt: string;
}

interface ProgressRecord {
  code: string;
  videoId: string;
  secondsWatched: number;
  completed: boolean;
  lastWatchedAt: string;
}

interface Database {
  courses: Course[];
  videos: Video[];
  codes: AccessCode[];
  progress: ProgressRecord[];
}

// Read database
async function readDB(): Promise<Database> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file, using backup/empty structure:', err);
    return { courses: [], videos: [], codes: [], progress: [] };
  }
}

// Write database
async function writeDB(db: Database): Promise<void> {
  try {
    // Ensure parent directories exist
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database:', err);
  }
}

// Generate unique ID
function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ token: 'admin-session-token', success: true });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials' });
  }
});

// GET all courses (Admin only)
app.get('/api/courses', async (req, res) => {
  const db = await readDB();
  res.json(db.courses);
});

// CREATE course
app.post('/api/courses', async (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Course title is required' });
  }
  const db = await readDB();
  const newCourse: Course = {
    id: 'course-' + generateId(),
    title,
    description: description || ''
  };
  db.courses.push(newCourse);
  await writeDB(db);
  res.status(201).json(newCourse);
});

// UPDATE course
app.put('/api/courses/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  const db = await readDB();
  const index = db.courses.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }
  db.courses[index] = { ...db.courses[index], title, description: description || '' };
  await writeDB(db);
  res.json(db.courses[index]);
});

// DELETE course
app.delete('/api/courses/:id', async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  db.courses = db.courses.filter(c => c.id !== id);
  db.videos = db.videos.filter(v => v.courseId !== id);
  // clean up codes & progress assigned to this course
  const codesToRemove = db.codes.filter(c => c.courseId === id).map(c => c.code);
  db.codes = db.codes.filter(c => c.courseId !== id);
  db.progress = db.progress.filter(p => !codesToRemove.includes(p.code));
  await writeDB(db);
  res.json({ message: 'Course deleted successfully' });
});

// GET videos for a course
app.get('/api/courses/:courseId/videos', async (req, res) => {
  const { courseId } = req.params;
  const db = await readDB();
  const courseVideos = db.videos
    .filter(v => v.courseId === courseId)
    .sort((a, b) => a.order - b.order);
  res.json(courseVideos);
});

// ADD video to course
app.post('/api/courses/:courseId/videos', async (req, res) => {
  const { courseId } = req.params;
  const { topicName, title, url, order } = req.body;
  if (!topicName || !url) {
    return res.status(400).json({ error: 'Topic name and video URL are required' });
  }
  const db = await readDB();
  
  // Verify course exists
  if (!db.courses.some(c => c.id === courseId)) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const newVideo: Video = {
    id: 'vid-' + generateId(),
    courseId,
    topicName,
    title: title || topicName,
    url,
    order: order || (db.videos.filter(v => v.courseId === courseId).length + 1)
  };

  db.videos.push(newVideo);
  await writeDB(db);
  res.status(201).json(newVideo);
});

// UPDATE video
app.put('/api/videos/:id', async (req, res) => {
  const { id } = req.params;
  const { topicName, title, url, order } = req.body;
  const db = await readDB();
  const index = db.videos.findIndex(v => v.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Video topic not found' });
  }
  db.videos[index] = {
    ...db.videos[index],
    topicName: topicName || db.videos[index].topicName,
    title: title || db.videos[index].title,
    url: url || db.videos[index].url,
    order: order !== undefined ? order : db.videos[index].order
  };
  await writeDB(db);
  res.json(db.videos[index]);
});

// DELETE video
app.delete('/api/videos/:id', async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  db.videos = db.videos.filter(v => v.id !== id);
  db.progress = db.progress.filter(p => p.videoId !== id);
  await writeDB(db);
  res.json({ message: 'Video topic deleted successfully' });
});

// CODES ENDPOINTS

// GET all generated codes with progress summaries (Admin only)
app.get('/api/codes', async (req, res) => {
  const db = await readDB();
  const result = db.codes.map(codeObj => {
    const course = db.courses.find(c => c.id === codeObj.courseId);
    const courseVideos = db.videos.filter(v => v.courseId === codeObj.courseId);
    const totalVideos = courseVideos.length;
    
    // Find watched progress for this code
    const codeProgress = db.progress.filter(p => p.code === codeObj.code);
    const completedVideosCount = codeProgress.filter(p => p.completed).length;

    // Calculate details
    let overallPercentage = 0;
    if (totalVideos > 0) {
      // Calculate completion based on completed videos and partial playhead percentage
      let totalWatchedWeight = 0;
      courseVideos.forEach(v => {
        const prog = codeProgress.find(p => p.videoId === v.id);
        if (prog) {
          if (prog.completed) {
            totalWatchedWeight += 1.0;
          } else {
            // Assume average video is 300 seconds if duration is unknown, 
            // but just use completion ratio or a custom partial ratio
            // Here we can use 0.5 or a rough estimate if duration isn't set, 
            // but let's just make it simple: completed videos / total videos.
            // If they are watching, count their progress.
            totalWatchedWeight += 0.0; 
          }
        }
      });
      overallPercentage = Math.round((completedVideosCount / totalVideos) * 100);
    }

    return {
      ...codeObj,
      courseTitle: course ? course.title : 'Deleted Course',
      totalVideos,
      completedVideosCount,
      overallPercentage,
      progressList: codeProgress
    };
  });
  res.json(result);
});

// CREATE access code
app.post('/api/codes', async (req, res) => {
  const { studentName, courseId } = req.body;
  if (!studentName || !courseId) {
    return res.status(400).json({ error: 'Student name and Course selection are required' });
  }
  const db = await readDB();

  // Validate course exists
  if (!db.courses.some(c => c.id === courseId)) {
    return res.status(404).json({ error: 'Course not found' });
  }

  // Generate unique randomized uppercase code e.g. AH-XXXX
  let code = '';
  let isUnique = false;
  while (!isUnique) {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `AH-${randomHex}`;
    isUnique = !db.codes.some(c => c.code === code);
  }

  const newCode: AccessCode = {
    code,
    studentName,
    courseId,
    createdAt: new Date().toISOString()
  };

  db.codes.push(newCode);
  await writeDB(db);
  res.status(201).json(newCode);
});

// DELETE access code
app.delete('/api/codes/:code', async (req, res) => {
  const { code } = req.params;
  const db = await readDB();
  db.codes = db.codes.filter(c => c.code !== code);
  db.progress = db.progress.filter(p => p.code !== code);
  await writeDB(db);
  res.json({ message: 'Access code deleted successfully' });
});

// VALIDATE Student access code (Login)
app.post('/api/codes/validate', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Access code is required' });
  }
  
  const db = await readDB();
  const codeRecord = db.codes.find(c => c.code.trim().toUpperCase() === code.trim().toUpperCase());

  if (!codeRecord) {
    return res.status(404).json({ error: 'Invalid access code. Please try again.' });
  }

  const course = db.courses.find(c => c.id === codeRecord.courseId);
  if (!course) {
    return res.status(404).json({ error: 'The course assigned to this code no longer exists.' });
  }

  const courseVideos = db.videos
    .filter(v => v.courseId === course.id)
    .sort((a, b) => a.order - b.order);

  // Return validation details
  res.json({
    valid: true,
    code: codeRecord.code,
    studentName: codeRecord.studentName,
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      videos: courseVideos
    }
  });
});

// GET student progress for a specific code
app.get('/api/progress/:code', async (req, res) => {
  const { code } = req.params;
  const db = await readDB();
  const studentProgress = db.progress.filter(p => p.code === code);
  res.json(studentProgress);
});

// UPDATE progress (with security validation to prevent jumping/spoofing)
app.post('/api/progress/update', async (req, res) => {
  const { code, videoId, secondsWatched, completed } = req.body;
  
  if (!code || !videoId || secondsWatched === undefined) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const db = await readDB();
  
  // Verify code is valid
  const codeRecord = db.codes.find(c => c.code === code);
  if (!codeRecord) {
    return res.status(403).json({ error: 'Invalid access code' });
  }

  // Find existing record
  const progressIndex = db.progress.findIndex(p => p.code === code && p.videoId === videoId);
  const now = new Date().toISOString();

  if (progressIndex === -1) {
    // New progress record. Max allowed initial seconds watched is 5s
    // (since student has to play from start, they can't jump straight to 10s+)
    if (secondsWatched > 8) {
      return res.status(400).json({ error: 'Security alert: Forward-seeking bypass detected.' });
    }

    const newRecord: ProgressRecord = {
      code,
      videoId,
      secondsWatched,
      completed: !!completed,
      lastWatchedAt: now
    };
    db.progress.push(newRecord);
  } else {
    const existing = db.progress[progressIndex];
    
    // SECURITY VALIDATION:
    // If the student claims to have watched more seconds, the increase must not
    // exceed a realistic playback window since the last update (e.g. max 8 seconds jump
    // to account for network lag and throttling updates).
    // Seeking backward is always permitted.
    const timeDelta = secondsWatched - existing.secondsWatched;
    if (timeDelta > 8) {
      console.warn(`[SECURITY] Jump detected for code ${code} on video ${videoId}: ${existing.secondsWatched}s -> ${secondsWatched}s`);
      return res.status(400).json({ 
        error: 'Security alert: Forward-seeking is disabled. Resetting player position.',
        resetTo: existing.secondsWatched
      });
    }

    db.progress[progressIndex] = {
      ...existing,
      secondsWatched: Math.max(existing.secondsWatched, secondsWatched), // never decrease max watch position on server
      completed: existing.completed || !!completed,
      lastWatchedAt: now
    };
  }

  await writeDB(db);
  res.json({ success: true });
});

// Serve frontend in production (static build assets)
// Serve index.html for React Router in static mode
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

app.get('*', async (req, res, next) => {
  // If the path starts with /api, pass it to api router (not matched above means 404)
  if (req.path.startsWith('/api')) {
    return next();
  }
  try {
    const indexHtml = await fs.readFile(path.join(clientDistPath, 'index.html'), 'utf-8');
    res.send(indexHtml);
  } catch (e) {
    // Statically serve or just print that UI is not compiled yet
    res.status(200).send(`
      <div style="font-family:sans-serif; text-align:center; padding: 50px;">
        <h2>CodeAH Video Previewer Server Running</h2>
        <p>Vite development client should be run separately in dev mode.</p>
        <p>Run: <code>npm run dev</code> from root.</p>
      </div>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
});
