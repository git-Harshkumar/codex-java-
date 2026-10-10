package com.studymate.ui.views;

import com.studymate.ui.DesignTokens;
import com.studymate.ui.components.NeoButton;
import com.studymate.ui.components.NeoCard;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.control.ProgressBar;
import javafx.scene.control.ScrollPane;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;

public class ProgressView extends VBox {

    public ProgressView() {
        setPadding(new Insets(20, 40, 40, 40));
        setSpacing(30);
        
        Label title = new Label("YOUR PROGRESS 📈");
        title.getStyleClass().add("heading-large");
        
        // Stats Row
        HBox statsBox = new HBox(30);
        statsBox.getChildren().addAll(
            createStatCard("TOTAL TOPICS", "47", DesignTokens.LAVENDER),
            createStatCard("STUDY STREAK", "7 DAYS", DesignTokens.YELLOW),
            createStatCard("QUIZ AVERAGE", "82%", DesignTokens.ORANGE),
            createStatCard("QUESTIONS", "238", DesignTokens.MINT)
        );
        
        // Performance Area
        HBox performanceBox = new HBox(40);
        
        // Strong Topics
        VBox strongBox = new VBox(20);
        strongBox.setPrefWidth(400);
        Label strongLbl = new Label("STRONG TOPICS 💪");
        strongLbl.setStyle("-fx-font-weight: 900; -fx-font-size: 18px;");
        
        NeoCard strongCard = new NeoCard(DesignTokens.WHITE);
        VBox strongContent = new VBox(15);
        strongContent.getChildren().addAll(
            createProgressRow("JAVA", 0.90, "90%"),
            createProgressRow("ARRAYS", 0.85, "85%"),
            createProgressRow("RECURSION", 0.75, "75%")
        );
        strongCard.getChildren().add(strongContent);
        strongBox.getChildren().addAll(strongLbl, strongCard);
        
        // Needs Practice
        VBox weakBox = new VBox(20);
        weakBox.setPrefWidth(400);
        Label weakLbl = new Label("NEEDS PRACTICE ⚠️");
        weakLbl.setStyle("-fx-font-weight: 900; -fx-font-size: 18px;");
        
        NeoCard weakCard = new NeoCard(DesignTokens.WHITE);
        VBox weakContent = new VBox(15);
        weakContent.getChildren().addAll(
            createProgressRow("TREES", 0.45, "45%"),
            createProgressRow("GRAPHS", 0.35, "35%"),
            createProgressRow("DP", 0.25, "25%")
        );
        weakCard.getChildren().add(weakContent);
        weakBox.getChildren().addAll(weakLbl, weakCard);
        
        performanceBox.getChildren().addAll(strongBox, weakBox);
        
        // Learning Path / Recommended
        VBox recBox = new VBox(15);
        Label recTitle = new Label("RECOMMENDED NEXT STEP");
        recTitle.setStyle("-fx-font-weight: bold; -fx-font-size: 18px;");
        
        NeoCard recCard = new NeoCard(DesignTokens.LAVENDER);
        Label recCardTitle = new Label("🌳 Binary Trees");
        recCardTitle.setStyle("-fx-font-weight: 900; -fx-font-size: 20px;");
        Label recDesc = new Label("You have completed 55% of this topic. Practice traversals next.");
        recDesc.setWrapText(true);
        NeoButton startBtn = new NeoButton("RESUME LEARNING →");
        startBtn.setActionStyle();
        
        VBox recCardContent = new VBox(15, recCardTitle, recDesc, startBtn);
        recCard.getChildren().add(recCardContent);
        recBox.getChildren().addAll(recTitle, recCard);
        
        ScrollPane scrollPane = new ScrollPane();
        VBox content = new VBox(30, statsBox, performanceBox, recBox);
        scrollPane.setContent(content);
        scrollPane.setFitToWidth(true);
        scrollPane.setStyle("-fx-background-color: transparent; -fx-background: " + DesignTokens.BACKGROUND + ";");
        VBox.setVgrow(scrollPane, Priority.ALWAYS);
        
        getChildren().addAll(title, scrollPane);
    }
    
    private NeoCard createStatCard(String title, String value, String color) {
        NeoCard card = new NeoCard(color);
        card.setPrefWidth(220);
        Label titleLabel = new Label(title);
        titleLabel.setStyle("-fx-font-weight: bold;");
        Label valueLabel = new Label(value);
        valueLabel.getStyleClass().add("stat-number");
        
        VBox content = new VBox(10, titleLabel, valueLabel);
        content.setAlignment(Pos.CENTER_LEFT);
        card.getChildren().add(content);
        return card;
    }
    
    private HBox createProgressRow(String label, double progress, String textVal) {
        HBox row = new HBox(10);
        row.setAlignment(Pos.CENTER_LEFT);
        
        Label lbl = new Label(label);
        lbl.setPrefWidth(120);
        lbl.setStyle("-fx-font-weight: bold;");
        
        // Basic JavaFX ProgressBar styled minimally
        ProgressBar bar = new ProgressBar(progress);
        bar.setPrefWidth(150);
        bar.setPrefHeight(20);
        bar.setStyle("-fx-accent: " + DesignTokens.BLACK + "; -fx-control-inner-background: #E0E0E0;");
        
        Label val = new Label(textVal);
        val.setStyle("-fx-font-weight: bold;");
        
        row.getChildren().addAll(lbl, bar, val);
        return row;
    }
}
