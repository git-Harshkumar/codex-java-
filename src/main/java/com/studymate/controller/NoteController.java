package com.studymate.controller;

import com.studymate.model.Note;
import com.studymate.repository.NoteRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "http://localhost:5173")
public class NoteController {

    private final NoteRepository noteRepository;

    public NoteController(NoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    @GetMapping
    public List<Note> getAllNotes(@RequestParam(defaultValue = "1") Long userId) {
        return noteRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @GetMapping("/search")
    public List<Note> searchNotes(@RequestParam(defaultValue = "1") Long userId,
                                  @RequestParam String keyword) {
        return noteRepository.findByUserIdAndTitleContainingIgnoreCase(userId, keyword);
    }

    @PostMapping
    public Note createNote(@RequestBody Note note) {
        if (note.getUserId() == null) note.setUserId(1L);
        return noteRepository.save(note);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Note> updateNote(@PathVariable Long id, @RequestBody Note updated) {
        return noteRepository.findById(id).map(note -> {
            note.setTitle(updated.getTitle());
            note.setContent(updated.getContent());
            note.setTopic(updated.getTopic());
            note.setTags(updated.getTags());
            return ResponseEntity.ok(noteRepository.save(note));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long id) {
        if (!noteRepository.existsById(id)) return ResponseEntity.notFound().build();
        noteRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
