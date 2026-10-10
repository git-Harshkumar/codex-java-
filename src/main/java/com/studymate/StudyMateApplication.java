package com.studymate;

import com.studymate.ui.StudyMateFxApp;
import javafx.application.Application;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StudyMateApplication {

    public static void main(String[] args) {
        // We launch the JavaFX application here. 
        // Spring Boot is initialized inside StudyMateFxApp.init()
        Application.launch(StudyMateFxApp.class, args);
    }
}
