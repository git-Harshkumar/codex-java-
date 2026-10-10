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

public class AITutorView extends VBox {

    private VBox chatHistory;

    public AITutorView() {
        setPadding(new Insets(20, 40, 40, 40));
        setSpacing(20);
        
        Label title = new Label("AI TUTOR 🤖");
        title.getStyleClass().add("heading-large");
        
        chatHistory = new VBox(20);
        chatHistory.setPadding(new Insets(10));
        
        ScrollPane scrollPane = new ScrollPane();
        scrollPane.setContent(chatHistory);
        scrollPane.setFitToWidth(true);
        scrollPane.setStyle("-fx-background-color: transparent; -fx-background: " + DesignTokens.BACKGROUND + ";");
        VBox.setVgrow(scrollPane, Priority.ALWAYS);
        
        // Input area
        HBox inputBox = new HBox(15);
        inputBox.setAlignment(Pos.CENTER_LEFT);
        
        TextField questionInput = new TextField();
        questionInput.setPromptText("Ask your tutor a question...");
        questionInput.getStyleClass().add("neo-input");
        questionInput.setPrefWidth(800);
        HBox.setHgrow(questionInput, Priority.ALWAYS);
        
        NeoButton askBtn = new NeoButton("ASK →");
        askBtn.setOnAction(e -> {
            String q = questionInput.getText();
            if (!q.isEmpty()) {
                addMessage("YOU", q, DesignTokens.WHITE);
                questionInput.clear();
                // Simulate AI Response
                simulateAIResponse(q);
            }
        });
        
        inputBox.getChildren().addAll(questionInput, askBtn);
        
        getChildren().addAll(title, scrollPane, inputBox);
        
        // Initial Greeting
        simulateAIResponse("Hello! I'm StudyMate AI. How can I help you today?");
    }
    
    private void addMessage(String sender, String text, String color) {
        NeoCard messageCard = new NeoCard(color);
        Label senderLabel = new Label(sender);
        senderLabel.setStyle("-fx-font-weight: 900; -fx-font-size: 14px;");
        
        Label textLabel = new Label(text);
        textLabel.setWrapText(true);
        textLabel.setStyle("-fx-font-size: 16px;");
        
        messageCard.getChildren().addAll(senderLabel, new Label(""), textLabel); // Empty label for spacing
        
        chatHistory.getChildren().add(messageCard);
    }
    
    private void simulateAIResponse(String prompt) {
        // Here we would call AIService in a background thread
        // For now, we mock the UI update
        NeoCard aiCard = new NeoCard(DesignTokens.LAVENDER);
        
        Label senderLabel = new Label("STUDYMATE AI");
        senderLabel.setStyle("-fx-font-weight: 900; -fx-font-size: 14px;");
        
        Label textLabel = new Label("This is a simulated response to: " + prompt + "\n\n📖 DEFINITION\nRecursion is a programming technique where a function calls itself to solve a smaller version of the same problem.\n\n💡 INTUITION\nThink of a set of Russian dolls.");
        textLabel.setWrapText(true);
        textLabel.setStyle("-fx-font-size: 16px;");
        
        // Action buttons
        HBox actions = new HBox(10);
        actions.setPadding(new Insets(15, 0, 0, 0));
        
        String[] actionTexts = {"EXPLAIN SIMPLER", "GIVE AN EXAMPLE", "SHOW DIAGRAM", "EXPLAIN WITH CODE", "COMPARE", "TAKE QUIZ"};
        for (String action : actionTexts) {
            Label actionChip = new Label(action);
            actionChip.getStyleClass().add("neo-chip");
            actions.getChildren().add(actionChip);
        }
        
        ScrollPane actionsScroll = new ScrollPane();
        actionsScroll.setContent(actions);
        actionsScroll.setFitToWidth(true);
        actionsScroll.setStyle("-fx-background-color: transparent;");
        actionsScroll.setVbarPolicy(ScrollPane.ScrollBarPolicy.NEVER);
        actionsScroll.setHbarPolicy(ScrollPane.ScrollBarPolicy.AS_NEEDED);
        
        aiCard.getChildren().addAll(senderLabel, new Label(""), textLabel, actionsScroll);
        
        chatHistory.getChildren().add(aiCard);
    }
}
