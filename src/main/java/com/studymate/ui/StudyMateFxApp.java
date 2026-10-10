package com.studymate.ui;

import com.studymate.StudyMateApplication;
import com.studymate.ui.views.DashboardView;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.scene.Scene;
import javafx.stage.Stage;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

public class StudyMateFxApp extends Application {

    private ConfigurableApplicationContext springContext;

    @Override
    public void init() throws Exception {
        // Initialize Spring Boot
        springContext = new SpringApplicationBuilder(StudyMateApplication.class)
                .headless(false)
                .run(getParameters().getRaw().toArray(new String[0]));
    }

    @Override
    public void start(Stage primaryStage) throws Exception {
        com.studymate.ui.views.MainLayout mainLayout = new com.studymate.ui.views.MainLayout();
        
        Scene scene = new Scene(mainLayout, 1280, 800);
        
        // Load CSS
        String css = getClass().getResource("/css/styles.css").toExternalForm();
        scene.getStylesheets().add(css);
        
        primaryStage.setTitle("StudyMate AI");
        primaryStage.setScene(scene);
        primaryStage.show();
    }

    @Override
    public void stop() throws Exception {
        if (springContext != null) {
            springContext.close();
        }
        Platform.exit();
    }
}
