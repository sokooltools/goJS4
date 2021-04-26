// =======================================================================================================
// ivr.js
// =======================================================================================================
// ReSharper disable PossiblyUnassignedProperty
var IvrData = window.IvrData;

var myDiagram;

window.onload = function () {
    init();
    bindEvents();
    enableTooltips();
    doSelect();
};

function init() {
    var $ = go.GraphObject.make; // For conciseness in defining templates

    var bluegrad = $(go.Brush, "Radial", { 0: "#C4ECFF", 1: "#658290" });
    var greengrad = $(go.Brush, "Linear", { 0: "#B1E2A5", 1: "#9c9c3c" });

    // Each action is represented by a shape and some text
    var actionTemplate =
        $(go.Panel,
            "Horizontal",
            $(go.Shape,
                { width: 12, height: 12 },
                new go.Binding("figure"),
                new go.Binding("fill")
            ),
            $(go.TextBlock,
                {
                    font: "10pt Verdana, sans-serif",
                    editable: true,
                    isMultiline: false
                },
                new go.Binding("text").makeTwoWay()
            )
        );

    // A context menu is an Adornment with a bunch of buttons in them
    var partContextMenu =
        $("ContextMenu",
            makeButton("Cut",
                function (e, obj) { e.diagram.commandHandler.cutSelection(); },
                function (o) { return o.diagram.commandHandler.canCutSelection(); }),
            makeButton("Copy",
                function (e, obj) { e.diagram.commandHandler.copySelection(); },
                function (o) { return o.diagram.commandHandler.canCopySelection(); }),
            makeButton("Paste",
                function (e, obj) { e.diagram.commandHandler.pasteSelection(e.diagram.toolManager.contextMenuTool.mouseDownPoint); },
                function (o) { return o.diagram.commandHandler.canPasteSelection(o.diagram.toolManager.contextMenuTool.mouseDownPoint); }),
            makeButton("Delete",
                function (e, obj) { e.diagram.commandHandler.deleteSelection(); },
                function (o) { return o.diagram.commandHandler.canDeleteSelection(); }),
            makeButton("Undo",
                function (e, obj) { e.diagram.commandHandler.undo(); },
                function (o) { return o.diagram.commandHandler.canUndo(); }),
            makeButton("Redo",
                function (e, obj) { e.diagram.commandHandler.redo(); },
                function (o) { return o.diagram.commandHandler.canRedo(); }),
            makeButton("Group",
                function (e, obj) { e.diagram.commandHandler.groupSelection(); },
                function (o) { return o.diagram.commandHandler.canGroupSelection(); }),
            makeButton("Ungroup",
                function (e, obj) { e.diagram.commandHandler.ungroupSelection(); },
                function (o) { return o.diagram.commandHandler.canUngroupSelection(); }),
            makeButton("Expand Tree",
                function (e, obj) { e.diagram.commandHandler.expandTree(); },
                function (o) { return o.diagram.commandHandler.canExpandTree(); }),
            makeButton("Collapse Tree",
                function (e, obj) { e.diagram.commandHandler.collapseTree(); },
                function (o) { return o.diagram.commandHandler.canCollapseTree(); }),
            makeButton("Add Question Node",
                function (e, obj) { addQuestionNode(e, obj); },
                function (o) { return canAddQuestionNode(o); }),
            makeButton("Add Terminal Node",
                function (e, obj) { addTerminalNode(e, obj); },
                function (o) { return canAddTerminalNode(o); }),
            makeButton("Properties",
                function (e, obj) { showProperties(obj.part); }) // (obj is this button). The Button is in the context menu Adornment.
        );

    myDiagram =
        $(go.Diagram,
            "myDiagramDiv",
            {
                //initialAutoScale: go.Diagram.Uniform,
                click: itemClicked,
                allowClipboard: true,
                allowCopy: true,
                allowDelete: true,
                allowGroup: true,
                isReadOnly: false,
                minScale: 0.25,
                maxScale: 5,
                "draggingTool.dragsTree": true,
                "commandHandler.deletesTree": true,
                //scrollMargin: 20,          // allow some empty space to appear when scrolled to the edge of the document
                scaleComputation: scalefunc, // This sets the scale incrementation to 0.25
                layout:
                    $(go.TreeLayout,
                        {
                            angle: 90,
                            arrangement: go.TreeLayout.ArrangementFixedRoots
                        }),
                "undoManager.isEnabled": true
                //,contextMenu: partContextMenu
            });

    myDiagram.toolManager.dragSelectingTool = new RealtimeDragSelectingTool();

    // Replace the standard DragSelectingTool with one that selects while dragging,
    // and also only requires overlapping bounds with the dragged box to be selected
    myDiagram.dragSelectingTool =
        $(RealtimeDragSelectingTool,
            { isPartialInclusion: true, delay: 50 },
            {
                box: $(go.Part, // replace the magenta box with a red one
                    { layerName: "Tool", selectable: false },
                    $(go.Shape,
                        {
                            name: "SHAPE",
                            fill: "rgba(255,0,0,0.1)",
                            stroke: "red",
                            strokeWidth: 2
                        }))
            }
        );

    // Each regular Node has body consisting of a title followed by a collapsible list of actions,
    // controlled by a PanelExpanderButton, with a TreeExpanderButton underneath the body
    myDiagram.nodeTemplate = // The default node template
        $(go.Node,
            "Vertical",
            new go.Binding("isTreeExpanded").makeTwoWay(), // Remember the expansion state for when the model is re-loaded
            new go.Binding("wasTreeExpanded").makeTwoWay(),
            { selectionObjectName: "BODY" },
            // The main "BODY" consists of a RoundedRectangle surrounding nested Panels
            $(go.Panel,
                "Auto",
                {
                    name: "BODY",
                    click: itemClicked,
                    doubleClick: itemClicked,
                    contextMenu: partContextMenu
                },
                $(go.Shape,
                    "Rectangle",
                    {
                        name: "SHAPE",
                        fill: bluegrad,
                        stroke: null
                    }
                ),
                $(go.Panel,
                    "Vertical",
                    { margin: 3 },
                    // The title
                    $(go.TextBlock,
                        {
                            name: "TitleText",
                            font: "bold 10pt Verdana, sans-serif",
                            stretch: go.GraphObject.Horizontal,
                            editable: true,
                            isMultiline: false, // Don't allow newlines in text.
                            margin: 2,
                            textAlign: "center",
                            alignment: go.Spot.Center,
                            overflow: go.TextBlock.OverflowEllipsis,
                            textValidation: (tb, olds, news) =>
                                news.length <= 16, // New string must be less than or equal to 16.
                            errorFunction: function (tool, olds, news) {
                                showError(tool, olds, news, 16);
                            },
                            textEdited: function (tb, olds, news) {
                                const mgr = tb.diagram.toolManager;
                                mgr.hideToolTip();
                            }
                        },
                        new go.Binding("text", "question").makeTwoWay() //  change "question" to "key" to see effect!
                    ),
                    // The optional list of actions
                    $(go.Panel,
                        "Vertical",
                        {
                            stretch: go.GraphObject.Horizontal,
                            visible: false
                        }, // Not visible unless there is more than one action.
                        new go.Binding("visible", "actions",
                            function (acts) {
                                return (Array.isArray(acts) && acts.length > 0);
                            }),
                        // Headered by a label and a PanelExpanderButton inside a Table
                        $(go.Panel,
                            "Table",
                            {
                                stretch: go.GraphObject.Horizontal
                            },
                            $(go.TextBlock,
                                "Choices",
                                {
                                    alignment: go.Spot.Left,
                                    font: "10pt Verdana, sans-serif"
                                }
                            ),
                            $("PanelExpanderButton",
                                "COLLAPSIBLE", // Name of the object to make visible or invisible
                                {
                                    column: 1,
                                    alignment: go.Spot.Right
                                }
                            )
                        ), // end Table panel
                        // With the list data bound in the Vertical Panel
                        $(go.Panel,
                            "Vertical",
                            {
                                name: "COLLAPSIBLE", // Identify to the PanelExpanderButton
                                padding: 2,
                                stretch: go.GraphObject.Horizontal, // Take up whole available width
                                background: "white", // To distinguish from the node's body
                                defaultAlignment: go.Spot.Left, // Thus no need to specify alignment on each element
                                itemTemplate: actionTemplate // the Panel created for each item in Panel.itemArray
                            },
                            new go.Binding("itemArray", "actions") // Bind Panel.itemArray to nodedata.actions
                        ) // end action list Vertical Panel
                    ) // end optional Vertical Panel
                ) // end outer Vertical Panel
            ), // end "BODY"  Auto Panel
            $(go.Panel, // This is underneath the "BODY"
                { height: 17 }, // Always this height, even if the TreeExpanderButton is not visible
                $("TreeExpanderButton")
            )
        );

    // Define a second kind of Node:
    myDiagram.nodeTemplateMap.add("Terminal",
        $(go.Node,
            "Spot",
            {
                click: itemClicked,
                doubleClick: itemClicked,
                contextMenu: partContextMenu
            },
            $(go.Shape,
                "Circle",
                {
                    width: 55,
                    height: 55,
                    fill: greengrad,
                    stroke: null
                }
            ),
            $(go.TextBlock,
                "TerminalTextBlock",
                {
                    font: "10pt Verdana, sans-serif",
                    editable: true,
                    isMultiline: false, // Don't allow newlines in text.
                    width: 55,
                    margin: 2,
                    textAlign: "center",
                    alignment: go.Spot.Center,
                    overflow: go.TextBlock.OverflowEllipsis,
                    textValidation: (tb, olds, news) =>
                        news.length <= 16, // New string must be less than or equal to 16.
                    errorFunction: function (tool, olds, news) {
                        showError(tool, olds, news, 16);
                    },
                    textEdited: function (tb, olds, news) {
                        const mgr = tb.diagram.toolManager;
                        mgr.hideToolTip();
                    }
                },
                new go.Binding("text").makeTwoWay()
            )
        )
    );

    myDiagram.linkTemplate =
        $(go.Link,
            "Link",
            {
                click: itemClicked,
                doubleClick: itemClicked,
                contextMenu: partContextMenu
            },
            go.Link.Orthogonal,
            {
                deletable: true,
                corner: 10
            },
            $(go.Shape,
                { strokeWidth: 2 }
            ),
            $(go.TextBlock,
                go.Link.OrientUpright,
                {
                    background: "white",
                    visible: false, // Unless the binding sets it to true for a non-empty string
                    segmentIndex: -2,
                    segmentOrientation: go.Link.None
                },
                new go.Binding("text", "answer"),
                // Hide empty string;
                // if the "answer" property is undefined, visible is false due to above default setting.
                new go.Binding("visible", "answer", function (a) { return (a ? true : false); })
            )
        );

    // Define the appearance and behavior for Groups:
    // Groups consist of a title in the color given by the group node data
    // above a translucent gray rectangle surrounding the member parts
    myDiagram.groupTemplate =
        $(go.Group, "Vertical",
            {
                selectionObjectName: "PANEL",  // Selection handle goes around shape, not label
                ungroupable: true  // Enable Ctrl-Shift-G to ungroup a selected Group
            },
            $(go.TextBlock,
                {
                    //alignment: go.Spot.Right,
                    font: "bold 19px sans-serif",
                    isMultiline: false,  // Don't allow newlines in text
                    editable: true  // Allow in-place editing by user
                },
                new go.Binding("text", "text").makeTwoWay(),
                new go.Binding("stroke", "color")),
            $(go.Panel, "Auto",
                { name: "PANEL" },
                $(go.Shape, "Rectangle",  // the rectangular shape around the members
                    {
                        fill: "rgba(128,128,128,0.2)", stroke: "gray", strokeWidth: 3,
                        portId: "", cursor: "pointer",  // the Shape is the port, not the whole Node
                        // Allow all kinds of links from and to this port
                        fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
                        toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true
                    }),
                $(go.Placeholder, { margin: 10, background: "transparent" })  // Represents where the members are
            ),
            { // This tooltip Adornment is shared by all groups.
                toolTip:
                    $("ToolTip",
                        $(go.TextBlock, { margin: 4 },
                            // Bind to tooltip, not to Group.data, to allow access to Group properties.
                            new go.Binding("text", "", groupInfo).ofObject())
                    ),
                // The same context menu Adornment is shared by all groups.
                contextMenu: partContextMenu
            }
        );

    // Provide a context menu for the background of the Diagram, when not over any Part.
    myDiagram.contextMenu =
        $("ContextMenu",
            makeButton("Paste",
                function (e, obj) { e.diagram.commandHandler.pasteSelection(e.diagram.toolManager.contextMenuTool.mouseDownPoint); },
                function (o) { return o.diagram.commandHandler.canPasteSelection(o.diagram.toolManager.contextMenuTool.mouseDownPoint); }),
            makeButton("Undo",
                function (e, obj) { e.diagram.commandHandler.undo(); },
                function (o) { return o.diagram.commandHandler.canUndo(); }),
            makeButton("Redo",
                function (e, obj) { e.diagram.commandHandler.redo(); },
                function (o) { return o.diagram.commandHandler.canRedo(); })
        );

    var nodeDataArray = IvrData.getNodeData();

    var linkDataArray = IvrData.getLinkData();

    // Create the Model with the above data, and assign to the diagram.
    myDiagram.model = $(go.GraphLinksModel,
        {
            copiesArrays: true,
            copiesArrayObjects: true,
            nodeDataArray: nodeDataArray,
            linkDataArray: linkDataArray
        });

    // When the document is modified, add a "*" to the title and enable the "Save" button.
    myDiagram.addDiagramListener("Modified",
        function () {
            const button = document.getElementById("SaveButton");
            if (button) button.disabled = !myDiagram.isModified;
            const idx = document.title.indexOf("*");
            if (myDiagram.isModified) {
                if (idx < 0) document.title += "*";
            } else {
                if (idx >= 0) document.title = document.title.substr(0, idx);
            }
        });

    myDiagram.addModelChangedListener(function (evt) {
        // Ignore unimportant Transaction events
        if (!evt.isTransactionFinished)
            return;
        const txn = evt.object; // a Transaction
        if (!txn)
            return;
        // Iterate over all of the actual ChangedEvents of the Transaction
        txn.changes.each(function (e) {
            if (e.modelChange === "")
                return;
            if (e.change === go.ChangedEvent.Property) {
                if (e.modelChange === "linkFromKey") {
                    console.log(evt.propertyName + " changed From key of link: " + e.object + " from: " + e.oldValue + " to: " + e.newValue);
                } else if (e.modelChange === "linkToKey") {
                    console.log(evt.propertyName + " changed To key of link: " + e.object + " from: " + e.oldValue + " to: " + e.newValue);
                }
            } else if (e.change === go.ChangedEvent.Insert) {
                if (e.modelChange === "linkDataArray")
                    console.log(evt.propertyName + " added link from: " + e.newValue.from + " to: " + e.newValue.to);
                else
                    console.log(evt.propertyName + " added node with key: " + e.newValue.key);
            } else if (e.change === go.ChangedEvent.Remove) {
                if (e.modelChange === "linkDataArray")
                    console.log(evt.propertyName + " removed link from: " + e.oldValue.from + " to: " + e.oldValue.to);
                else
                    console.log(evt.propertyName + " removed node with key: " + e.oldValue.key);
            }
        });
    });

    myDiagram.addDiagramListener("ChangedSelection",
        function () {
            var msg = "";
            const part = myDiagram.selection.first();
            if (!part)
                msg = "";
            else if (part instanceof go.Node) {
                msg = `[Node key: ${part.data.key} ${part.data.question ? `question: "${part.data.question}"` : `text: "${part.data.text}"`}]`;
                document.getElementById("keyField").value = part.data.key;
            } else if (part.isTreeLink) {
                msg = `[Link from: ${part.data.from} to: ${part.data.to}]`;
            }
            document.getElementById("outputLabel").textContent = msg;

            //const idrag = document.getElementById("infoDraggable");
            //idrag.style.width = "";
            //idrag.style.height = "";

        });

    myDiagram.addDiagramListener("ViewportBoundsChanged",
        function () {
            scaleSlider.value = scaleField.valueAsNumber = parseFloat(myDiagram.scale.toFixed(2));
        });

    // Provide a tooltip for the background of the Diagram, when not over any Part.
    myDiagram.toolTip =
        $("ToolTip",
            $(go.TextBlock, { margin: 4 },
                new go.Binding("text", "", diagramInfo))
        );
};

function showError(tool, olds, news, len) {
    // Create and show tooltip about why editing failed for this textblock.
    const mgr = tool.diagram.toolManager;
    mgr.hideToolTip();  // Hide any currently showing tooltip.
    const node = tool.textBlock.part;
    // Create a GoJS tooltip, which is an Adornment.
    const tt = go.GraphObject.make("ToolTip",
        {
            "Border.fill": "pink",
            "Border.stroke": "red",
            "Border.strokeWidth": 2
        },
        go.GraphObject.make(go.TextBlock,
            `Unable to replace the string '${olds}' with '${news}' on node '${node.key}'
            because the new string cannot contain more than ${len} characters.`));
    mgr.showToolTip(tt, node);
}

// Define the appearance and behavior for Nodes:
// First, define the shared context menu for all Nodes, Links, and Groups.
// To simplify this code define a function for creating a context menu button:
function makeButton(text, action, visiblePredicate) {
    return go.GraphObject.make("ContextMenuButton",
        go.GraphObject.make(go.TextBlock, { text: text, font: "9pt Verdana, sans-serif", margin: 2, stretch: go.GraphObject.Horizontal }), // can use  width: 90
        {
            click: action
        },
        // Don't bind GraphObject.visible if there's no predicate
        visiblePredicate ? new go.Binding("visible", "",
            function (o, e) { return o.diagram ? visiblePredicate(o, e) : false; }).ofObject() : {});
}

function scalefunc(diagram, scale) {
    const oldscale = diagram.scale;
    if (scale > oldscale) {
        return oldscale + 0.25;
    } else if (scale < oldscale) {
        return oldscale - 0.25;
    }
    return oldscale;
};

function groupInfo(contextmenu) {  // Takes the tooltip or context menu, not a group node data object
    const ap = contextmenu.adornedPart;  // Get the Group that the tooltip adorns
    const mems = ap.memberParts.count;
    var links = 0;
    ap.memberParts.each(function (part) {
        if (part instanceof go.Link) links++;
    });
    return `Group ${ap.part.data.key}: ${ap.part.data.text}\n${mems} members including the ${links} links`;
}

// Define the behavior for the Diagram background:
function diagramInfo(model) {  // Tooltip info for the diagram's model
    return `Model:\n${model.nodeDataArray.length} nodes, ${model.linkDataArray.length} links`;
};

function showProperties(contextmenu) {
    var msg = "";
    const ap = contextmenu.adornedPart;  // The adornedPart is the Part that the context menu adorns
    if (ap instanceof go.Group) {
        msg = groupInfo(contextmenu);
    } else {
        myDiagram.selection.each(function (part) {
            if (part instanceof go.Node) {
                msg += `[Node key: ${lpad(part.data.key)}, ${part.data.question ? `question: "${part.data.question}"` : `text: "${part.data.text}"`}`;
                msg += part.data.group ? ` (member of Group ${part.data.group})` : "";
                msg += "]\n";
            } else if (part.isTreeLink) {
                msg += `[Link from ${lpad(part.data.from)} to ${lpad(part.data.to)}]\n`;
            }
        });
        msg = msg.replace(new RegExp(`[${"\n"}]+$`), ""); // Remove last newline character.
        msg = msg.split(/\n/).sort(); // Create array from the string, then sort it.
        msg = msg.join("\n"); // Reconstruct the string from the array.
    }
    document.getElementById("eventLabel").textContent = "";
    document.getElementById("outputLabel").textContent = `Properties:\r\n----------------------------------\r\n${msg}`;
}

function lpad(num) {
    return num <= 9 ? ` ${num}` : num;
}

function itemClicked(e, obj) { // Executed by click and doubleclick handlers.
    const evt = e.copy();
    const typ = evt.clickCount === 2 ? "<Double-Clicked>" : "<Clicked>";
    const part = obj ? obj.part : null;
    if (!part)
        updateControls("", "");
    else if (part instanceof go.Node) {
        updateControls(part.data.key, typ);
    } else if (part.isTreeLink) {
        updateControls("", typ);
    }
    function updateControls(key, type) {
        document.getElementById("eventLabel").textContent = type;
        document.getElementById("keyField").value = key;
    };
};

function canAddQuestionNode(obj) {
    const part = obj.adornedPart.part;
    return (myDiagram.selection.count === 1
        && part instanceof go.Node
        && part.data.question !== undefined
        && part.data.actions !== undefined);
};

function addQuestionNode(e, obj) {
    const selnode = obj.part; // myDiagram.selection.first();
    myDiagram.commit(function (d) {
        const newaction = { text: "New Question", figure: "SevenPointedStar", fill: "pink" };
        //selnode.actions.addNodeData(newaction);

        // Add a new node to the Model data
        const newnode = {
            key: getMaxKey() + 1, question: "New Question",
            actions: [
                { text: "New Choice", figure: "ElectricalHazard", fill: "blue" }
            ]
        }
        d.model.addNodeData(newnode); // Makes sure the key is unique.
        // Add a link data connecting the original node with the new one.
        const newlink = { from: selnode.data.key, to: newnode.key };
        // Add the new link to the model.
        d.model.addLinkData(newlink);
    }, "add node and link");
};

function canAddTerminalNode(obj) {
    const part = obj.adornedPart.part;
    return (myDiagram.selection.count === 1
        && part instanceof go.Node
        && part.data.question !== undefined
        && part.data.actions === undefined);
};

function addTerminalNode(e, obj) {
    const selnode = obj.part; // myDiagram.selection.first();
    myDiagram.commit(function (d) {
        // Add a new node to the Model data
        const newnode = { key: getMaxKey() + 1, category: "Terminal", text: "New" };
        d.model.addNodeData(newnode); // Makes sure the key is unique.
        // Add a link data connecting the original node with the new one.
        const newlink = { from: selnode.data.key, to: newnode.key };
        // Add the new link to the model.
        d.model.addLinkData(newlink);
    }, "add node and link");
};

function getMaxKey() {
    const maxKey = myDiagram.model.nodeDataArray.reduce((accObj, currentObj) =>
        accObj.key > currentObj.key ? accObj : currentObj, 0
    ).key;
    return maxKey;
}

function doSave() {
    const json = myDiagram.model.toJson();
    document.getElementById("eventLabel").textContent = "";
    document.getElementById("outputLabel").textContent = `${json}`;
    document.getElementById("SaveButton").disabled = !myDiagram.isModified;;
};

function enableTooltips() {
    window.jQuery('[data-toggle="tooltip"]').tooltip(document.getElementById("enableTooltips").checked ? "enable" : "disable");
    // const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'));
    // var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    //     return new bootstrap.Tooltip(tooltipTriggerEl);
    // });
};

/* Key and Scale field select
-------------------------------------------------- */
function bindEvents() {
    document.getElementById("keyField").onkeyup = function () { doSelect(); }; // Needed for arrowkey press to work.
    document.getElementById("keyField").onmouseup = function () { doSelect(); }; // Needed for arrowkey buttons to work.
    document.getElementById("scaleField").onkeyup = function () { doScale(); };
    document.getElementById("scaleField").onmouseup = function () { doScale(); };
};

function handleKeyKeyPress(e) {
    if (e.keyCode !== 13)
        return;
    e.preventDefault(); // Ensure it is only this code that runs
    doSelect();
};

// Selects the node programmatically, rather than clicking interactively:
function doSelect() {
    const key = parseInt(document.getElementById("keyField").valueAsNumber, 10);
    const node = myDiagram.findNodeForKey(key);
    myDiagram.select(node);
    if (!isInViewport(node))
        myDiagram.commandHandler.scrollToPart(node);
};

/* Scale Slider
-------------------------------------------------- */
var scaleSlider = document.getElementById("scaleSlider");
var scaleField = document.getElementById("scaleField");

// Update the diagram's scale and current slider value each time the slider handle is dragged.
scaleSlider.oninput = function () {
    scaleField.valueAsNumber = myDiagram.scale = parseFloat(this.value);
}

function handleScaleKeyPress(e) {
    if (e.keyCode !== 13) return;
    e.preventDefault();
    doScale();
};

function doScale() {
    if (scaleField.value) {
        myDiagram.scaleComputation = null;
        scaleSlider.value = myDiagram.scale = parseFloat(scaleField.value);
        myDiagram.scaleComputation = scalefunc;
    }
};

/* -------------------------------------------------- */
function doAutoFit() {
    myDiagram.scaleComputation = null;
    myDiagram.zoomToFit();
    myDiagram.scaleComputation = scalefunc;
};

function doDownloadImage() {
    const blob = myDiagram.makeImageData({ background: "white", returnType: "blob", callback: completeDownload });
}

// When the blob is complete, make an anchor tag for it and use the tag to initiate a download
// Works in Chrome, Firefox, Safari, Edge, IE11
function completeDownload(blob) {
    var url = window.URL.createObjectURL(blob);
    const filename = `IVR_Tree-${getFormattedDateTime()}.png`;
    var a = document.createElement("a");
    a.style = "display: none";
    a.href = url;
    a.download = filename;
    // For IE 11
    if (window.navigator.msSaveBlob !== undefined) {
        window.navigator.msSaveBlob(blob, filename);
        return;
    }
    document.body.appendChild(a);
    requestAnimationFrame(function () {
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });
}

function appendLeadingZeroes(n) {
    return n <= 9 ? `0${n}` : n;
}

function getFormattedDateTime() {
    const dt = new Date();
    return dt.getFullYear() +
        "-" +
        appendLeadingZeroes(dt.getMonth() + 1) +
        "-" +
        appendLeadingZeroes(dt.getDate()) +
        " " +
        appendLeadingZeroes(dt.getHours()) +
        ":" +
        appendLeadingZeroes(dt.getMinutes()) +
        ":" +
        appendLeadingZeroes(dt.getSeconds());
}

function isInViewport(node) {
    // TODO:
    //const loc = node.actualBounds;
    //var docloc = myDiagram.transformDocToView(node.location);
    return false;
}

// ReSharper restore PossiblyUnassignedProperty

//window.animateNone = function () {
//    window.custom = false;
//    myDiagram.animationManager.initialAnimationStyle = go.AnimationManager.None;
//    myDiagram.model = go.Model.fromJSON(diagram.model.toJSON());
//};

//function mouseEnter(e, obj) {
//    var shape = obj.findObject("SHAPE");
//    shape.fill = "#6DAB80";
//    shape.stroke = "#A6E6A1";
//    var text = obj.findObject("TEXT");
//    text.stroke = "white";
//};

//function mouseLeave(e, obj) {
//    var shape = obj.findObject("SHAPE");
//    // Return the Shape's fill and stroke to the defaults
//    shape.fill = obj.data.color;
//    shape.stroke = null;
//    // Return the TextBlock's stroke to its default
//    var text = obj.findObject("TEXT");
//    text.stroke = "black";
//};
