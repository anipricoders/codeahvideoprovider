package com.codeah.server_spring.controller;

import com.codeah.server_spring.dto.AdminLoginResponse;
import com.codeah.server_spring.dto.LoginRequest;
import com.codeah.server_spring.model.Course;
import com.codeah.server_spring.model.ProgressRecord;
import com.codeah.server_spring.model.Student;
import com.codeah.server_spring.model.Video;
import com.codeah.server_spring.repository.CourseRepository;
import com.codeah.server_spring.repository.ProgressRecordRepository;
import com.codeah.server_spring.repository.StudentRepository;
import com.codeah.server_spring.repository.VideoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.io.IOException;

@RestController
@RequestMapping("/api/admin")
@Transactional
public class AdminController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private ProgressRecordRepository progressRecordRepository;

    // Admin Login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        if (("admin".equals(loginRequest.getUsername()) && "admin123".equals(loginRequest.getPassword())) ||
            ("mahaniyaTechnology".equals(loginRequest.getUsername()) && "pass123".equals(loginRequest.getPassword()))) {
            return ResponseEntity.ok(new AdminLoginResponse(true, "admin-session-token"));
        }
        Map<String, String> error = new HashMap<>();
        error.put("error", "Invalid admin credentials");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    // COURSE CRUD
    @PostMapping("/courses")
    public ResponseEntity<Course> createCourse(@RequestBody Course course) {
        if (course.getId() == null || course.getId().trim().isEmpty()) {
            course.setId("course-" + UUID.randomUUID().toString().substring(0, 8));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(courseRepository.save(course));
    }

    @PutMapping("/courses/{id}")
    public ResponseEntity<Course> updateCourse(@PathVariable String id, @RequestBody Course courseDetails) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        if (courseOpt.isPresent()) {
            Course course = courseOpt.get();
            course.setTitle(courseDetails.getTitle());
            course.setDescription(courseDetails.getDescription());
            return ResponseEntity.ok(courseRepository.save(course));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/courses/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable String id) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        if (courseOpt.isPresent()) {
            // Delete associated videos
            List<Video> videos = videoRepository.findByCourseIdOrderByOrderAsc(id);
            for (Video v : videos) {
                progressRecordRepository.deleteByVideoId(v.getId());
            }
            videoRepository.deleteByCourseId(id);
            
            // Delete the course
            courseRepository.deleteById(id);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Course and related videos deleted successfully");
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.notFound().build();
    }

    // VIDEO CRUD
    @PostMapping("/courses/{courseId}/videos")
    public ResponseEntity<?> addVideo(@PathVariable String courseId, @RequestBody Video video) {
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Course not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        if (video.getId() == null || video.getId().trim().isEmpty()) {
            video.setId("vid-" + UUID.randomUUID().toString().substring(0, 8));
        }
        video.setCourseId(courseId);
        
        if (video.getOrder() <= 0) {
            int currentCount = videoRepository.findByCourseIdOrderByOrderAsc(courseId).size();
            video.setOrder(currentCount + 1);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(videoRepository.save(video));
    }

    @PutMapping("/videos/{id}")
    public ResponseEntity<Video> updateVideo(@PathVariable String id, @RequestBody Video videoDetails) {
        Optional<Video> videoOpt = videoRepository.findById(id);
        if (videoOpt.isPresent()) {
            Video video = videoOpt.get();
            if (videoDetails.getTopicName() != null) video.setTopicName(videoDetails.getTopicName());
            if (videoDetails.getTitle() != null) video.setTitle(videoDetails.getTitle());
            if (videoDetails.getUrl() != null) video.setUrl(videoDetails.getUrl());
            if (videoDetails.getOrder() > 0) video.setOrder(videoDetails.getOrder());
            return ResponseEntity.ok(videoRepository.save(video));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/videos/{id}")
    public ResponseEntity<?> deleteVideo(@PathVariable String id) {
        Optional<Video> videoOpt = videoRepository.findById(id);
        if (videoOpt.isPresent()) {
            progressRecordRepository.deleteByVideoId(id);
            videoRepository.deleteById(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Video topic deleted successfully");
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.notFound().build();
    }

    // STUDENT CRUD
    @GetMapping("/students")
    public ResponseEntity<List<Student>> getStudents() {
        return ResponseEntity.ok(studentRepository.findAll());
    }

    @PostMapping("/students")
    public ResponseEntity<?> createStudent(@RequestBody Student student) {
        if (student.getUsername() == null || student.getUsername().trim().isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Username is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        if (student.getPassword() == null || student.getPassword().trim().isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Password is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        if (studentRepository.findByUsername(student.getUsername()).isPresent()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Username already exists");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        if (student.getId() == null || student.getId().trim().isEmpty()) {
            student.setId("student-" + UUID.randomUUID().toString().substring(0, 8));
        }
        
        student.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.CREATED).body(studentRepository.save(student));
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<?> updateStudent(@PathVariable String id, @RequestBody Student studentDetails) {
        Optional<Student> studentOpt = studentRepository.findById(id);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            
            // Check username uniqueness if updated
            if (!student.getUsername().equals(studentDetails.getUsername())) {
                if (studentRepository.findByUsername(studentDetails.getUsername()).isPresent()) {
                    Map<String, String> error = new HashMap<>();
                    error.put("error", "Username already exists");
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
                }
            }

            student.setName(studentDetails.getName());
            student.setUsername(studentDetails.getUsername());
            if (studentDetails.getPassword() != null && !studentDetails.getPassword().trim().isEmpty()) {
                student.setPassword(studentDetails.getPassword());
            }
            student.setAssignedCourses(studentDetails.getAssignedCourses());

            return ResponseEntity.ok(studentRepository.save(student));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/students/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable String id) {
        Optional<Student> studentOpt = studentRepository.findById(id);
        if (studentOpt.isPresent()) {
            progressRecordRepository.deleteByStudentId(id);
            studentRepository.deleteById(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Student and progress logs deleted successfully");
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.notFound().build();
    }

    // ANALYTICS
    @GetMapping("/analytics")
    public ResponseEntity<List<Map<String, Object>>> getAnalytics() {
        List<Student> students = studentRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Student s : students) {
            List<ProgressRecord> studentProgress = progressRecordRepository.findByStudentId(s.getId());
            
            for (String courseId : s.getAssignedCourses()) {
                Optional<Course> courseOpt = courseRepository.findById(courseId);
                if (courseOpt.isEmpty()) continue;
                Course course = courseOpt.get();

                List<Video> courseVideos = videoRepository.findByCourseIdOrderByOrderAsc(courseId);
                int totalVideos = courseVideos.size();
                
                // Get progress for this course's videos
                List<Map<String, Object>> progressList = new ArrayList<>();
                int completedVideosCount = 0;

                for (Video v : courseVideos) {
                    Optional<ProgressRecord> progOpt = studentProgress.stream()
                            .filter(p -> p.getVideoId().equals(v.getId()))
                            .findFirst();

                    Map<String, Object> progMap = new HashMap<>();
                    progMap.put("videoId", v.getId());
                    progMap.put("videoTitle", v.getTitle());
                    progMap.put("topicName", v.getTopicName());
                    
                    if (progOpt.isPresent()) {
                        ProgressRecord prog = progOpt.get();
                        progMap.put("secondsWatched", prog.getSecondsWatched());
                        progMap.put("completed", prog.isCompleted());
                        progMap.put("lastWatchedAt", prog.getLastWatchedAt().toString());
                        if (prog.isCompleted()) {
                            completedVideosCount++;
                        }
                    } else {
                        progMap.put("secondsWatched", 0);
                        progMap.put("completed", false);
                        progMap.put("lastWatchedAt", null);
                    }
                    progressList.add(progMap);
                }

                int overallPercentage = totalVideos > 0 ? (int) Math.round(((double) completedVideosCount / totalVideos) * 100) : 0;

                Map<String, Object> record = new HashMap<>();
                record.put("studentId", s.getId());
                record.put("studentName", s.getName());
                record.put("username", s.getUsername());
                record.put("courseId", course.getId());
                record.put("courseTitle", course.getTitle());
                record.put("totalVideos", totalVideos);
                record.put("completedVideosCount", completedVideosCount);
                record.put("overallPercentage", overallPercentage);
                record.put("progressList", progressList);
                // Backwards compatibility keys
                record.put("code", s.getId()); // mapping studentId as 'code' so analytics frontend is compatible!
                
                result.add(record);
            }
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/videos/upload")
    public ResponseEntity<?> uploadVideo(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Please select a file to upload"));
        }

        try {
            // Get original filename and sanitize it
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                originalFilename = "video_" + System.currentTimeMillis() + ".mp4";
            }
            // Sanitize filename to avoid url special character issues
            String cleanFilename = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");

            // Directories
            String userDir = System.getProperty("user.dir");
            Path srcStaticDir = Paths.get(userDir, "src", "main", "resources", "static", "uploads");
            Path targetStaticDir = Paths.get(userDir, "target", "classes", "static", "uploads");

            // Create directories and save file
            try {
                if (!Files.exists(srcStaticDir)) {
                    Files.createDirectories(srcStaticDir);
                }
                Path srcFilePath = srcStaticDir.resolve(cleanFilename);
                Files.copy(file.getInputStream(), srcFilePath, StandardCopyOption.REPLACE_EXISTING);
            } catch (Exception e) {
                System.err.println("Warning: Could not save to src/main/resources/static: " + e.getMessage());
            }

            try {
                if (!Files.exists(targetStaticDir)) {
                    Files.createDirectories(targetStaticDir);
                }
                Path targetFilePath = targetStaticDir.resolve(cleanFilename);
                Files.copy(file.getInputStream(), targetFilePath, StandardCopyOption.REPLACE_EXISTING);
            } catch (Exception e) {
                System.err.println("Warning: Could not save to target/classes/static: " + e.getMessage());
            }

            // Return target path URL
            Map<String, String> response = new HashMap<>();
            response.put("url", "http://localhost:5000/uploads/" + cleanFilename);
            response.put("filename", cleanFilename);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Failed to save file: " + e.getMessage()));
        }
    }
}
