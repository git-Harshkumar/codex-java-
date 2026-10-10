package com.studymate.ui.views;

import com.studymate.ui.DesignTokens;
import com.studymate.ui.components.NeoButton;
import com.studymate.ui.components.NeoCard;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TextField;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;

public class VisualizerView extends VBox {

    private VBox diagramContent;

    public VisualizerView() {
        setPadding(new Insets(20, 40, 40, 40));
        setSpacing(20);
        
        Label title = new Label("ALGORITHM VISUALIZER 👁️");
        title.getStyleClass().add("heading-large");
        
        // Input Area
        HBox inputBox = new HBox(15);
        inputBox.setAlignment(Pos.CENTER_LEFT);
        
        TextField topicInput = new TextField();
        topicInput.setPromptText("Enter data structure (e.g. Binary Tree, Stack)...");
        topicInput.getStyleClass().add("neo-input");
        topicInput.setPrefWidth(600);
        
        NeoButton generateBtn = new NeoButton("GENERATE DIAGRAM");
        generateBtn.setActionStyle();
        generateBtn.setOnAction(e -> renderDiagram(topicInput.getText()));
        
        inputBox.getChildren().addAll(topicInput, generateBtn);
        
        // Diagram Area
        diagramContent = new VBox(20);
        diagramContent.setAlignment(Pos.CENTER);
        
        ScrollPane scrollPane = new ScrollPane();
        scrollPane.setContent(diagramContent);
        scrollPane.setFitToWidth(true);
        scrollPane.setStyle("-fx-background-color: transparent; -fx-background: " + DesignTokens.BACKGROUND + ";");
        VBox.setVgrow(scrollPane, Priority.ALWAYS);
        
        getChildren().addAll(title, inputBox, scrollPane);
    }
    
    private void renderDiagram(String topic) {
        diagramContent.getChildren().clear();
        
        NeoCard diagramCard = new NeoCard(DesignTokens.WHITE);
        diagramCard.setAlignment(Pos.CENTER);
        diagramCard.setMinHeight(400);
        
        String diagramText = "";
        
        if (topic.toLowerCase().contains("tree")) {
            diagramText = "          50\n" +
                          "        /    \\\n" +
                          "      30      70\n" +
                          "     /  \\    /  \\\n" +
                          "   20   40  60   80";
        } else if (topic.toLowerCase().contains("stack")) {
            diagramText = "┌─────┐\n" +
                          "│ 30  │\n" +
                          "├─────┤\n" +
                          "│ 20  │\n" +
                          "├─────┤\n" +
                          "│ 10  │\n" +
                          "└─────┘";
        } else if (topic.toLowerCase().contains("list")) {
            diagramText = "10 → 20 → 30 → 40 → NULL";
        } else {
            diagramText = "Diagram generation for '" + topic + "' is not supported in the mock version.";
        }
        
        Label diagramLabel = new Label(diagramText);
        diagramLabel.setStyle("-fx-font-family: 'Courier New', monospace; -fx-font-size: 24px; -fx-font-weight: bold; -fx-text-alignment: center;");
        diagramLabel.setAlignment(Pos.CENTER);
        
        diagramCard.getChildren().add(diagramLabel);
        
        diagramContent.getChildren().add(diagramCard);
    }
}
