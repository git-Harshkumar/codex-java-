package com.studymate.controller;

import com.studymate.ai.AIService;
import com.studymate.model.Diagram;
import com.studymate.model.Quiz;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(originPatterns = "*")
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
    public Quiz generateQuiz(@RequestParam String topic, @RequestParam String difficulty, @RequestParam(defaultValue = "5") int count) {
        return aiService.generateQuiz(topic, difficulty, count);
    }

    @GetMapping("/diagram")
    public Diagram generateDiagram(@RequestParam String topic) {
        return aiService.generateDiagram(topic);
    }

    @PostMapping("/key")
    public ResponseEntity<String> updateApiKey(@RequestBody java.util.Map<String, String> body) {
        String key = body.get("key");
        if (key == null || key.isBlank()) return ResponseEntity.badRequest().body("Key is empty");
        
        // Update in-memory
        aiService.setApiKey(key);
        
        // Try to update .env file
        try {
            java.nio.file.Path envPath = java.nio.file.Paths.get(".env");
            if (java.nio.file.Files.exists(envPath)) {
                String content = java.nio.file.Files.readString(envPath);
                if (content.contains("GEMINI_API_KEY=")) {
                    content = content.replaceAll("GEMINI_API_KEY=.*", "GEMINI_API_KEY=" + key);
                } else {
                    content += "\nGEMINI_API_KEY=" + key + "\n";
                }
                java.nio.file.Files.writeString(envPath, content);
            } else {
                java.nio.file.Files.writeString(envPath, "GEMINI_API_KEY=" + key + "\n");
            }
        } catch (Exception e) {
            System.err.println("Failed to write .env file: " + e.getMessage());
        }
        
        return ResponseEntity.ok("API Key updated");
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
