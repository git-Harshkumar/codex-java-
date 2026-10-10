package com.studymate.ui.views;

import com.studymate.ui.DesignTokens;
import com.studymate.ui.components.NeoButton;
import com.studymate.ui.components.NeoCard;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.RadioButton;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TextField;
import javafx.scene.control.ToggleGroup;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;

public class QuizView extends VBox {

    private VBox quizContent;

    public QuizView() {
        setPadding(new Insets(20, 40, 40, 40));
        setSpacing(20);
        
        Label title = new Label("AI QUIZ SYSTEM 📝");
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
        topicInput.setPromptText("e.g. Binary Search");
        topicBox.getChildren().addAll(topicLbl, topicInput);
        
        VBox diffBox = new VBox(5);
        Label diffLbl = new Label("Difficulty");
        diffLbl.setStyle("-fx-font-weight: bold;");
        ComboBox<String> diffCombo = new ComboBox<>();
        diffCombo.getItems().addAll("Beginner", "Intermediate", "Advanced");
        diffCombo.setValue("Beginner");
        diffCombo.setStyle("-fx-background-color: white; -fx-border-color: #1A1A1A; -fx-border-width: 2px; -fx-border-radius: 10px;");
        diffBox.getChildren().addAll(diffLbl, diffCombo);
        
        NeoButton generateBtn = new NeoButton("START QUIZ →");
        generateBtn.setActionStyle();
        generateBtn.setOnAction(e -> startQuiz());
        
        VBox genBox = new VBox(5, new Label(""), generateBtn); // padding
        
        topControls.getChildren().addAll(topicBox, diffBox, genBox);
        controlCard.getChildren().add(topControls);
        
        // Quiz Area
        quizContent = new VBox(20);
        quizContent.setAlignment(Pos.CENTER);
        
        ScrollPane scrollPane = new ScrollPane();
        scrollPane.setContent(quizContent);
        scrollPane.setFitToWidth(true);
        scrollPane.setStyle("-fx-background-color: transparent; -fx-background: " + DesignTokens.BACKGROUND + ";");
        VBox.setVgrow(scrollPane, Priority.ALWAYS);
        
        getChildren().addAll(title, controlCard, scrollPane);
    }
    
    private void startQuiz() {
        quizContent.getChildren().clear();
        
        NeoCard qCard = new NeoCard(DesignTokens.LAVENDER);
        qCard.setPrefWidth(600);
        
        Label qNum = new Label("QUESTION 03 / 10");
        qNum.setStyle("-fx-font-weight: bold; -fx-font-size: 14px; -fx-text-fill: #555555;");
        
        Label qText = new Label("What is the average time complexity of binary search?");
        qText.setStyle("-fx-font-weight: 900; -fx-font-size: 24px;");
        qText.setWrapText(true);
        
        VBox optionsBox = new VBox(15);
        optionsBox.setPadding(new Insets(20, 0, 20, 0));
        
        ToggleGroup group = new ToggleGroup();
        
        String[] options = {"O(n)", "O(log n)", "O(n²)", "O(1)"};
        for (String opt : options) {
            RadioButton rb = new RadioButton(opt);
            rb.setToggleGroup(group);
            rb.setStyle("-fx-font-size: 18px; -fx-font-weight: bold;");
            optionsBox.getChildren().add(rb);
        }
        
        NeoButton submitBtn = new NeoButton("SUBMIT ANSWER");
        submitBtn.setStyle("-fx-background-color: " + DesignTokens.BLACK + "; -fx-text-fill: white;");
        
        Label resultLabel = new Label();
        resultLabel.setStyle("-fx-font-weight: bold; -fx-font-size: 16px;");
        
        submitBtn.setOnAction(e -> {
            RadioButton selected = (RadioButton) group.getSelectedToggle();
            if (selected != null) {
                if (selected.getText().equals("O(log n)")) {
                    resultLabel.setText("✓ CORRECT\nBinary search repeatedly divides the search space into half.");
                    resultLabel.setTextFill(javafx.scene.paint.Color.web("#2E7D32")); // dark green
                    qCard.setStyle("-fx-background-color: " + DesignTokens.MINT + ";");
                } else {
                    resultLabel.setText("✗ INCORRECT\nThe correct answer is O(log n).");
                    resultLabel.setTextFill(javafx.scene.paint.Color.web("#C62828")); // dark red
                    qCard.setStyle("-fx-background-color: #FFCDD2;");
                }
            }
        });
        
        qCard.getChildren().addAll(qNum, new Label(""), qText, optionsBox, submitBtn, new Label(""), resultLabel);
        
        quizContent.getChildren().add(qCard);
    }
}
