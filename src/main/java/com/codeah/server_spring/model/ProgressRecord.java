package com.codeah.server_spring.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "progress_records")
public class ProgressRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "student_id")
    private String studentId;
    
    @Column(name = "video_id")
    private String videoId;
    
    private int secondsWatched;
    private boolean completed;
    private LocalDateTime lastWatchedAt;

    public ProgressRecord() {}

    public ProgressRecord(String studentId, String videoId, int secondsWatched, boolean completed) {
        this.studentId = studentId;
        this.videoId = videoId;
        this.secondsWatched = secondsWatched;
        this.completed = completed;
        this.lastWatchedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getVideoId() {
        return videoId;
    }

    public void setVideoId(String videoId) {
        this.videoId = videoId;
    }

    public int getSecondsWatched() {
        return secondsWatched;
    }

    public void setSecondsWatched(int secondsWatched) {
        this.secondsWatched = secondsWatched;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public LocalDateTime getLastWatchedAt() {
        return lastWatchedAt;
    }

    public void setLastWatchedAt(LocalDateTime lastWatchedAt) {
        this.lastWatchedAt = lastWatchedAt;
    }
}
