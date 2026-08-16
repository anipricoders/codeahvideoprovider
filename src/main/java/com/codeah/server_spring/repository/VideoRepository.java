package com.codeah.server_spring.repository;

import com.codeah.server_spring.model.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VideoRepository extends JpaRepository<Video, String> {
    List<Video> findByCourseIdOrderByOrderAsc(String courseId);
    void deleteByCourseId(String courseId);
}
