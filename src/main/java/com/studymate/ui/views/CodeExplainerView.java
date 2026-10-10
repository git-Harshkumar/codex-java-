package com.studymate.ui.views;

import com.studymate.ui.DesignTokens;
import com.studymate.ui.components.NeoButton;
import com.studymate.ui.components.NeoCard;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TextArea;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;

public class CodeExplainerView extends VBox {

    private VBox explanationContent;

    public CodeExplainerView() {
        setPadding(new Insets(20, 40, 40, 40));
        setSpacing(20);
        
        Label title = new Label("CODE EXPLAINER 💻");
        title.getStyleClass().add("heading-large");
        
        // Input Area
        NeoCard inputCard = new NeoCard(DesignTokens.WHITE);
        
        Label pasteLbl = new Label("PASTE YOUR CODE");
        pasteLbl.setStyle("-fx-font-weight: bold; -fx-font-size: 16px;");
        
        TextArea codeArea = new TextArea();
        codeArea.setPromptText("public static void main(String[] args) {\n    ...\n}");
        codeArea.setStyle("-fx-font-family: 'Courier New', monospace; -fx-font-size: 14px; -fx-control-inner-background: #1A1A1A; -fx-text-fill: white;");
        codeArea.setPrefRowCount(10);
        
        HBox bottomControls = new HBox(20);
        bottomControls.setAlignment(Pos.CENTER_LEFT);
        
        VBox langBox = new VBox(5);
        Label langLbl = new Label("Language:");
        langLbl.setStyle("-fx-font-weight: bold;");
        ComboBox<String> langCombo = new ComboBox<>();
        langCombo.getItems().addAll("Java", "Python", "C++", "JavaScript");
        langCombo.setValue("Java");
        langCombo.setStyle("-fx-background-color: white; -fx-border-color: #1A1A1A; -fx-border-width: 2px; -fx-border-radius: 10px;");
        langBox.getChildren().addAll(langLbl, langCombo);
        
        NeoButton explainBtn = new NeoButton("EXPLAIN CODE →");
        explainBtn.setOnAction(e -> generateExplanation(codeArea.getText(), false));
        
        NeoButton hintBtn = new NeoButton("💡 HINT MODE");
        hintBtn.setActionStyle();
        hintBtn.setOnAction(e -> generateExplanation(codeArea.getText(), true));
        
        VBox expBox = new VBox(5, new Label(""), explainBtn); // padding
        VBox hntBox = new VBox(5, new Label(""), hintBtn); // padding
        
        bottomControls.getChildren().addAll(langBox, expBox, hntBox);
        
        inputCard.getChildren().addAll(pasteLbl, new Label(""), codeArea, new Label(""), bottomControls);
        
        // Explanation Area
        explanationContent = new VBox(20);
        
        ScrollPane scrollPane = new ScrollPane();
        scrollPane.setContent(explanationContent);
        scrollPane.setFitToWidth(true);
        scrollPane.setStyle("-fx-background-color: transparent; -fx-background: " + DesignTokens.BACKGROUND + ";");
        VBox.setVgrow(scrollPane, Priority.ALWAYS);
        
        getChildren().addAll(title, inputCard, scrollPane);
    }
    
    private void generateExplanation(String code, boolean hintMode) {
        explanationContent.getChildren().clear();
        
        NeoCard expCard = new NeoCard(hintMode ? DesignTokens.YELLOW : DesignTokens.MINT);
        
        Label expTitle = new Label(hintMode ? "HINT MODE ACTIVE 💡" : "CODE EXPLANATION");
        expTitle.getStyleClass().add("heading-large");
        
        String contentText;
        if (hintMode) {
            contentText = "HINT 1\nThink about what happens when the loop reaches the end of the array.\n\n" +
                          "HINT 2\nLook at the loop condition, is it possible to go out of bounds?\n\n" +
                          "HINT 3\nTry tracking this variable through each iteration...";
        } else {
            contentText = "CODE SUMMARY\nThis code appears to perform a linear search on an array.\n\n" +
                          "LINE-BY-LINE EXPLANATION\nLine 1: ...\n\n" +
                          "TIME COMPLEXITY\nO(n)\n\n" +
                          "POSSIBLE BUGS\nCould throw ArrayIndexOutOfBoundsException if the array is empty.\n\n" +
                          "IMPROVEMENTS\nCheck for null or empty array before looping.";
        }
        
        Label content = new Label(contentText);
        content.setWrapText(true);
        content.setStyle("-fx-font-size: 16px;");
        
        expCard.getChildren().addAll(expTitle, new Label(""), content);
        
        if (hintMode) {
            NeoButton revealBtn = new NeoButton("REVEAL SOLUTION");
            revealBtn.setOnAction(e -> generateExplanation(code, false));
            expCard.getChildren().addAll(new Label(""), revealBtn);
        }
        
        explanationContent.getChildren().add(expCard);
    }
}
