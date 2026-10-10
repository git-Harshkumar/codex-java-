package com.studymate.repository;

import com.studymate.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Note> findByUserIdAndTitleContainingIgnoreCase(Long userId, String keyword);
}
