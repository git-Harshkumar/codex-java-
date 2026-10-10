# StudyMate AI - Full-Stack Java AI Study Assistant

StudyMate AI is a production-grade AI-powered study assistant application designed to help students learn technical and academic topics interactively. It combines a Neo-Brutalist JavaFX frontend with a robust Spring Boot backend.

## Project Structure

This project follows a unified architecture where a single Maven project runs a Spring Boot backend and launches a JavaFX frontend application locally. They run within the same JVM, making it easy for the UI to consume backend services while still exposing standard REST APIs.

```text
src/
 ├── main/
 │   ├── java/
 │   │   └── com.studymate/
 │   │      ├── ai/             # AI Service abstraction and implementations
 │   │      ├── controller/     # REST APIs for external or decoupled consumption
 │   │      ├── model/          # JPA Entities and Data models
 │   │      ├── repository/     # Spring Data JPA Repositories
 │   │      ├── ui/             # JavaFX Application, views, components
 │   │      └── StudyMateApplication.java  # Main Bootstrapping Class
 │   │
 │   └── resources/
 │       ├── css/               # Neo-Brutalist design styles
 │       └── application.properties # Spring Boot Configuration
```

## Features Currently Implemented

*   **Phase 1: Project Setup & Design System**
    *   Maven `pom.xml` configuration integrating Spring Boot, JavaFX, and MySQL.
    *   `DesignTokens.java` outlining the Neo-Brutalist color palette.
    *   `styles.css` applying the hard shadows and bold borders to standard UI components.
    *   Reusable UI components like `NeoButton` and `NeoCard`.
*   **Phase 2: Database Setup**
    *   `application.properties` set up with placeholders for database connections.
    *   `User` and `Topic` JPA entities and repositories created.
*   **Phase 3: Dashboard**
    *   `DashboardView.java` implements the core Neo-Brutalist dashboard structure (navigation, greeting, search bar, statistics cards, learning topics).
*   **Phase 4: AI Tutor Interface**
    *   `AITutorView.java` provides a chat interface to ask questions natively with AI-structured action pills like [ EXPLAIN SIMPLER ] and [ SHOW DIAGRAM ].
*   **Phase 5: Topic Explainer**
    *   `TopicExplainerView.java` allows users to select topics, levels, and learning modes to get structured pedagogical explanations and ask for alternative perspectives via the "EXPLAIN DIFFERENTLY" actions.
*   **Phase 6: Code Explainer & Hint Mode**
    *   `CodeExplainerView.java` analyzes user code and implements the crucial **Hint Mode** which guides the student with hints rather than just giving away the final solution.
*   **Phase 7: Visualizer**
    *   `VisualizerView.java` generates text-based visual structural diagrams of algorithms and data structures based on the mock backend.
*   **Phase 8: Quiz System**
    *   `QuizView.java` generates AI quizzes and interactive UI cards evaluating multiple-choice questions with real-time feedback using brutalist color-coding (Mint for correct, Red for incorrect).
*   **Phase 9: Study Notes**
    *   `NotesView.java` implements a clean grid of saved study cards with tags, dates, and summaries.
*   **Phase 10: Progress Dashboard**
    *   `ProgressView.java` calculates total statistics, visualizes strong vs weak topics using custom progress bars, and recommends the next best topic for the user.
*   **Phase 11: Profile & Settings**
    *   `ProfileSettingsView.java` integrates the user profile, app configurations, AI API key injection, and learning preferences on a unified screen.

## Next Steps for Development

1.  **Configure Database:** Update the `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` in `application.properties` or environment variables to connect to your local MySQL instance.
2.  **Integrate Real AI Backend:** Replace `MockAIService` with an implementation that calls OpenAI (or another provider) using the `AI_API_KEY`.
3.  **Wire Up Backend State:** Connect the UI buttons to the backend REST/Service controllers and implement state management across views.

## Running the Application

Ensure you have Java 17+ installed.

Run the application using your IDE or via Maven:

```bash
mvn spring-boot:run
```

This will initialize the Spring Boot context and launch the JavaFX UI window.
