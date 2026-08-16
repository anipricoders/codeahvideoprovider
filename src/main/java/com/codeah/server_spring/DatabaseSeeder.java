package com.codeah.server_spring;

import com.codeah.server_spring.model.Course;
import com.codeah.server_spring.model.Student;
import com.codeah.server_spring.model.Video;
import com.codeah.server_spring.repository.CourseRepository;
import com.codeah.server_spring.repository.StudentRepository;
import com.codeah.server_spring.repository.VideoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Override
    public void run(String... args) throws Exception {
        if (courseRepository.count() == 0) {
            System.out.println("Seeding database...");

            // Create Courses
            Course courseReact = new Course("course-react", "React JS Foundations", 
                "Learn the absolute basics of React, including components, props, state, and standard custom video controls.");
            Course courseTs = new Course("course-ts", "TypeScript Advanced Guide", 
                "Deep dive into TypeScript types, interfaces, generics, and compiler options for solid web apps.");
            
            courseRepository.saveAll(Arrays.asList(courseReact, courseTs));

            // Create Videos for React Course
            Video r1 = new Video("react-v1", "course-react", "Introduction to React", 
                "Welcome to React & Project Setup", "https://www.w3schools.com/html/movie.webm", 1);
            Video r2 = new Video("react-v2", "course-react", "Understanding Components", 
                "Functional Components and JSX", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", 2);
            Video r3 = new Video("react-v3", "course-react", "State and Hooks", 
                "Managing State with useState Hook", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", 3);

            // Create Videos for TS Course
            Video t1 = new Video("ts-v1", "course-ts", "TypeScript Setup", 
                "Installing TypeScript and configuring tsconfig", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", 1);
            Video t2 = new Video("ts-v2", "course-ts", "Advanced Typing", 
                "Generics, Union Types and Utility Types", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4", 2);

            videoRepository.saveAll(Arrays.asList(r1, r2, r3, t1, t2));

            // Create Default Student Accounts
            // React student
            Student s1 = new Student();
            s1.setId("student-react");
            s1.setUsername("demostudentreact");
            s1.setName("Demo Student React");
            s1.setPassword("123");
            s1.setAssignedCourses(Collections.singletonList("course-react"));
            
            // TypeScript student
            Student s2 = new Student();
            s2.setId("student-ts");
            s2.setUsername("demostudentts");
            s2.setName("Demo Student TS");
            s2.setPassword("123");
            s2.setAssignedCourses(Collections.singletonList("course-ts"));

            // Student with BOTH courses
            Student s3 = new Student();
            s3.setId("student-both");
            s3.setUsername("demostudentboth");
            s3.setName("Demo Student Both");
            s3.setPassword("123");
            s3.setAssignedCourses(Arrays.asList("course-react", "course-ts"));

            studentRepository.saveAll(Arrays.asList(s1, s2, s3));

            System.out.println("Database seeded successfully!");
        }
    }
}
