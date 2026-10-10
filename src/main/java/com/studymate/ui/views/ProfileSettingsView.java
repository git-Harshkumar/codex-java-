package com.studymate.ui.views;

import com.studymate.ui.DesignTokens;
import com.studymate.ui.components.NeoButton;
import com.studymate.ui.components.NeoCard;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TextField;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;

public class ProfileSettingsView extends VBox {

    public ProfileSettingsView() {
        setPadding(new Insets(20, 40, 40, 40));
        setSpacing(30);

        Label title = new Label("PROFILE & SETTINGS ⚙️");
        title.getStyleClass().add("heading-large");

        HBox mainContent = new HBox(40);

        // Profile Section
        VBox profileBox = new VBox(20);
        profileBox.setPrefWidth(400);

        NeoCard profileCard = new NeoCard(DesignTokens.LAVENDER);
        VBox profileContent = new VBox(15);
        
        Label nameLbl = new Label("HARSH KUMAR");
        nameLbl.setStyle("-fx-font-weight: 900; -fx-font-size: 24px;");
        Label roleLbl = new Label("Student");
        roleLbl.setStyle("-fx-font-weight: bold; -fx-font-size: 16px;");

        VBox prefBox = new VBox(10);
        prefBox.getChildren().addAll(
            createProfileRow("Learning Level", "Intermediate"),
            createProfileRow("Preferred Languages", "Java, C++, Python"),
            createProfileRow("Subjects", "DSA, Java, DBMS, OS, AI")
        );

        NeoButton editProfileBtn = new NeoButton("EDIT PROFILE");
        editProfileBtn.setStyle("-fx-background-color: " + DesignTokens.BLACK + "; -fx-text-fill: white;");

        profileContent.getChildren().addAll(nameLbl, roleLbl, new Label(""), prefBox, new Label(""), editProfileBtn);
        profileCard.getChildren().add(profileContent);

        profileBox.getChildren().addAll(new Label("USER PROFILE"), profileCard);

        // Settings Section
        VBox settingsBox = new VBox(20);
        HBox.setHgrow(settingsBox, Priority.ALWAYS);

        NeoCard settingsCard = new NeoCard(DesignTokens.WHITE);
        VBox settingsContent = new VBox(20);

        Label settingsLbl = new Label("APPLICATION SETTINGS");
        settingsLbl.setStyle("-fx-font-weight: 900; -fx-font-size: 18px;");

        GridPane grid = new GridPane();
        grid.setHgap(20);
        grid.setVgap(20);

        // AI Key
        Label aiKeyLbl = new Label("AI API Key");
        aiKeyLbl.setStyle("-fx-font-weight: bold;");
        PasswordField aiKeyInput = new PasswordField();
        aiKeyInput.getStyleClass().add("neo-input");
        aiKeyInput.setText("*****************");

        // DB Config
        Label dbUrlLbl = new Label("Database URL");
        dbUrlLbl.setStyle("-fx-font-weight: bold;");
        TextField dbUrlInput = new TextField("jdbc:mysql://localhost:3306/studymate");
        dbUrlInput.getStyleClass().add("neo-input");

        // Difficulty
        Label diffLbl = new Label("Default Difficulty");
        diffLbl.setStyle("-fx-font-weight: bold;");
        ComboBox<String> diffCombo = new ComboBox<>();
        diffCombo.getItems().addAll("Beginner", "Intermediate", "Advanced");
        diffCombo.setValue("Beginner");
        diffCombo.setStyle("-fx-background-color: white; -fx-border-color: #1A1A1A; -fx-border-width: 2px; -fx-border-radius: 100px; -fx-padding: 5 15;");

        grid.add(aiKeyLbl, 0, 0);
        grid.add(aiKeyInput, 1, 0);
        
        grid.add(dbUrlLbl, 0, 1);
        grid.add(dbUrlInput, 1, 1);
        
        grid.add(diffLbl, 0, 2);
        grid.add(diffCombo, 1, 2);

        NeoButton saveBtn = new NeoButton("SAVE SETTINGS");
        saveBtn.setActionStyle();

        settingsContent.getChildren().addAll(settingsLbl, grid, new Label(""), saveBtn);
        settingsCard.getChildren().add(settingsContent);

        settingsBox.getChildren().addAll(new Label("CONFIGURATION"), settingsCard);

        mainContent.getChildren().addAll(profileBox, settingsBox);

        ScrollPane scrollPane = new ScrollPane();
        scrollPane.setContent(mainContent);
        scrollPane.setFitToWidth(true);
        scrollPane.setStyle("-fx-background-color: transparent; -fx-background: " + DesignTokens.BACKGROUND + ";");
        VBox.setVgrow(scrollPane, Priority.ALWAYS);

        getChildren().addAll(title, scrollPane);
    }

    private VBox createProfileRow(String label, String value) {
        VBox row = new VBox(5);
        Label lbl = new Label(label);
        lbl.setStyle("-fx-font-weight: bold; -fx-text-fill: #555;");
        Label val = new Label(value);
        val.setStyle("-fx-font-weight: bold; -fx-font-size: 14px;");
        row.getChildren().addAll(lbl, val);
        return row;
    }
}
