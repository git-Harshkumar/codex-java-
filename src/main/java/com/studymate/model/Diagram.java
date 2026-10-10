package com.studymate.model;

public class Diagram {
    private String type; // e.g. "TREE", "LINKED_LIST"
    private String data; // text representation

    public Diagram() {}

    public Diagram(String type, String data) {
        this.type = type;
        this.data = data;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
}
