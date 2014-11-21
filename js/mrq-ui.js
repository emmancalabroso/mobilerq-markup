;
(function($) {
    // fix for ie8
    if (typeof console === "undefined" || typeof console.log === "undefined") {
        console = {};
        console.log = function () {};
    }
}(jQuery));
(function($) {

    if (typeof $ === 'undefined')
        throw ("jQuery Required");

    var KEY = {UP: 38, DOWN: 40, TAB: 9, ENTER: 13};

    function requiredValue(value, message) {
        if(typeof value === "undefined") {
            throw "Missing " + ( message || "required value" );
        }
        return value;
    }

    function updatePage() {
        addErrorClassToInputWithErrors();

        //
        // Redraw all select[data-role=mrq-popup-search] as PopupSearchableSelect
        //
        $('select[data-role=mrq-popup-search]').each(function() {
            var $select = $(this)
            createPopupSearchableSelect($select, {
                'label' : $select.data('label') || "Add",
                'filterPlaceholder' : $select.data('filter-placeholder') || "Start Typing..."
            });
        });
    }

    /**
     * SearchableSelect
     *
     * Redraw a select input as a searchable list
     *
     * HTML attribute: data-filter-placeholder Set the placeholder in the search input
     *
     * @param $select The jQuery object for the select input
     * @param settings Setting for this searchable select
     * @returns The jQuery object containing the searchable list
     */
    function createSearchableSelect($select, settings) {

        function createSearchInput(placeholder) {
            return $("<div>", {"class":"search-container"})
                .append($("<input>", {"type":"text", "class":"search keystop", "placeholder":placeholder}).width(settings.width))
                .append($("<i>", { "class" : "fa fa-search"}));
        }

        function createScrolly() {
            return $("<div>").attr({'class': 'scroll'}).width(settings.width).height(settings.height);
        }

        function listFromSelect($select, $list) {
            var dividerId = 0;
            $list.empty();

            function createDividerItem(id, label) {
                return $("<li>").attr({'class': 'divider', "data-divider": id}).html($("<h1>").html(label));
            }
            function createItem(id, searchText, $item, value) {
                return $("<li>")
                    .attr({"data-search": searchText, "data-of-divider": id})
                    .append($("<a>")
                        .attr({'href': '#', 'class': 'keystop', 'data-value': value})
                        .append($item)
                    );
            }
            function appendOption($option, $optgroup) {
                var optgrouplabel = typeof $optgroup !== "undefined" ? $optgroup.attr('label') : "";
                var $item =  settings.formatItem($option, $optgroup);
                if(typeof $item !== "undefined") {
                    var search = typeof $option.data("search") !== 'undefined' ? $option.data("search") : (optgrouplabel + " " + $option.text());
                    $list.append(createItem(dividerId, search, $item, $option.val()).data("option", $option));
                }
            }

            $select.children("optgroup,option").each(function() {
                if($(this).is("optgroup")) {
                    dividerId++;
                    var $optgroup = $(this);
                    var optgrouplabel = $optgroup.attr('label');
                    var $divider = createDividerItem(dividerId, optgrouplabel).appendTo($list);
                    $optgroup.children("option").each(function() {
                        appendOption($(this), $optgroup);
                    });
                } else if($(this).is("option")) {
                    appendOption($(this));
                }
            });
            // clicking a list item updates the $select value
            $('a', $list).click(function() {
                // update original select element and trigger a change
                var val = $(this).data('value');
                $select.find("option[value='" + val + "']").attr("selected", "selected");
                $select.trigger('change');
                return false;
            });
        }

        // build our widget
        var filterPlaceholder = settings.filterPlaceholder;
        var $container = $("<div>", {"class": settings.popupSearchableSelectClass });
        var $searchBox = createSearchInput(filterPlaceholder).appendTo($container)
        var $search = $searchBox.find("input");
        var $list = $("<ul>").width(settings.width).appendTo(createScrolly().appendTo($container));
        // populate $list with the $select items
        listFromSelect($select, $list);

        // clear the search input
        function clearSearch() {
            $search.val("").trigger('keyup').focus();
        }



        function updateList() {
            // filter the list items while typing
            $('li[data-search]', $list).each(function() {
                if (settings.searchMethod($search.val(), $(this).data("option"))) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
            // hide empty dividers
            $("li[data-divider]", $list).each(function() {
                var id = $(this).data('divider');
                var $visibleChildren = $("li[data-of-divider=" + id + "]:visible", $list);
                if ($visibleChildren.length === 0) {
                    $(this).hide();
                } else {
                    $(this).show();
                }
            });
        }

        // add search key handler
        $search.keyup(updateList).change(updateList).click(updateList);

        // changing the $select value sets focus on the list item
        $select.change(function() {
            if(!$select.is("[multiple]")) {
                $("a[data-value=" + $select.val() + "]", $list).focus();
            }
        });

        // container keyboard handler makes up, down, tab and enter navigate $list
        $container.keydown(function(event) {
            var $inputs = $('a:visible', $container);
            var i = $inputs.index($( document.activeElement ));
            switch (event.which) {
                case KEY.DOWN:
                    // move focus down
                    $inputs.eq(i+1).focus();
                    event.preventDefault();
                    break;
                case KEY.UP:
                    // move focus up
                    $inputs.eq(i-1).focus();
                    event.preventDefault();
                    break;
                case KEY.TAB:
                case KEY.ENTER:
                    // use default
                    break;
                default:
                    // direct all other keys to the search box
                    $search.focus();
                    break;
            }
        });

        // redirect $container focus to $search input and clear input
        $container.focus(function(e) {
            clearSearch();
            e.stopPropagation();
        });

        // $container clicks are absorbed and ignored.
        $container.click(function() {
            return false;
        });

        // bind refesh so it redraws the list from the select options
        $container.bind("refresh", function() {
            listFromSelect($select, $list);
        });

        return $container;
    }

    /**
     * Button
     *
     * Create a basic mrq-ui button
     *
     * @param label The button label
     * @returns JQuery object for the button
     */
    function createButton(label) {
        return $("<a>").html(label).attr({'class': "mrq-ui button", 'href': '#'});
    }

    /**
     * Popup
     *
     * Make $button pop up $container when clicked.
     *
     * @param $button The jQuery button to trigger the popup
     * @param $container jQuery container to pop up
     * @returns jQuery object for the popup
     */
    function popup($button, $container) {
        $('html').click(function() {
            // clicks outside $container hides $container
            $container.hide();
        });
        // show $container on click
        return $button.click(function() {
            // position $container
            $container.css({
                "position":"absolute",
                "left": $button.position().left + $button.outerWidth() + 10,
                "top": $button.position().top - 10
            });
            // button clicks show container
            $container.fadeIn().focus();
            return false;
        });
    }

    // search filter algo
    function matching(query, doc) {
        // empty query matches all
        if (typeof(query) === 'undefined' || query.length <= 0) {
            return true;
        }
        // search terms are delimied by whitespace
        var terms = query.split("\\s");
        // get a list of terms that match the doc
        var results = $.grep(terms, function(term) {
            // Match term with the begining of a word, case insensitive
            return doc.search(new RegExp("\\b" + term, "i")) >= 0;
        });
        // all terms must match
        return results.length === terms.length;
    }

    /**
     * PopupSearchableSelect
     *
     * Replace select with a button. Clicking the button pops up a searchable
     * select dialog. You hook select.change(handler()) to get updates.
     *
     * HTML attribute: data-label Set the button label
     * HTML attribute: data-filter-placeholder Set the placeholder in the search input
     *
     * @param $select The jQuery for a select input
     * @param settings The settings for this select
     * @returns The jQuery for a select input
     */
    function createPopupSearchableSelect($select, inSettings) {
        var settings = $.extend({
            'label'         : 'Select',
            'filterPlaceholder' : 'Start Typing...',
            'width' : '300px',
            'height' : '300px',
            'popupSearchableSelectClass' : "mrq-ui search",
            'formatItem' : function($option, $optgroup) {
                return $("<div>").addClass("mrq-item").append($option.html());
            },
            searchMethod : function (query, $option) {
                return matching(query, $option.parent("optgroup").attr("label") + " " + $option.val() + " " +  $option.text());
            }
        }, inSettings)

        var $search = createSearchableSelect($select, settings).insertAfter($select.hide());
        $select.change(function() {
            $search.hide();
        });
        var $button = createButton(settings.label).insertAfter($select);
        popup($button, $search).click(function () {
            $search.trigger("refresh");
        });
        $search.hide();
        return $select;
    }

    function createSelectListView($select, inSettings) {
        var settings = $.extend({
            listviewPlaceholderClass : "mrq-listview-placeholder",
            listviewClass : "mrq-listview",
            listingSelectedClass : "mrq-selected",
            listingNotSelectedClass : "mrq-not-selected",
            listingClass : "mrq-listing",
            listingGroupClass : "mrq-listing-group",
            placeholder : undefined,
            groupFormat : function ($optgroup, $container) {
                if($optgroup.find("option:selected").length > 0) {
                    return $("<p>").html($optgroup.attr("label")).get(0);
                } else {
                    return null;
                }
            },
            listingFormat : function ($option, $container) {
                if($option.is(":selected")) {
                    return $("<p>").html($option.text()).get(0);
                } else {
                    return null;
                }
            }
        }, inSettings);

        var $container = $("<div>").addClass(settings.listviewClass).insertAfter($select);
        var $list = $("<ul>").appendTo($container);
        var $placeholder = (typeof settings.placeholder !== "undefined") ?
            $("<div>", {"class" : settings.listviewPlaceholderClass}).text(settings.placeholder).appendTo($container) :
            $();

        function updatePlaceholder() {
            if($list.find("li:visible").length > 0) {
                $placeholder.hide();
            } else {
                $placeholder.fadeIn();
            }
        }

        function updateList() {
            $select.find("option").each(function() {
                var $element = $(this);
                var $li = $list.find("li[data-value='" + $element.val() + "']");
                if($li.length == 0) {
                    // li not found
                    $li = $("<li>", { "data-value" : $element.val() });
                    var listing = settings.listingFormat($element, $li);
                    if(typeof listing !== "undefined") {
                        // add listing
                        $li.html(listing).appendTo($list).fadeIn();
                        updatePlaceholder();
                    }
                } else {
                    // li found
                    var listing = settings.listingFormat($element, $li);
                    if(typeof listing === "undefined") {
                        // remove listing
                        $list.find("li[data-value='" + $element.val() + "']").fadeOut(function () {
                            $(this).detach();
                            updatePlaceholder();
                        });
                    } else {
                        $li.html(listing);
                    }
                }
                if($element.is(":selected")) {
                    $li
                        .addClass(settings.listingSelectedClass)
                        .removeClass(settings.listingNotSelectedClass)
                } else {
                    $li
                        .addClass(settings.listingNotSelectedClass)
                        .removeClass(settings.listingSelectedClass)
                }
            });
            updatePlaceholder();
        };
        $select.change(updateList).hide();
        updateList();
    }


    $.fn.mrqPopupSearchableSelect = function (options) {
        var settings = $.extend( {
          'label'         : 'Select',
          'filterPlaceholder' : 'Start Typing...'
        }, options);
        return this.each(function () {
            return createPopupSearchableSelect($(this), settings);
        });
    };

    $.fn.mrqSelectListView = function (options) {
        return this.each(function () {
            return createSelectListView($(this), options);
        });
    };

    function addErrorClassToInputWithErrors() {
        $("[id].errors").each(function () {
            var name = $(this).attr('id').replace(/(.*)\.errors/, "$1");
            if( name.length > 0) {
                $("input[name='" + name +"'],textarea[name='" + name + "'],select[name='" + name + "']").addClass("errors")
            }
        })
    }

    // get'er done
    updatePage();

}( jQuery ));

$(function() {
    // check for dirty forms and pop a message before losing changes.
    $.DirtyForms.dialog = {
        selector: '#unsavedChanges',
        fire: function(message, dlgTitle) {
            $('#unsavedChanges').dialog({title: dlgTitle, width: 350, modal: true});
            $('#unsavedChanges').html(message);
        },
        bind: function() {
            $('#unsavedChanges').dialog('option', 'buttons',
                [
                    {
                        text: "Stay Here",
                        click: function(e) {
                            $.DirtyForms.choiceContinue = false;
                            $(this).dialog('close');
                        }
                    },
                    {
                        text: "Leave This Page",
                        click: function(e) {
                            $.DirtyForms.choiceContinue = true;
                            $(this).dialog('close');
                        }
                    }
                ]
            ).bind('dialogclose', function(e) {
                // Execute the choice after the modal dialog closes
                $.DirtyForms.choiceCommit(e);
            });
        },
        refire: function(content) {
            return false;
        },
        stash: function() {
            return false;
        }
    }
    $('form.dirtyFormCheck').each(function () {
        $(this).dirtyForms();
    });
});
