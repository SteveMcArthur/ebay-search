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
    this.baseUrl = config.url || "https://svcs.ebay.com/services/search/FindingService/v1?";
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
    this.scriptId = config.scriptId || "ebay-url";
    this.buildURL();
};
Ebay.prototype.buildURL = function () {
    this.scriptURL = this.baseUrl +
        "SECURITY-APPNAME=" + this.security_appname +
        //"&OPERATION-NAME=findItemsByKeywords" +
        "&OPERATION-NAME=" + this.operation_name +
        "&SERVICE-VERSION=" + this.service_version +
        "&callback=" + this.callback +
        "&" + this.payload +
        "&keywords=" + this.keywords +
        "&categoryId=" + this.categoryId +
        "&sortOrder=" + this.sortOrder;
    this.itemFilters.forEach(function (filter, i) {
        this.scriptURL += "&itemFilter(" + i + ").name=" + filter.name;
        this.scriptURL += "&itemFilter(" + i + ").value=" + filter.value;
    }, this);

    if (this.paginationInput) {
        var prop;
        for (prop in this.paginationInput) {
            this.scriptURL += "&paginationInput." + prop + "=" + this.paginationInput[prop];
        }
    }
    this.URL += "&" + this.global_id;
    this.URL += "&siteid=" + this.siteid;
};

Ebay.prototype.findItemsAdvanced = function (keywords, categoryId) {
    this.operation_name = "findItemsAdvanced";
    this.keywords = keywords;
    if (categoryId) {
        this.categoryId = categoryId;
    }
    this.buildURL();
    this.fetchData();
};

Ebay.prototype.fetchData = function () {
    $('#' + this.scriptId).remove();
    $('body').append('<script id="' + this.scriptId + '" src="' + this.scriptURL + '"></script>');

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

Ebay.prototype.removeTimeWindow = function () {
    this.itemFilters.forEach(function (filter) {
        if ((filter.name !== "EndTimeFrom") && (filter.name !== "EndTimeTo")) {
            return true;
        }
        return false;
    }, this);
}