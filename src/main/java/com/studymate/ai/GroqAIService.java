package com.studymate.ai;

import com.studymate.model.Diagram;
import com.studymate.model.Quiz;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * GroqAIService connects to the Groq API (OpenAI-compatible endpoint).
 * On failure it delegates to MockAIService for rich, topic-aware fallback responses.
 */
@Service
@Primary
public class GroqAIService implements AIService {

    @Value("${groq.api.key:}")
    private String apiKey;

    // Default model — fast and capable. Can be overridden via groq.model property.
    @Value("${groq.model:openai/gpt-oss-20b}")
    private String model;

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    private final RestTemplate restTemplate = new RestTemplate();
    private final MockAIService mock = new MockAIService();
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void setApiKey(String key) {
        this.apiKey = key;
    }

    // ---------------------------------------------------------------
    // Core Groq caller — returns null on failure so callers use mock
    // ---------------------------------------------------------------
    private String callGroq(String systemPrompt, String userPrompt, boolean jsonMode, int maxTokens) {
        if (apiKey == null || apiKey.isBlank()) {
            System.err.println("[GroqAIService] No API key set — using mock fallback.");
            return null;
        }

        try {
            Map<String, Object> systemMsg = Map.of("role", "system", "content", systemPrompt);
            Map<String, Object> userMsg   = Map.of("role", "user",   "content", userPrompt);

            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("model", model);
            body.put("messages", List.of(systemMsg, userMsg));
            body.put("temperature", 0.7);
            body.put("max_tokens", maxTokens > 0 ? maxTokens : 4096);

            if (jsonMode) {
                body.put("response_format", Map.of("type", "json_object"));
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(GROQ_API_URL, request, Map.class);

            if (response.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices =
                    (List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    if (message != null && message.get("content") != null) {
                        return message.get("content").toString();
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[GroqAIService] API call failed: " + e.getMessage());
        }
        return null;
    }

    private String callGroq(String systemPrompt, String userPrompt) {
        return callGroq(systemPrompt, userPrompt, false, 4096);
    }

    /** Convenience overload: single combined prompt (system = StudyMate persona). */
    private String callGroq(String prompt) {
        return callGroq(
            "You are StudyMate AI, a highly knowledgeable educational assistant for students.",
            prompt,
            false,
            4096
        );
    }

    // ---------------------------------------------------------------
    // Strips markdown fences and extracts the first valid JSON object found
    // ---------------------------------------------------------------
    private String extractJson(String text) {
        if (text == null || text.isBlank()) return text;
        String trimmed = text.trim();

        // 1. Markdown code fences: ```json ... ```
        java.util.regex.Matcher fm = java.util.regex.Pattern
            .compile("```(?:json)?\\s*([\\s\\S]*?)```", java.util.regex.Pattern.CASE_INSENSITIVE)
            .matcher(trimmed);
        if (fm.find()) {
            trimmed = fm.group(1).trim();
        }

        // 2. Extract balanced JSON object from first '{' to matching '}'
        int start = trimmed.indexOf('{');
        if (start != -1) {
            int depth = 0;
            boolean inStr = false, escape = false;
            for (int i = start; i < trimmed.length(); i++) {
                char ch = trimmed.charAt(i);
                if (escape)            { escape = false; continue; }
                if (ch == '\\' && inStr) { escape = true; continue; }
                if (ch == '"')         { inStr = !inStr; continue; }
                if (inStr)             continue;
                if (ch == '{')         depth++;
                else if (ch == '}') {
                    depth--;
                    if (depth == 0) return trimmed.substring(start, i + 1);
                }
            }
        }
        return trimmed;
    }

    // ---------------------------------------------------------------
    // AIService interface implementations
    // ---------------------------------------------------------------

    @Override
    public String ask(String question) {
        String prompt =
            "If the user says 'hi' or greets you, say a friendly hello and ask what they want to study today. " +
            "For academic or conceptual questions, answer clearly with: a definition, a real-world analogy, " +
            "key bullet points, a practical example or code snippet if relevant, and a helpful tip. " +
            "Write in a natural, engaging conversational tone. Do NOT use emojis.\n\nQuestion: " + question;
        String result = callGroq(prompt);
        return result != null ? result : mock.ask(question);
    }

    @Override
    public String rawPrompt(String prompt) {
        String lp = prompt.toLowerCase();
        boolean isJsonRequest =
            lp.contains("json") ||
            lp.contains("generate a detailed, accurate diagram for:") ||
            lp.contains("generate a diagram for the topic") ||
            lp.contains("output this exact json") ||
            lp.contains("return only the json");

        String systemPrompt = isJsonRequest
            ? "You are an educational diagram generator. You must output ONLY a single valid JSON object matching the requested schema. No conversation, no explanations, no markdown fences."
            : "You are StudyMate AI, a highly knowledgeable educational assistant for students.";

        String result = callGroq(systemPrompt, prompt, isJsonRequest, 8192);
        if (result == null) return mock.rawPrompt(prompt);

        return isJsonRequest ? extractJson(result) : result;
    }

    @Override
    public String explainTopic(String topic, String level) {
        String prompt =
            "You are an expert CS professor and educator. Explain the topic '" + topic +
            "' for a " + level + " level student.\n\n" +
            "Structure your response EXACTLY as follows, using these emoji section headers:\n\n" +
            "📌 DEFINITION\n[Clear, precise 2-3 sentence definition]\n\n" +
            "💡 INTUITION / ANALOGY\n[A creative, memorable real-world analogy that makes the concept click]\n\n" +
            "🔑 KEY POINTS\n[5-8 bullet points (use •) covering the most important properties, rules, or mechanics]\n\n" +
            "📦 REAL WORLD EXAMPLES\n[3-5 concrete real-world examples or use cases, with context]\n\n" +
            "⚡ ADVANCED DETAILS\n[" + level + "-appropriate deeper insight: complexity, variants, gotchas, or tradeoffs]\n\n" +
            "💻 CODE EXAMPLE\n[A short, well-commented Java code snippet if applicable, in a ```java block]\n\n" +
            "Write in natural, engaging language. Be specific and concrete, not generic.";
        String result = callGroq(prompt);
        return result != null ? result : mock.explainTopic(topic, level);
    }

    @Override
    public String explainCode(String code, String language) {
        String prompt =
            "You are an expert " + language + " developer and CS tutor. Analyze this code:\n\n" +
            "```" + language + "\n" + code + "\n```\n\n" +
            "Provide a thorough analysis:\n" +
            "1. CODE SUMMARY — What does this code do in plain English?\n" +
            "2. LINE-BY-LINE BREAKDOWN — Walk through the key lines and explain each\n" +
            "3. TIME COMPLEXITY — Big-O analysis with reasoning\n" +
            "4. SPACE COMPLEXITY — Memory usage analysis\n" +
            "5. POTENTIAL BUGS / ISSUES — Edge cases, nulls, exceptions to watch out for\n" +
            "6. BEST PRACTICE SUGGESTIONS — How to make this code cleaner, safer, or faster\n\n" +
            "Be specific, concrete, and educational.";
        String result = callGroq(prompt);
        return result != null ? result : mock.explainCode(code, language);
    }

    @Override
    public Quiz generateQuiz(String topic, String difficulty, int count) {
        String prompt =
            "Generate a " + difficulty + " difficulty multiple-choice quiz about " + topic +
            " with exactly " + count + " questions.\n" +
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

        String result = callGroq("You are a quiz generation engine. Return only a valid JSON object matching the requested schema.", prompt, true, 4096);
        if (result != null) {
            try {
                String clean = extractJson(result);
                return mapper.readValue(clean, Quiz.class);
            } catch (Exception e) {
                System.err.println("[GroqAIService] Failed to parse quiz JSON: " + e.getMessage());
            }
        }
        return mock.generateQuiz(topic, difficulty, count);
    }

    @Override
    public Diagram generateDiagram(String topic) {
        // Delegate to mock — deterministic diagram generation
        return mock.generateDiagram(topic);
    }
}
