package com.studymate.controller;

import com.studymate.model.Progress;
import com.studymate.repository.ProgressRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
@CrossOrigin(origins = "http://localhost:5173")
public class ProgressController {

    private final ProgressRepository progressRepository;

    public ProgressController(ProgressRepository progressRepository) {
        this.progressRepository = progressRepository;
    }

    @GetMapping
    public List<Progress> getProgress(@RequestParam(defaultValue = "1") Long userId) {
        return progressRepository.findByUserIdOrderByMasteryPctDesc(userId);
    }

    @PostMapping("/record")
    public Progress recordProgress(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.getOrDefault("userId", "1").toString());
        String topicName = body.getOrDefault("topicName", "General").toString();
        int correct = Integer.parseInt(body.getOrDefault("correctAnswers", "0").toString());
        int total = Integer.parseInt(body.getOrDefault("totalQuestions", "1").toString());

        Progress p = progressRepository.findByUserIdAndTopicName(userId, topicName)
                .orElse(new Progress());

        p.setUserId(userId);
        p.setTopicName(topicName);
        p.setQuestionsAttempted(p.getQuestionsAttempted() + total);
        p.setCorrectAnswers(p.getCorrectAnswers() + correct);
        // Recalculate mastery
        int mastery = (int) Math.round((double) p.getCorrectAnswers() / Math.max(p.getQuestionsAttempted(), 1) * 100);
        p.setMasteryPct(mastery);

        return progressRepository.save(p);
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats(@RequestParam(defaultValue = "1") Long userId) {
        List<Progress> all = progressRepository.findByUserIdOrderByMasteryPctDesc(userId);
        int totalTopics = all.size();
        int totalQuestions = all.stream().mapToInt(Progress::getQuestionsAttempted).sum();
        double avgScore = all.stream().mapToInt(Progress::getMasteryPct).average().orElse(0);
        return Map.of(
            "totalTopics", totalTopics,
            "totalQuestions", totalQuestions,
            "avgScore", Math.round(avgScore),
            "streak", 7 // hardcoded for mock — real implementation would track daily activity
        );
    }
}
