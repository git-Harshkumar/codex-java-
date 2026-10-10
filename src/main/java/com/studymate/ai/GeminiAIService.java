package com.studymate.ai;

import com.studymate.model.Diagram;
import com.studymate.model.Quiz;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * GeminiAIService connects to the Google Gemini API.
 * When the API call fails (wrong key, model not found, network, etc.),
 * it delegates to MockAIService for rich, topic-aware fallback responses.
 */
@Service
@Primary
public class GeminiAIService implements AIService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    private static final List<String> MODEL_CANDIDATES = List.of(
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-3.8-flash",
        "gemini-2.5-pro"
    );

    private final RestTemplate restTemplate = new RestTemplate();

    // Rich fallback — topic-aware responses when Gemini is unavailable
    private final MockAIService mock = new MockAIService();

    // ---------------------------------------------------------------
    // Core Gemini caller — tries candidate models, returns null on failure so callers use mock
    // ---------------------------------------------------------------
    private String callGemini(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            return null; // no key — caller will use mock
        }

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> body = Map.of("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        for (String model : MODEL_CANDIDATES) {
            try {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;
                ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

                if (response.getBody() != null) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
                    if (candidates != null && !candidates.isEmpty()) {
                        Map<String, Object> first = candidates.get(0);
                        Map<String, Object> c = (Map<String, Object>) first.get("content");
                        if (c != null) {
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> parts = (List<Map<String, Object>>) c.get("parts");
                            if (parts != null && !parts.isEmpty()) {
                                return parts.get(0).get("text").toString();
                            }
                        }
                    }
                }
            } catch (Exception e) {
                // Log and try next candidate model
                System.err.println("[GeminiAIService] Model " + model + " failed: " + e.getMessage() + ". Trying next candidate...");
            }
        }

        // All models failed or rate limited/503 -> return null for rich mock fallback
        return null;
    }

    @Override
    public String ask(String question) {
        String prompt = "You are StudyMate AI, a highly knowledgeable educational assistant for students. " +
            "If the user says 'hi' or greets you, just say a friendly hello back and ask what they want to study today. " +
            "For actual academic or conceptual questions, answer clearly and naturally with: " +
            "a definition, a real-world analogy or intuition, key points as bullet points, " +
            "a practical example or code snippet if relevant, and a helpful tip. " +
            "Write in a natural, engaging conversational tone. Do NOT use emojis.\n\nQuestion: " + question;
        String result = callGemini(prompt);
        return result != null ? result : mock.ask(question);
    }

    @Override
    public String rawPrompt(String prompt) {
        String result = callGemini(prompt);
        return result != null ? result : mock.rawPrompt(prompt);
    }

    @Override
    public String explainTopic(String topic, String level) {
        String prompt = "You are an expert CS professor and educator. Explain the topic '" + topic +
            "' for a " + level + " level student.\n\n" +
            "Structure your response EXACTLY as follows, using these emoji section headers:\n\n" +
            "📌 DEFINITION\n[Clear, precise 2-3 sentence definition]\n\n" +
            "💡 INTUITION / ANALOGY\n[A creative, memorable real-world analogy that makes the concept click]\n\n" +
            "🔑 KEY POINTS\n[5-8 bullet points (use •) covering the most important properties, rules, or mechanics]\n\n" +
            "📦 REAL WORLD EXAMPLES\n[3-5 concrete real-world examples or use cases, with context]\n\n" +
            "⚡ ADVANCED DETAILS\n[" + level + "-appropriate deeper insight: complexity, variants, gotchas, or tradeoffs]\n\n" +
            "💻 CODE EXAMPLE\n[A short, well-commented Java code snippet if applicable, in a ```java block]\n\n" +
            "Write in natural, engaging language. Be specific and concrete, not generic.";
        String result = callGemini(prompt);
        return result != null ? result : mock.explainTopic(topic, level);
    }

    @Override
    public String explainCode(String code, String language) {
        String prompt = "You are an expert " + language + " developer and CS tutor. Analyze this code:\n\n" +
            "```" + language + "\n" + code + "\n```\n\n" +
            "Provide a thorough analysis:\n" +
            "1. CODE SUMMARY — What does this code do in plain English?\n" +
            "2. LINE-BY-LINE BREAKDOWN — Walk through the key lines and explain each\n" +
            "3. TIME COMPLEXITY — Big-O analysis with reasoning\n" +
            "4. SPACE COMPLEXITY — Memory usage analysis\n" +
            "5. POTENTIAL BUGS / ISSUES — Edge cases, nulls, exceptions to watch out for\n" +
            "6. BEST PRACTICE SUGGESTIONS — How to make this code cleaner, safer, or faster\n\n" +
            "Be specific, concrete, and educational.";
        String result = callGemini(prompt);
        return result != null ? result : mock.explainCode(code, language);
    }

    @Override
    public Quiz generateQuiz(String topic, String difficulty) {
        // Delegate to mock — parsing structured JSON from LLM is fragile
        return mock.generateQuiz(topic, difficulty);
    }

    @Override
    public Diagram generateDiagram(String topic) {
        // Delegate to mock — text diagrams are deterministic
        return mock.generateDiagram(topic);
    }
}


