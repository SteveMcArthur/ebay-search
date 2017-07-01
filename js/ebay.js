/*global $*/
function Ebay(config) {
    var callbackName = "";
    if ($.type(config) === "string") {
        callbackName = config;
        config = {};
        config.callbackName = callbackName;
    }
    this.setParameters(config);
}

Ebay.prototype.setParameters = function (config) {
    this.url = config.url || "https://svcs.ebay.com/services/search/FindingService/v1?";
    this.security_appname = config.security_appname || "SteveMcA-9f89-4f43-8387-76544c4cb335";
    this.payload = config.payload || "REST-PAYLOAD";
    this.callback = config.callback || config.callbackName;
    this.service_version = "1.0.0&RESPONSE-DATA-FORMAT=JSON";
    this.sortOrder = config.sortOrder || "EndTimeSoonest";
    this.itemFilters = [];
    this.itemFilters.push({
        name: "LocatedIn",
        value: config.locatedIn || "GB"
    });

    this.itemFilters.push({
        name: "MaxPrice",
        value: config.maxPrice || 200
    });

    this.paginationInput = {
        entriesPerPage: config.entriesPerPage || 40
    };
    this.global_id = config.global_id || "GLOBAL-ID=EBAY-GB";
    this.siteid = config.siteid || 3;
};

Ebay.prototype.findItemsAdvanced = function (keywords, categoryId) {
    this.operation_name = "findItemsAdvanced";
    this.keywords = keywords;
    if (categoryId) {
        this.categoryId = categoryId;
    }
};

Ebay.prototype.setEndTimeWindow = function (from, to) {
    if (($.type(from) !== "date") || ($.type(to) !== "date")) {
        throw new Error("from or to must both be date objects");
    }

    this.itemFilters.push({
        name: "EndTimeFrom",
        value: from
    });
    this.itemFilters.push({
        name: "EndTimeTo",
        value: to
    });
};