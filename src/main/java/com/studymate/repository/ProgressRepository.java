package com.studymate.repository;

import com.studymate.model.Progress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProgressRepository extends JpaRepository<Progress, Long> {
    List<Progress> findByUserIdOrderByMasteryPctDesc(Long userId);
    Optional<Progress> findByUserIdAndTopicName(Long userId, String topicName);
}
