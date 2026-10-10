package com.studymate.ui.views;

import com.studymate.ui.DesignTokens;
import com.studymate.ui.components.NeoButton;
import com.studymate.ui.components.NeoCard;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TextField;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;

public class DashboardView extends BorderPane {

    public DashboardView() {
        getStyleClass().add("root");
        
        // Main Content
        ScrollPane scrollPane = new ScrollPane();
        scrollPane.setFitToWidth(true);
        scrollPane.setStyle("-fx-background-color: transparent; -fx-background: " + DesignTokens.BACKGROUND + ";");
        scrollPane.setContent(createMainContent());
        
        setCenter(scrollPane);
    }
    
    private VBox createMainContent() {
        VBox content = new VBox(40);
        content.setPadding(new Insets(20, 40, 40, 40));
        
        // Greeting
        VBox greetingBox = new VBox(10);
        Label greeting = new Label("GOOD MORNING, HARSH 👋");
        greeting.getStyleClass().add("heading-large");
        Label subGreeting = new Label("WHAT DO YOU WANT TO LEARN TODAY?");
        subGreeting.setStyle("-fx-font-weight: bold; -fx-font-size: 18px;");
        greetingBox.getChildren().addAll(greeting, subGreeting);
        
        // Search Box
        HBox searchBox = new HBox(20);
        searchBox.setAlignment(Pos.CENTER_LEFT);
        
        TextField searchInput = new TextField();
        searchInput.setPromptText("🔍 Ask anything... \"Explain Binary Search Tree with a diagram\"");
        searchInput.getStyleClass().add("neo-input");
        searchInput.setPrefWidth(800);
        HBox.setHgrow(searchInput, Priority.ALWAYS);
        
        NeoButton askBtn = new NeoButton("ASK AI →");
        
        searchBox.getChildren().addAll(searchInput, askBtn);
        
        // Stats
        HBox statsBox = new HBox(30);
        statsBox.getChildren().addAll(
            createStatCard("TOPICS LEARNED", "47", DesignTokens.LAVENDER),
            createStatCard("QUIZ SCORE", "82%", DesignTokens.ORANGE),
            createStatCard("STUDY STREAK", "7 🔥", DesignTokens.YELLOW),
            createStatCard("QUESTIONS", "238", DesignTokens.MINT)
        );
        
        // Categories
        VBox categoriesBox = new VBox(15);
        Label categoriesTitle = new Label("YOUR LEARNING");
        categoriesTitle.setStyle("-fx-font-weight: bold; -fx-font-size: 16px;");
        
        HBox chips = new HBox(15);
        String[] cats = {"ALL", "JAVA", "DSA", "DBMS", "OS", "AI", "+"};
        for (int i = 0; i < cats.length; i++) {
            Label chip = new Label(cats[i]);
            chip.getStyleClass().add("neo-chip");
            if (i == 0) chip.getStyleClass().add("neo-chip-active");
            chips.getChildren().add(chip);
        }
        categoriesBox.getChildren().addAll(categoriesTitle, chips);
        
        // Continue Learning
        VBox continueBox = new VBox(15);
        Label continueTitle = new Label("CONTINUE LEARNING");
        continueTitle.setStyle("-fx-font-weight: bold; -fx-font-size: 16px;");
        
        HBox topicCards = new HBox(30);
        topicCards.getChildren().addAll(
            createTopicCard("📚", "RECURSION", "80%", DesignTokens.WHITE),
            createTopicCard("🌳", "BINARY TREES", "55%", DesignTokens.WHITE)
        );
        continueBox.getChildren().addAll(continueTitle, topicCards);
        
        // Recommendations
        VBox recBox = new VBox(15);
        Label recTitle = new Label("RECOMMENDED FOR YOU");
        recTitle.setStyle("-fx-font-weight: bold; -fx-font-size: 16px;");
        
        NeoCard recCard = new NeoCard(DesignTokens.LAVENDER);
        Label recCardTitle = new Label("🌐 GRAPHS");
        recCardTitle.setStyle("-fx-font-weight: bold; -fx-font-size: 20px;");
        Label recDesc = new Label("Based on your recent progress, graphs are the next recommended topic.");
        recDesc.setWrapText(true);
        NeoButton startBtn = new NeoButton("START LEARNING →");
        startBtn.setActionStyle();
        
        VBox recCardContent = new VBox(15, recCardTitle, recDesc, startBtn);
        recCard.getChildren().add(recCardContent);
        
        recBox.getChildren().addAll(recTitle, recCard);
        
        content.getChildren().addAll(greetingBox, searchBox, statsBox, categoriesBox, continueBox, recBox);
        return content;
    }
    
    private NeoCard createStatCard(String title, String value, String color) {
        NeoCard card = new NeoCard(color);
        card.setPrefWidth(250);
        Label titleLabel = new Label(title);
        titleLabel.setStyle("-fx-font-weight: bold;");
        Label valueLabel = new Label(value);
        valueLabel.getStyleClass().add("stat-number");
        
        VBox content = new VBox(10, titleLabel, valueLabel);
        content.setAlignment(Pos.CENTER_LEFT);
        card.getChildren().add(content);
        return card;
    }
    
    private NeoCard createTopicCard(String icon, String title, String progress, String color) {
        NeoCard card = new NeoCard(color);
        card.setPrefWidth(400);
        
        Label iconLabel = new Label(icon);
        iconLabel.setStyle("-fx-font-size: 24px;");
        
        Label titleLabel = new Label(title);
        titleLabel.setStyle("-fx-font-weight: bold; -fx-font-size: 18px;");
        
        // Mock progress bar text representation
        Label progressLabel = new Label("Progress: " + progress);
        
        NeoButton continueBtn = new NeoButton("CONTINUE →");
        continueBtn.setStyle("-fx-background-color: " + DesignTokens.BLACK + "; -fx-text-fill: white;");
        
        VBox content = new VBox(15, iconLabel, titleLabel, progressLabel, continueBtn);
        card.getChildren().add(content);
        return card;
    }
}
