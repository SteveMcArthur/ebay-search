/*global $, document, clearInterval, setInterval, window*/
var _cb_findItemsByKeywords;
$(function () {
    var rootName = "findItemsAdvancedResponse";
    var now = new Date();
    var oneDay = 24 * 60 * 60 * 1000;
    var dayOfWeek = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
    var unholy = false;
    var typeOfListing = {
        "StoreInventory": "Store Inventory",
        "FixedPrice": "Fixed Price"
    }
    var currency = {
        "GBP": "£",
        "EUR": "€",
        "USD": "$",
        "AUD": "AU$"
    };

    var win = $('.main');

    function resizeSidebar() {
        var ht = win.height();
        $('.sidebar').height(ht);
    }

    var ebayURL;

    function resetEbayURL() {
        if (unholy) {
            var dt = now;
            var hr = dt.getHours();
            //set to next day if after 4am
            if (hr > 4) {
                dt = new Date(dt.getTime() + oneDay);
            }
            hr = dt.getHours();
            var yr = dt.getFullYear();
            var mon = dt.getMonth();
            var day = dt.getDate();
            var amStart = new Date(yr, mon, day, 0);
            var amEnd = new Date(yr, mon, day, 6);
        }
        ebayURL = "https://svcs.ebay.com/services/search/FindingService/v1?" +
            "SECURITY-APPNAME=SteveMcA-9f89-4f43-8387-76544c4cb335" +
            //"&OPERATION-NAME=findItemsByKeywords" +
            "&OPERATION-NAME=findItemsAdvanced" +
            "&SERVICE-VERSION=1.0.0&RESPONSE-DATA-FORMAT=JSON" +
            "&callback=_cb_findItemsByKeywords" +
            "&REST-PAYLOAD" +
            "&keywords=iPhone 6" +
            "&categoryId=9355" +
            "&sortOrder=EndTimeSoonest" +
            "&itemFilter(0).name=LocatedIn" +
            "&itemFilter(0).value=GB" +
            "&itemFilter(1).name=MaxPrice" +
            "&itemFilter(1).value=200";
        if (unholy) {
            ebayURL += "&itemFilter(2).name=EndTimeFrom" +
                "&itemFilter(2).value=" + amStart.toISOString() +
                "&itemFilter(3).name=EndTimeTo" +
                "&itemFilter(3).value=" + amEnd.toISOString();
        }
        ebayURL += "&paginationInput.entriesPerPage=40" +
            "&GLOBAL-ID=EBAY-GB&siteid=3";


    }


    //win.resize(resizeSidebar);

    function normalizeTrailingZeros(value) {
        var k = value.indexOf(".");
        if ((value.length - k) < 3) {
            value += "0";
        }
        return value;
    }
    var rowEl = $('tbody > tr');
    var tbody = $('tbody');
    var sideUl = $('.sidebar ul');
    var daysReg = /^P(\d\d?)D/;
    var hoursReg = /DT(\d\d?)H/;
    var minsReg = /H(\d\d?)M/;
    var secsReg = /M(\d\d?)S/;

    function getValue(item, prop) {
        return (item[prop]) ? item[prop][0] : null;
    }

    function getTimeLeft(listingInfo, sellingStatus) {
        var endTime = new Date(listingInfo.endTime[0]);
        var timeLeft = sellingStatus.timeLeft[0];
        var temp = daysReg.exec(timeLeft);
        var days = (temp) ? temp[1] : '';
        temp = hoursReg.exec(timeLeft);
        var hours = (temp) ? temp[1] : '';
        temp = minsReg.exec(timeLeft);
        var mins = (temp) ? temp[1] : '';
        temp = secsReg.exec(timeLeft);
        var secs = (temp) ? temp[1] : '';
        timeLeft = '';
        var timeClass = "";
        if (days && days !== "0") {
            timeLeft = days + " days left";
        } else if (hours && hours !== "0") {
            timeLeft += hours + "h left";
        } else if (mins && mins !== "0") {
            timeClass = "red";
            timeLeft += mins + "m left ";
        } else if (secs && secs !== "0") {
            timeClass = "red";
            timeLeft += secs + "s left";
        }

        if (timeLeft) {
            var diffDays = Math.round(Math.abs((endTime.getTime() - now.getTime()) / (oneDay)));
            temp = dayOfWeek[endTime.getDay()];
            if (diffDays < 1) {
                temp = "Today"
            }
            timeLeft += " (" + temp + " " + endTime.getHours() + ":" + endTime.getMinutes() + ")";
        }

        return {
            timeLeft: timeLeft,
            timeClass: timeClass
        }

    }
    var sizeReg = /(\d\d\d?gb?)/i;
    var nameReg = /(i\s?phone 6\w?\s?(plus)?)/i;
    var carrierReg = /(\bee|\bo2|\bvodaphone|\bvodafone|\bvirgin|\bunlocked)/i;

    function getObject(item) {

        var sellingStatus = getValue(item, 'sellingStatus');
        var shippingInfo = getValue(item, 'shippingInfo');
        var listingInfo = getValue(item, 'listingInfo');
        var listingType = getValue(listingInfo, 'listingType');
        listingType = typeOfListing[listingType] || listingType;
        var currentPrice = getValue(sellingStatus, "currentPrice");
        var currencySymbol = currentPrice['@currencyId'];
        currencySymbol = currency[currencySymbol] || currencySymbol;
        var shippingCosts = getValue(shippingInfo, 'shippingServiceCost');
        shippingCosts = normalizeTrailingZeros(shippingCosts['__value__']);
        var timeObj = getTimeLeft(listingInfo, sellingStatus);
        var title = getValue(item, 'title');
        var size = "";
        var m = title.match(sizeReg);
        if (m) {
            size = m[1].toUpperCase() + " ";
        }
        var name = "";
        m = title.match(nameReg);
        if (m) {
            name = m[1];
            name = name.replace(/i\s?phone/i, "iPhone");
            name = name.replace("6S", "6s");
            name = name.replace(/plus/i, "Plus")
        }
        var carrier = "";
        m = title.match(carrierReg);
        if (m) {
            carrier = m[1];
            carrier = carrier.replace(/unlocked/i, "Unlocked");
        }
        var obj = {
            itemId: getValue(item, 'itemId'),
            title: title,
            subtitle: item.subtitle || '',
            pic: getValue(item, 'galleryURL'),
            viewItem: getValue(item, 'viewItemURL'),
            currencySymbol: currencySymbol,
            displayPrice: normalizeTrailingZeros(currencySymbol + currentPrice['__value__']),
            bidCount: getValue(sellingStatus, "bidCount"),
            location: (item.location) ? "Location: " + item.location[0] : "Location unspecified",
            buyItNowAvailable: getValue(listingInfo, 'buyItNowAvailable'),
            bestOffer: getValue(listingInfo, 'bestOfferEnabled'),
            freeShipping: (getValue(shippingInfo, 'shippingType') === "Free") ? true : false,
            shippingCosts: shippingCosts,
            listingType: listingType,
            condition: getValue(item.condition[0], 'conditionDisplayName'),
            timeLeft: timeObj.timeLeft,
            timeClass: timeObj.timeClass,
            phoneSize: size,
            phoneName: name,
            carrier: carrier

        }
        return obj;
    }
    var tree1 = $('#tree1');
    var tree2 = $('#tree2');
    var icon = "<i class='fa fa-file'></i>";
    var ifold = "<span class='expander'>+<i class='fa fa-folder'></i></span>";

    function addLeaf(ul, ic, text, cls) {
        var leaf = $('<li></li>').appendTo(ul);
        leaf.append(ic + text);
        leaf.addClass(cls);
    }

    function buildTreeNode(obj, li) {

        var title = obj.phoneName;
        if (obj.carrier) {
            title += " (" + obj.carrier.substr(0, 2) + ")";
        }
        title += " (B" + obj.bidCount + ")";
        li.append(ifold + obj.displayPrice + '<span>' + obj.phoneSize + '</span>');
        $('<a href="' + obj.viewItem + '"></a>').appendTo(li).text(title);
        $('<span class="' + obj.timeClass + '">' + obj.timeLeft + "</span>").appendTo(li);
        var ul = $('<ul class="hidden"></ul>').appendTo(li);
        addLeaf(ul, icon, obj.title);
        if (obj.subtitle) {
            addLeaf(ul, icon, obj.subtitle);
        }
        if (obj.carrier) {
            addLeaf(ul, icon, obj.carrier);
        }
        if (obj.freeShipping) {
            addLeaf(ul, icon, "Free Postage", "fp");
        } else {
            addLeaf(ul, icon, "+ " + obj.currencySymbol + obj.shippingCosts + " postage", "postage");
        }
        if (obj.buyItNowAvailable) {
            addLeaf(ul, icon, "Buy It Now");
        }
        addLeaf(ul, icon, obj.listingType, 'listType');
        addLeaf(ul, icon, obj.timeLeft, obj.timeClass);
        addLeaf(ul, icon, obj.bidCount + " bids");
        addLeaf(ul, icon, obj.location);
        addLeaf(ul, icon, obj.condition);
        addLeaf(ul, icon, "ItemId: " + obj.itemId);
    }

    function addTreeItem(obj) {
        var cls = "";
        if (obj.bidCount === "0") {
            cls = "nobids";
        }
        if (obj.condition === "Used") {
            var li1 = $('<li class="' + cls + '"></li>').appendTo(tree1);
            buildTreeNode(obj, li1);
        } else if (obj.condition === "For parts or not working") {
            var li2 = $('<li class="' + cls + '"></li>').appendTo(tree2);
            buildTreeNode(obj, li2);
        }
    }

    function findItemsByKeywords(root) {

        var hasResults = root && root[rootName] &&
            root[rootName][0] &&
            root[rootName][0].searchResult &&
            root[rootName][0].searchResult[0] &&
            root[rootName][0].searchResult[0].item || false;

        var items = [];
        if (hasResults) {
            items = root[rootName][0].searchResult[0].item;
        }

        tbody.empty();
        tree1.empty();
        tree2.empty();
        $('.sidebar ul').empty();

        var i, row, obj, li;
        for (i = 0; i < items.length; ++i) {
            obj = getObject(items[i]);
            li = $('<li></li>').appendTo(sideUl).attr('data-itemId', obj.itemId);

            li.text(obj.displayPrice).append("<span class='" + obj.timeClass + "'>" + obj.timeLeft + "</span>");
            li.append("<span>" + obj.bidCount + " bids</span>");
            li.append('<div>' + obj.title + '</div>');
            if (obj.bidCount === "0") {
                li.addClass('nobids');
            }
            row = rowEl.clone().appendTo(tbody);
            row.attr('data-itemId', obj.itemId);
            row.find('.image-container img').attr('src', obj.pic);
            row.find('.item-link').attr('href', obj.viewItem).attr('name', obj.itemId);
            row.find('.title').text(obj.title);
            row.find('.subtitle').text(obj.subtitle);
            row.find('.condition span').text(obj.condition);
            row.find('.price').text(obj.displayPrice);
            row.find('.timeleft').text(obj.timeLeft);

            row.find('.listType').text(obj.listingType).removeClass('hidden');
            row.find('.location').text(obj.location);
            if (obj.timeClass) {
                row.find('.timeleft').addClass(obj.timeClass);
            }
            if (obj.buyItNowAvailable && (obj.buyItNowAvailable !== "false")) {
                row.find('.bin').removeClass('hidden');
            }
            if (obj.bestOffer && (obj.bestOffer !== "false")) {
                row.find('.bestOffer').removeClass('hidden');
            }
            if (obj.freeShipping) {
                row.find('.fs').removeClass('hidden');
            } else if (obj.shippingCosts) {
                row.find('.postage').text("+ " + obj.currencySymbol + obj.shippingCosts + " postage").removeClass('hidden');
            } else {
                row.find('.postage').text("Postage not specified!").removeClass('hidden');
            }

            if (obj.bidCount) {
                row.find('.bidcount').text(obj.bidCount + " bids").removeClass("hidden");
                if (obj.bidCount === "0") {
                    row.find('.bidcount').addClass("red");
                }
            }
            row.removeClass('hidden');
            addTreeItem(obj);

        }
        $('.loader').addClass('hidden');
        resizeSidebar();
        $('#fetch-btn').removeAttr('disabled');

        $('.sidebar li').click(function () {
            var id = $(this).attr('data-itemId');
            window.location.hash = id;
        });

        $('.expander').click(function () {
            $(this).siblings('ul').toggleClass('hidden');
        });

    }


    /**
    $.ajax({
        type: 'GET',
        url: url,
        dataType: 'json',
        success: function () {
            console.log("SUCCESS");
        },
        crossDomain: true,
        beforeSend: function (request) {
            request.setRequestHeader('Access-Control-Allow-Origin', '*');
        }
    });
    **/
    _cb_findItemsByKeywords = findItemsByKeywords;

    function refreshData() {
        $('#fetch-btn').attr('disabled', true);
        $('#ebay-url').remove();
        $('.loader').removeClass('hidden');
        resetEbayURL();
        $('body').append('<script id="ebay-url" src="' + ebayURL + '"></script>');
    }
    $('#fetch-btn').click(refreshData);
    var refreshInt;
    $('#refresh-btn').click(function () {
        var self = $(this);
        if (self.hasClass("active")) {
            clearInterval(refreshInt);
            self.removeClass('active');
        } else {
            self.addClass("active");
            refreshInt = setInterval(refreshData, 60000);
        }
    });

    $('#unholy-btn').click(function () {
        var self = $(this);
        if (self.hasClass("active")) {
            self.removeClass('active');
            unholy = false;
            refreshData();
        } else {
            self.addClass("active");
            unholy = true;
            refreshData();
        }
    })

    $('#btn-tabs .btn').click(function () {

        var btn = $(this);
        $('#btn-tabs .btn').removeClass("active");
        btn.addClass("active");
        var tab = btn.attr('data-id');
        $('.tab').addClass("hidden");
        $('#' + tab).removeClass('hidden');
    });



});