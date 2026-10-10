package com.studymate.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "progress")
public class Progress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "topic_name")
    private String topicName;

    @Column(name = "mastery_pct")
    private int masteryPct;

    @Column(name = "questions_attempted")
    private int questionsAttempted;

    @Column(name = "correct_answers")
    private int correctAnswers;

    @Column(name = "last_studied")
    private LocalDateTime lastStudied;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastStudied = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getTopicName() { return topicName; }
    public void setTopicName(String topicName) { this.topicName = topicName; }
    public int getMasteryPct() { return masteryPct; }
    public void setMasteryPct(int masteryPct) { this.masteryPct = masteryPct; }
    public int getQuestionsAttempted() { return questionsAttempted; }
    public void setQuestionsAttempted(int questionsAttempted) { this.questionsAttempted = questionsAttempted; }
    public int getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(int correctAnswers) { this.correctAnswers = correctAnswers; }
    public LocalDateTime getLastStudied() { return lastStudied; }
    public void setLastStudied(LocalDateTime lastStudied) { this.lastStudied = lastStudied; }
}
