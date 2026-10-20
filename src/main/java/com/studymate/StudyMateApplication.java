package com.studymate;

import com.studymate.ui.StudyMateFxApp;
import javafx.application.Application;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.awt.GraphicsEnvironment;

@SpringBootApplication
public class StudyMateApplication {

    public static void main(String[] args) {
        // Detect if running in a headless environment (Render, Docker, Linux server)
        // or if cloud server environment variables (like PORT or SERVER_MODE) are present
        boolean isServerOrHeadless = GraphicsEnvironment.isHeadless()
                || System.getenv("PORT") != null
                || "true".equalsIgnoreCase(System.getProperty("server.mode"))
                || "true".equalsIgnoreCase(System.getenv("SERVER_MODE"));

        if (isServerOrHeadless) {
            // Run pure Spring Boot web server without attempting to initialize JavaFX desktop GUI
            SpringApplication.run(StudyMateApplication.class, args);
        } else {
            try {
                // Launch local desktop JavaFX application
                Application.launch(StudyMateFxApp.class, args);
            } catch (Throwable t) {
                // Fallback to pure Spring Boot server if JavaFX fails to initialize
                System.err.println("[StudyMateApplication] JavaFX initialization failed. Falling back to Spring Boot web server: " + t.getMessage());
                SpringApplication.run(StudyMateApplication.class, args);
            }
        }
    }
}

