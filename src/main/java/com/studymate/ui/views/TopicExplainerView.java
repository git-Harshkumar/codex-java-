package com.studymate.ui.views;

import com.studymate.ui.DesignTokens;
import com.studymate.ui.components.NeoButton;
import com.studymate.ui.components.NeoCard;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TextField;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;

public class TopicExplainerView extends VBox {

    private VBox explanationContent;

    public TopicExplainerView() {
        setPadding(new Insets(20, 40, 40, 40));
        setSpacing(20);
        
        Label title = new Label("TOPIC EXPLAINER 📚");
        title.getStyleClass().add("heading-large");
        
        // Control Panel
        NeoCard controlCard = new NeoCard(DesignTokens.WHITE);
        
        HBox topControls = new HBox(15);
        topControls.setAlignment(Pos.CENTER_LEFT);
        
        VBox topicBox = new VBox(5);
        Label topicLbl = new Label("Topic");
        topicLbl.setStyle("-fx-font-weight: bold;");
        TextField topicInput = new TextField();
        topicInput.getStyleClass().add("neo-input");
        topicInput.setPromptText("e.g. Binary Search Tree");
        topicBox.getChildren().addAll(topicLbl, topicInput);
        
        VBox levelBox = new VBox(5);
        Label levelLbl = new Label("Level");
        levelLbl.setStyle("-fx-font-weight: bold;");
        ComboBox<String> levelCombo = new ComboBox<>();
        levelCombo.getItems().addAll("Beginner", "Intermediate", "Advanced");
        levelCombo.setValue("Beginner");
        levelCombo.setStyle("-fx-background-color: white; -fx-border-color: #1A1A1A; -fx-border-width: 2px; -fx-border-radius: 10px; -fx-padding: 2px;");
        levelBox.getChildren().addAll(levelLbl, levelCombo);
        
        VBox modeBox = new VBox(5);
        Label modeLbl = new Label("Learning Mode");
        modeLbl.setStyle("-fx-font-weight: bold;");
        HBox modes = new HBox(10);
        String[] modeNames = {"Explanation", "Example", "Visual", "Code"};
        for (int i = 0; i < modeNames.length; i++) {
            Label m = new Label(modeNames[i]);
            m.getStyleClass().add("neo-chip");
            if (i == 0) m.getStyleClass().add("neo-chip-active");
            modes.getChildren().add(m);
        }
        modeBox.getChildren().addAll(modeLbl, modes);
        
        NeoButton generateBtn = new NeoButton("EXPLAIN →");
        generateBtn.setActionStyle();
        generateBtn.setOnAction(e -> generateExplanation(topicInput.getText(), levelCombo.getValue()));
        
        VBox genBox = new VBox(5, new Label(""), generateBtn); // padding
        
        topControls.getChildren().addAll(topicBox, levelBox, modeBox, genBox);
        controlCard.getChildren().add(topControls);
        
        // Explanation Area
        explanationContent = new VBox(20);
        
        ScrollPane scrollPane = new ScrollPane();
        scrollPane.setContent(explanationContent);
        scrollPane.setFitToWidth(true);
        scrollPane.setStyle("-fx-background-color: transparent; -fx-background: " + DesignTokens.BACKGROUND + ";");
        VBox.setVgrow(scrollPane, Priority.ALWAYS);
        
        getChildren().addAll(title, controlCard, scrollPane);
    }
    
    private void generateExplanation(String topic, String level) {
        explanationContent.getChildren().clear();
        if (topic == null || topic.isEmpty()) topic = "Binary Search Tree";
        
        NeoCard expCard = new NeoCard(DesignTokens.LAVENDER);
        
        Label expTitle = new Label(topic.toUpperCase() + " (" + level + ")");
        expTitle.getStyleClass().add("heading-large");
        
        Label content = new Label(
            "1. DEFINITION\n" +
            "A " + topic + " is a data structure that... \n\n" +
            "2. INTUITION\n" +
            "Imagine a dictionary where you always split the book in half to find a word.\n\n" +
            "3. TIME COMPLEXITY\n" +
            "O(log n) for search, insert, and delete on average."
        );
        content.setWrapText(true);
        content.setStyle("-fx-font-size: 16px;");
        
        // Explain differently action
        HBox actionsBox = new HBox(15);
        actionsBox.setAlignment(Pos.CENTER_LEFT);
        
        Label difLbl = new Label("EXPLAIN DIFFERENTLY:");
        difLbl.setStyle("-fx-font-weight: 900;");
        
        String[] diffs = {"SIMPLE", "WITH ANALOGY", "STEP-BY-STEP", "VISUAL", "CODE-BASED", "EXAM STYLE"};
        HBox difChips = new HBox(10);
        for (String d : diffs) {
            Label chip = new Label(d);
            chip.getStyleClass().add("neo-chip");
            difChips.getChildren().add(chip);
        }
        
        actionsBox.getChildren().addAll(difLbl, difChips);
        
        expCard.getChildren().addAll(expTitle, new Label(""), content, new Label(""), actionsBox);
        explanationContent.getChildren().add(expCard);
    }
}
