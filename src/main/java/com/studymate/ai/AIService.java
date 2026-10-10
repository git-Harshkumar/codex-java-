package com.studymate.ai;

import com.studymate.model.Diagram;
import com.studymate.model.Quiz;

public interface AIService {
    String ask(String question);
    String rawPrompt(String prompt);
    String explainTopic(String topic, String level);
    String explainCode(String code, String language);
    Quiz generateQuiz(String topic, String difficulty, int count);
    Diagram generateDiagram(String topic);
    void setApiKey(String key);
}
