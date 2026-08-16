package com.codeah.server_spring.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "videos")
public class Video {
    @Id
    private String id;
    
    @Column(name = "course_id")
    private String courseId;
    
    private String topicName;
    private String title;
    
    @Column(length = 1024)
    private String url;
    
    @Column(name = "video_order")
    private int order;

    public Video() {}

    public Video(String id, String courseId, String topicName, String title, String url, int order) {
        this.id = id;
        this.courseId = courseId;
        this.topicName = topicName;
        this.title = title;
        this.url = url;
        this.order = order;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }

    public String getTopicName() {
        return topicName;
    }

    public void setTopicName(String topicName) {
        this.topicName = topicName;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public int getOrder() {
        return order;
    }

    public void setOrder(int order) {
        this.order = order;
    }
}
