package com.codeah.server_spring.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "students")
public class Student {
    @Id
    private String id;
    
    @Column(unique = true, nullable = false)
    private String username;
    
    private String name;
    private String password;
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "student_assigned_courses", joinColumns = @JoinColumn(name = "student_id"))
    @Column(name = "course_id")
    private List<String> assignedCourses = new ArrayList<>();
    
    private LocalDateTime createdAt;

    public Student() {}

    public Student(String id, String username, String name, String password, List<String> assignedCourses) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.password = password;
        this.assignedCourses = assignedCourses;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public List<String> getAssignedCourses() {
        return assignedCourses;
    }

    public void setAssignedCourses(List<String> assignedCourses) {
        this.assignedCourses = assignedCourses;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
