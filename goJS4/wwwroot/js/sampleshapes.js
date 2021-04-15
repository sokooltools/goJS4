$(document).ready(function () {
    init();
});

var myDiagram;

function init() {
      //if (window.goSamples) 
      //    goSamples();  // init for these samples -- you don't need to call this

      const $ = go.GraphObject.make;  // For conciseness in defining templates

      myDiagram =
        $(go.Diagram, "myDiagramDiv",  // Create the Diagram for the HTML DIV element
          {
            layout: $(go.GridLayout, { sorting: go.GridLayout.Forward }), // Use a GridLayout
            padding: new go.Margin(5, 5, 25, 5) // To see the names of shapes on the bottom row
          });

      // Names of the built in shapes, which we will color green instead of pink.
      // The pinks shapes are instead defined in the "../extensions/Figures.js" file.
      var builtIn = ["Rectangle", "Square", "RoundedRectangle", "Border", "Ellipse", "Circle", "TriangleRight", "TriangleDown", 
          "TriangleLeft", "TriangleUp", "Triangle", "Diamond", "LineH", "LineV", "None", "BarH", "BarV", "MinusLine", "PlusLine", "XLine"];
      
      function isBuiltIn(shapeName) {
        return builtIn.indexOf(shapeName) >= 0;
      }

      myDiagram.nodeTemplate =
        $(go.Node, "Vertical",
          {
            mouseEnter: function(e, node) { node.isHighlighted = true; },
            mouseLeave: function(e, node) { node.isHighlighted = false; },
            locationSpot: go.Spot.Center,  // the location is the center of the Shape.
            locationObjectName: "SHAPE",
            selectionAdorned: false,  // no selection handle when selected
            resizable: true, resizeObjectName: "SHAPE",  // user can resize the Shape.
            rotatable: true, rotateObjectName: "SHAPE",  // rotate the Shape without rotating the label.
            // Don't re-layout when node changes size
            layoutConditions: go.Part.LayoutStandard & ~go.Part.LayoutNodeSized
          },
          new go.Binding("layerName", "isHighlighted", function(h) { return h ? "Foreground" : ""; }).ofObject(),
          $(go.Shape,
            {
              name: "SHAPE",  // Named so that the above properties can refer to this GraphObject.
              width: 70, height: 70,
              strokeWidth: 3
            },
            // Color the built in shapes green, and the figures.js shapes Pink.
            new go.Binding("fill", "key", function(k) {
              return isBuiltIn(k) ? "palegreen" : "lightpink";
            }),
            new go.Binding("stroke", "key", function(k) {
              return isBuiltIn(k) ? "darkgreen" : "#C2185B";
            }),
            // Bind the Shape.figure to the figure name, which automatically gives the Shape a Geometry.
            new go.Binding("figure", "key")),
          $(go.TextBlock,  // the label
            {
              margin: 4,
              font: "bold 18px sans-serif",
              background: "white"
            },
            new go.Binding("visible", "isHighlighted").ofObject(),
            new go.Binding("text", "key"))
        );

      // Initialize the model
      myDiagram.model.nodeDataArray = go.Shape.getFigureGenerators().toArray();
    }