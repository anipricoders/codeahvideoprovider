package com.codeah.server_spring.dto;

public class ProgressUpdateRequest {
    private String studentId;
    private String videoId;
    private int secondsWatched;
    private boolean completed;

    public ProgressUpdateRequest() {}

    public ProgressUpdateRequest(String studentId, String videoId, int secondsWatched, boolean completed) {
        this.studentId = studentId;
        this.videoId = videoId;
        this.secondsWatched = secondsWatched;
        this.completed = completed;
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
}
