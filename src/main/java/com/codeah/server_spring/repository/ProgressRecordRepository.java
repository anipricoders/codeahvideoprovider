package com.codeah.server_spring.repository;

import com.codeah.server_spring.model.ProgressRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProgressRecordRepository extends JpaRepository<ProgressRecord, Long> {
    List<ProgressRecord> findByStudentId(String studentId);
    Optional<ProgressRecord> findByStudentIdAndVideoId(String studentId, String videoId);
    void deleteByStudentId(String studentId);
    void deleteByVideoId(String videoId);
}
