// =======================================================================================================
// IvrData.js
// =======================================================================================================
var IvrData = IvrData || {};

// -------------------------------------------------------------------------------------------
// Returns json data from the specified URL.
// -------------------------------------------------------------------------------------------
IvrData.getJson = function(url) {
    var retVal;
    $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        async: false,
        success: function(data) {
            retVal = data;
        },
        error: function(jqXHR) {
            throw new Error(jqXHR.responseJSON, jqXHR.status);
        }
    });
    return retVal;
};

IvrData.getNodeData = function () {
    return [
        { key: 1, question: "Greeting",
            actions: [
                { text: "Sales", figure: "ElectricalHazard", fill: "blue" },
                { text: "Parts and Services", figure: "FireHazard", fill: "red" },
                { text: "Representative", figure: "IrritationHazard", fill: "yellow" }
            ]
        },
        { key: 2, question: "Sales",
            actions: [
                { text: "Compact", figure: "ElectricalHazard", fill: "blue" },
                { text: "Mid-Size", figure: "FireHazard", fill: "red" },
                { text: "Large", figure: "IrritationHazard", fill: "yellow" }
            ]
        },
        { key: 3, question: "Parts and Services",
            actions: [
                { text: "Maintenance", figure: "ElectricalHazard", fill: "blue" },
                { text: "Repairs", figure: "FireHazard", fill: "red" },
                { text: "Inspection", figure: "IrritationHazard", fill: "yellow" }
            ]
        },
        { key: 4, question: "Representative",
            actions: [
                { text: "Manager", figure: "ElectricalHazard", fill: "blue" },
                { text: "Associate", figure: "FireHazard", fill: "red" }
            ]
        },
        { key: 5, question: "Compact" },
        { key: 6, question: "Mid-Size" },
        { key: 7, question: "Large",
            actions: [
                { text: "SUV", figure: "ElectricalHazard", fill: "blue" },
                { text: "Van", figure: "FireHazard", fill: "red" }
            ]
        },
        { key: 8, question: "Maintenance" },
        { key: 9, question: "Repairs" },
        { key: 10, question: "Inspection",
            actions: [
                { text: "Local", figure: "ElectricalHazard", fill: "blue" },
                { text: "State", figure: "FireHazard", fill: "red" }
            ]
        },
        { key: 11, question: "SUV" },
        { key: 12, question: "Van" },
        { key: 13, category: "Terminal", text: "Susan" },
        { key: 14, category: "Terminal", text: "Eric" },
        { key: 15, category: "Terminal", text: "Steven" },
        { key: 16, category: "Terminal", text: "Tom" },
        { key: 17, category: "Terminal", text: "Emily" },
        { key: 18, category: "Terminal", text: "Tony" },
        { key: 19, category: "Terminal", text: "Ken" },
        { key: 20, question: "Manager" , group: 24},
        { key: 21, question: "Associate" , group: 24},
        { key: 22, category: "Terminal", text: "Rachel", group: 24 },
        { key: 23, category: "Terminal", text: "Ronn", group: 24 },
        { key: 24, category: "Terminal", text: "Representatives", isGroup: true }
    ];
};

IvrData.getLinkData = function () {
    return [
        { from: 1, to: 2, answer: 1 },
        { from: 1, to: 3, answer: 2 },
        { from: 1, to: 4, answer: 3 },
        { from: 2, to: 5, answer: 1 },
        { from: 2, to: 6, answer: 2 },
        { from: 2, to: 7, answer: 3 },
        { from: 3, to: 8, answer: 1 },
        { from: 3, to: 9, answer: 2 },
        { from: 3, to: 10, answer: 3 },
        { from: 7, to: 11, answer: 1 },
        { from: 7, to: 12, answer: 2 },
        { from: 5, to: 13 },
        { from: 6, to: 14 },
        { from: 11, to: 15 },
        { from: 12, to: 16 },
        { from: 8, to: 17 },
        { from: 9, to: 18 },
        { from: 10, to: 19 },
        { from: 4, to: 20, answer: 1 },
        { from: 4, to: 21, answer: 2 },
        { from: 20, to: 22 },
        { from: 21, to: 23 }
    ];
};
