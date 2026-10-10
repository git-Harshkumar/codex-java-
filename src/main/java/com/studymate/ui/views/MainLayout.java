package com.studymate.ui.views;

import com.studymate.ui.DesignTokens;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.Label;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;

import java.util.HashMap;
import java.util.Map;

public class MainLayout extends BorderPane {

    private HBox navbar;
    private Map<String, Node> views = new HashMap<>();
    private Map<String, Label> navLinks = new HashMap<>();

    public MainLayout() {
        getStyleClass().add("root");
        
        // Initialize views
        views.put("Dashboard", createDashboardView());
        views.put("AITutor", new AITutorView());
        views.put("Topics", new TopicExplainerView());
        views.put("Code", new CodeExplainerView());
        views.put("Visualizer", new VisualizerView());
        views.put("Quizzes", new QuizView());
        views.put("Notes", new NotesView());
        views.put("Progress", new ProgressView());
        views.put("Settings", new ProfileSettingsView());
        
        // Setup Navbar
        navbar = createNavbar();
        setTop(navbar);
        
        // Default View
        switchView("Dashboard");
    }

    private Node createDashboardView() {
        return new DashboardView();
    }

    private HBox createNavbar() {
        HBox nav = new HBox(20);
        nav.setAlignment(Pos.CENTER_LEFT);
        nav.getStyleClass().add("neo-navbar");
        HBox.setMargin(nav, new Insets(20, 40, 20, 40));
        
        Label brand = new Label("STUDYMATE AI");
        brand.setStyle("-fx-text-fill: white; -fx-font-weight: 900; -fx-font-size: 18px;");
        
        HBox links = new HBox(10);
        links.setAlignment(Pos.CENTER);
        
        String[] navItems = {"Dashboard", "AI Tutor", "Topics", "Code", "Visualize", "Quizzes", "Notes", "Progress"};
        String[] viewKeys = {"Dashboard", "AITutor", "Topics", "Code", "Visualizer", "Quizzes", "Notes", "Progress"}; // Map to keys
        
        for (int i = 0; i < navItems.length; i++) {
            String name = navItems[i];
            String viewKey = viewKeys[i];
            Label link = new Label(name);
            link.getStyleClass().add("nav-item");
            
            link.setOnMouseClicked(e -> {
                if (views.containsKey(viewKey)) {
                    switchView(viewKey);
                }
            });
            
            navLinks.put(viewKey, link);
            links.getChildren().add(link);
        }
        
        HBox spacer = new HBox();
        HBox.setHgrow(spacer, Priority.ALWAYS);
        
        Label user = new Label("Harsh • Student");
        user.setStyle("-fx-text-fill: white;");
        
        Label settings = new Label("⚙");
        settings.setStyle("-fx-text-fill: white; -fx-font-size: 18px; -fx-cursor: hand;");
        settings.setOnMouseClicked(e -> switchView("Settings"));
        navLinks.put("Settings", settings);
        
        nav.getChildren().addAll(brand, links, spacer, user, settings);
        return nav;
    }

    public void switchView(String viewName) {
        setCenter(views.get(viewName));
        
        // Update active state
        navLinks.values().forEach(lbl -> lbl.getStyleClass().remove("nav-item-active"));
        if (navLinks.containsKey(viewName)) {
            navLinks.get(viewName).getStyleClass().add("nav-item-active");
        }
    }
}
