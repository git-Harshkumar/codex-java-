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

    private Long parseUserId(String userId) {
        if (userId == null || userId.isBlank()) return 1L;
        try {
            return Long.parseLong(userId);
        } catch (NumberFormatException e) {
            return Math.abs((long) userId.hashCode());
        }
    }

    @GetMapping
    public List<Progress> getProgress(@RequestParam(defaultValue = "1") String userId) {
        return progressRepository.findByUserIdOrderByMasteryPctDesc(parseUserId(userId));
    }

    @PostMapping("/record")
    public Progress recordProgress(@RequestBody Map<String, Object> body) {
        Long userId = parseUserId(body.getOrDefault("userId", "1").toString());
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
    public Map<String, Object> getStats(@RequestParam(defaultValue = "1") String userId) {
        List<Progress> all = progressRepository.findByUserIdOrderByMasteryPctDesc(parseUserId(userId));
        int totalTopics = all.size();
        int totalQuestions = all.stream().mapToInt(Progress::getQuestionsAttempted).sum();
        double avgScore = all.stream().mapToInt(Progress::getMasteryPct).average().orElse(0);
        
        int streak = 0;
        if (!all.isEmpty()) {
            List<java.time.LocalDate> studyDates = all.stream()
                .map(Progress::getLastStudied)
                .filter(java.util.Objects::nonNull)
                .map(java.time.LocalDateTime::toLocalDate)
                .distinct()
                .sorted(java.util.Comparator.reverseOrder())
                .collect(java.util.stream.Collectors.toList());
                
            if (!studyDates.isEmpty()) {
                java.time.LocalDate today = java.time.LocalDate.now();
                java.time.LocalDate lastStudy = studyDates.get(0);
                
                // If they studied today or yesterday, they have an active streak
                if (lastStudy.equals(today) || lastStudy.equals(today.minusDays(1))) {
                    streak = 1;
                    java.time.LocalDate expectedPrev = lastStudy.minusDays(1);
                    for (int i = 1; i < studyDates.size(); i++) {
                        if (studyDates.get(i).equals(expectedPrev)) {
                            streak++;
                            expectedPrev = expectedPrev.minusDays(1);
                        } else {
                            break; // Gap found, streak ends
                        }
                    }
                }
            }
        }

        return Map.of(
            "totalTopics", totalTopics,
            "totalQuestions", totalQuestions,
            "avgScore", Math.round(avgScore),
            "streak", streak
        );
    }
}
