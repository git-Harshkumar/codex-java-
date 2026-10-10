package com.studymate.ui.views;

import com.studymate.ui.DesignTokens;
import com.studymate.ui.components.NeoButton;
import com.studymate.ui.components.NeoCard;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TextField;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;

public class NotesView extends VBox {

    private FlowPane notesGrid;

    public NotesView() {
        setPadding(new Insets(20, 40, 40, 40));
        setSpacing(20);
        
        // Header
        HBox headerBox = new HBox(20);
        headerBox.setAlignment(Pos.CENTER_LEFT);
        
        Label title = new Label("STUDY NOTES 📚");
        title.getStyleClass().add("heading-large");
        
        HBox spacer = new HBox();
        HBox.setHgrow(spacer, Priority.ALWAYS);
        
        TextField searchInput = new TextField();
        searchInput.setPromptText("Search notes...");
        searchInput.getStyleClass().add("neo-input");
        searchInput.setPrefWidth(300);
        
        NeoButton newNoteBtn = new NeoButton("+ NEW NOTE");
        newNoteBtn.setActionStyle();
        
        headerBox.getChildren().addAll(title, spacer, searchInput, newNoteBtn);
        
        // Notes Grid
        notesGrid = new FlowPane(20, 20);
        
        // Add some dummy notes
        notesGrid.getChildren().addAll(
            createNoteCard("🌳 BINARY SEARCH TREE", "Important concepts about traversal...", new String[]{"JAVA", "DSA"}, "02 OCT 2026", DesignTokens.LAVENDER),
            createNoteCard("⚙️ OOP PRINCIPLES", "Encapsulation, Inheritance, Polymorphism...", new String[]{"JAVA"}, "01 OCT 2026", DesignTokens.WHITE),
            createNoteCard("🕸️ GRAPHS", "BFS vs DFS algorithms...", new String[]{"DSA"}, "28 SEP 2026", DesignTokens.YELLOW)
        );
        
        ScrollPane scrollPane = new ScrollPane();
        scrollPane.setContent(notesGrid);
        scrollPane.setFitToWidth(true);
        scrollPane.setStyle("-fx-background-color: transparent; -fx-background: " + DesignTokens.BACKGROUND + ";");
        VBox.setVgrow(scrollPane, Priority.ALWAYS);
        
        getChildren().addAll(headerBox, scrollPane);
    }
    
    private NeoCard createNoteCard(String title, String summary, String[] tags, String date, String color) {
        NeoCard card = new NeoCard(color);
        card.setPrefWidth(320);
        card.setPrefHeight(200);
        
        Label titleLbl = new Label(title);
        titleLbl.setStyle("-fx-font-weight: 900; -fx-font-size: 18px;");
        
        Label summaryLbl = new Label(summary);
        summaryLbl.setWrapText(true);
        summaryLbl.setStyle("-fx-font-size: 14px;");
        summaryLbl.setPrefHeight(60); // limit height
        
        HBox tagsBox = new HBox(8);
        for (String tag : tags) {
            Label tagLbl = new Label(tag);
            tagLbl.setStyle("-fx-background-color: " + DesignTokens.BLACK + "; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 10px; -fx-padding: 4 8; -fx-background-radius: 100;");
            tagsBox.getChildren().add(tagLbl);
        }
        
        HBox spacer = new HBox();
        VBox.setVgrow(spacer, Priority.ALWAYS);
        
        Label dateLbl = new Label(date);
        dateLbl.setStyle("-fx-font-weight: bold; -fx-font-size: 12px; -fx-text-fill: #555;");
        
        VBox content = new VBox(10, titleLbl, summaryLbl, tagsBox, spacer, dateLbl);
        content.setPrefHeight(200);
        card.getChildren().add(content);
        
        return card;
    }
}
