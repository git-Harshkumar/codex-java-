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
import com.fasterxml.jackson.databind.ObjectMapper;

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

    @Override
    public void setApiKey(String key) {
        this.apiKey = key;
    }

    private static final List<String> MODEL_CANDIDATES = List.of(
        "gemini-3.8-flash",
        "gemini-2.0-flash",
        "gemini-2.5-pro",
        "gemini-flash-latest"
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
                String url = "https://generativelanguage.googleapis.com/v1/models/" + model + ":generateContent?key=" + apiKey;
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
        if (result == null) {
            return mock.rawPrompt(prompt);
        }
        // If this looks like a diagram request, extract only the JSON block
        // before returning — so the frontend never sees prose wrapping the JSON.
        String lp = prompt.toLowerCase();
        boolean isDiagramRequest =
            lp.contains("generate a detailed, accurate diagram for:") ||
            lp.contains("generate a diagram for the topic") ||
            lp.contains("output this exact json") ||
            lp.contains("return only the json");
        if (isDiagramRequest) {
            return extractJsonFromGeminiResponse(result);
        }
        return result;
    }

    /**
     * Strips any prose, markdown fences, or preamble from a Gemini response
     * and returns only the first valid JSON object found.
     * Falls back to the full string if no JSON object is detected.
     */
    private String extractJsonFromGeminiResponse(String text) {
        if (text == null || text.isBlank()) return text;
        String trimmed = text.trim();

        // 1. Strip ```json ... ``` or ``` ... ``` fences
        java.util.regex.Pattern fence = java.util.regex.Pattern.compile(
            "```(?:json)?\\s*([\\s\\S]*?)```", java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher fm = fence.matcher(trimmed);
        if (fm.find()) return fm.group(1).trim();

        // 2. Already clean JSON
        if (trimmed.startsWith("{")) return trimmed;

        // 3. Find first '{' and walk to the matching '}'
        int start = trimmed.indexOf('{');
        if (start != -1) {
            int depth = 0;
            boolean inStr = false;
            boolean escape = false;
            for (int i = start; i < trimmed.length(); i++) {
                char ch = trimmed.charAt(i);
                if (escape)          { escape = false; continue; }
                if (ch == '\\' && inStr) { escape = true; continue; }
                if (ch == '"')       { inStr = !inStr; continue; }
                if (inStr)           continue;
                if (ch == '{')       depth++;
                else if (ch == '}') {
                    depth--;
                    if (depth == 0) return trimmed.substring(start, i + 1);
                }
            }
        }

        // 4. Nothing found — return as-is; frontend extractJSON will handle or report the error
        return text;
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
    public Quiz generateQuiz(String topic, String difficulty, int count) {
        String prompt = "Generate a " + difficulty + " difficulty multiple-choice quiz about " + topic + " with exactly " + count + " questions.\n" +
            "Return ONLY raw JSON, with no markdown formatting or backticks, exactly matching this schema:\n" +
            "{\n" +
            "  \"topic\": \"" + topic + "\",\n" +
            "  \"difficulty\": \"" + difficulty + "\",\n" +
            "  \"questions\": [\n" +
            "    {\n" +
            "      \"text\": \"question text\",\n" +
            "      \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n" +
            "      \"correctAnswer\": \"Exact string of the correct option\",\n" +
            "      \"explanation\": \"Why it is correct\"\n" +
            "    }\n" +
            "  ]\n" +
            "}";
            
        String result = callGemini(prompt);
        if (result != null) {
            try {
                // Remove any accidental markdown backticks just in case
                String cleanResult = result.replace("```json", "").replace("```", "").trim();
                ObjectMapper mapper = new ObjectMapper();
                return mapper.readValue(cleanResult, Quiz.class);
            } catch (Exception e) {
                // If parsing fails, fallback to mock
                System.err.println("Failed to parse Gemini quiz JSON: " + e.getMessage());
            }
        }
        return mock.generateQuiz(topic, difficulty, count);
    }

    @Override
    public Diagram generateDiagram(String topic) {
        // Delegate to mock — text diagrams are deterministic
        return mock.generateDiagram(topic);
    }
}


