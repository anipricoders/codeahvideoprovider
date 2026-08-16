package com.codeah.server_spring.dto;

import java.util.List;

public class StudentLoginResponse {
    private boolean valid;
    private String token;
    private StudentInfo student;

    public StudentLoginResponse() {}

    public StudentLoginResponse(boolean valid, String token, StudentInfo student) {
        this.valid = valid;
        this.token = token;
        this.student = student;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public StudentInfo getStudent() {
        return student;
    }

    public void setStudent(StudentInfo student) {
        this.student = student;
    }

    public static class StudentInfo {
        private String id;
        private String name;
        private String username;
        private List<String> assignedCourses;

        public StudentInfo() {}

        public StudentInfo(String id, String name, String username, List<String> assignedCourses) {
            this.id = id;
            this.name = name;
            this.username = username;
            this.assignedCourses = assignedCourses;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public List<String> getAssignedCourses() {
            return assignedCourses;
        }

        public void setAssignedCourses(List<String> assignedCourses) {
            this.assignedCourses = assignedCourses;
        }
    }
}
