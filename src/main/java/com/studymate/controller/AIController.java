package com.studymate.controller;

import com.studymate.ai.AIService;
import com.studymate.model.Diagram;
import com.studymate.model.Quiz;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:5173")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/ask")
    public String askQuestion(@RequestBody java.util.Map<String, String> body) {
        String question = body.getOrDefault("question", body.toString());
        return aiService.ask(question);
    }

    @PostMapping("/raw")
    public String rawPrompt(@RequestBody java.util.Map<String, String> body) {
        // Calls Gemini directly with no extra system prompt wrapping
        String prompt = body.getOrDefault("prompt", "");
        return aiService.rawPrompt(prompt);
    }

    @GetMapping("/explain")
    public String explainTopic(@RequestParam String topic, @RequestParam String level) {
        return aiService.explainTopic(topic, level);
    }

    @PostMapping("/explain-code")
    public String explainCode(@RequestBody String code, @RequestParam String language) {
        return aiService.explainCode(code, language);
    }

    @GetMapping("/quiz")
    public Quiz generateQuiz(@RequestParam String topic, @RequestParam String difficulty) {
        return aiService.generateQuiz(topic, difficulty);
    }

    @GetMapping("/diagram")
    public Diagram generateDiagram(@RequestParam String topic) {
        return aiService.generateDiagram(topic);
    }

    @GetMapping("/test-models")
    public ResponseEntity<?> testModels(@Value("${gemini.api.key:}") String apiKey) {
        if (apiKey == null || apiKey.isBlank()) {
            return ResponseEntity.badRequest().body("API Key is missing in application.properties");
        }
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            String url = "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey;
            return ResponseEntity.ok(restTemplate.getForObject(url, java.util.Map.class));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}
