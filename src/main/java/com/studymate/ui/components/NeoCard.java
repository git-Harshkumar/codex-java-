package com.studymate.ui.components;

import javafx.scene.layout.VBox;

public class NeoCard extends VBox {

    public NeoCard() {
        super();
        getStyleClass().add("neo-card");
    }

    public NeoCard(String backgroundColor) {
        this();
        setStyle("-fx-background-color: " + backgroundColor + ";");
    }
}
