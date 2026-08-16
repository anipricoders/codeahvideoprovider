package com.codeah.server_spring.controller;

import com.codeah.server_spring.dto.LoginRequest;
import com.codeah.server_spring.dto.ProgressUpdateRequest;
import com.codeah.server_spring.dto.StudentLoginResponse;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api")
@Transactional
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private ProgressRecordRepository progressRecordRepository;

    // Student Login
    @PostMapping("/students/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Optional<Student> studentOpt = studentRepository.findByUsername(loginRequest.getUsername());
        
        if (studentOpt.isPresent() && studentOpt.get().getPassword().equals(loginRequest.getPassword())) {
            Student student = studentOpt.get();
            StudentLoginResponse.StudentInfo info = new StudentLoginResponse.StudentInfo(
                    student.getId(), student.getName(), student.getUsername(), student.getAssignedCourses()
            );
            String token = "student-session-" + student.getId();
            return ResponseEntity.ok(new StudentLoginResponse(true, token, info));
        }
        
        Map<String, String> error = new HashMap<>();
        error.put("error", "Invalid student credentials. Please try again.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    // Get all courses (Accessible by logged-in users, filtered for students to assigned courses only)
    @GetMapping("/courses")
    public ResponseEntity<List<Course>> getCourses() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Student) {
            Student student = (Student) principal;
            Optional<Student> dbStudentOpt = studentRepository.findById(student.getId());
            if (dbStudentOpt.isPresent()) {
                List<String> assigned = dbStudentOpt.get().getAssignedCourses();
                if (assigned == null || assigned.isEmpty()) {
                    return ResponseEntity.ok(Collections.emptyList());
                }
                return ResponseEntity.ok(courseRepository.findAllById(assigned));
            }
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(courseRepository.findAll());
    }

    // Get student profile details
    @GetMapping("/students/profile")
    public ResponseEntity<?> getProfile() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Student) {
            Student student = (Student) principal;
            Optional<Student> dbStudentOpt = studentRepository.findById(student.getId());
            if (dbStudentOpt.isPresent()) {
                Student s = dbStudentOpt.get();
                StudentLoginResponse.StudentInfo info = new StudentLoginResponse.StudentInfo(
                        s.getId(), s.getName(), s.getUsername(), s.getAssignedCourses()
                );
                return ResponseEntity.ok(info);
            }
        }
        Map<String, String> error = new HashMap<>();
        error.put("error", "Unauthorized or profile not found.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }


    // Get videos for a course (Restricted to assigned courses for students)
    @GetMapping("/courses/{courseId}/videos")
    public ResponseEntity<?> getVideos(@PathVariable String courseId) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Student) {
            Student student = (Student) principal;
            Optional<Student> dbStudentOpt = studentRepository.findById(student.getId());
            if (dbStudentOpt.isPresent()) {
                List<String> assigned = dbStudentOpt.get().getAssignedCourses();
                if (assigned == null || !assigned.contains(courseId)) {
                    Map<String, String> error = new HashMap<>();
                    error.put("error", "Access denied. You are not enrolled in this course.");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
                }
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Student context not found.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }
        }
        return ResponseEntity.ok(videoRepository.findByCourseIdOrderByOrderAsc(courseId));
    }

    // Get student progress
    @GetMapping("/progress/{studentId}")
    public ResponseEntity<List<ProgressRecord>> getProgress(@PathVariable String studentId) {
        return ResponseEntity.ok(progressRecordRepository.findByStudentId(studentId));
    }

    // Update progress with playback skip security check
    @PostMapping("/progress/update")
    public ResponseEntity<?> updateProgress(@RequestBody ProgressUpdateRequest request) {
        if (request.getStudentId() == null || request.getVideoId() == null) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Missing required parameters");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        // Verify student exists
        Optional<Student> studentOpt = studentRepository.findById(request.getStudentId());
        if (studentOpt.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Student not found");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        Optional<ProgressRecord> existingOpt = progressRecordRepository.findByStudentIdAndVideoId(
                request.getStudentId(), request.getVideoId()
        );

        if (existingOpt.isEmpty()) {
            // New progress record
            // Limit first watched seconds to prevent jumping immediately to high numbers
            if (request.getSecondsWatched() > 8) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Security alert: Forward-seeking bypass detected.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            ProgressRecord newRecord = new ProgressRecord(
                    request.getStudentId(),
                    request.getVideoId(),
                    request.getSecondsWatched(),
                    request.isCompleted()
            );
            progressRecordRepository.save(newRecord);
        } else {
            ProgressRecord existing = existingOpt.get();

            // SECURITY VALIDATION: Playback increase must not exceed 8 seconds compared to last saved time.
            // Backward scrubbing is allowed.
            int timeDelta = request.getSecondsWatched() - existing.getSecondsWatched();
            if (timeDelta > 8) {
                System.out.println("[SECURITY] Jump detected for student " + request.getStudentId() + " on video " + request.getVideoId() + ": " + existing.getSecondsWatched() + "s -> " + request.getSecondsWatched() + "s");
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Security alert: Forward-seeking is disabled. Resetting player position.");
                error.put("resetTo", existing.getSecondsWatched());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            existing.setSecondsWatched(Math.max(existing.getSecondsWatched(), request.getSecondsWatched()));
            existing.setCompleted(existing.isCompleted() || request.isCompleted());
            existing.setLastWatchedAt(LocalDateTime.now());
            progressRecordRepository.save(existing);
        }

        Map<String, Boolean> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
