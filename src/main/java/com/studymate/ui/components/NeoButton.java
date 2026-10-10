package com.studymate.ui.components;

import javafx.scene.control.Button;

public class NeoButton extends Button {

    public NeoButton(String text) {
        super(text);
        getStyleClass().add("neo-button");
    }

    public void setActionStyle() {
        getStyleClass().add("neo-button-action");
    }
}
