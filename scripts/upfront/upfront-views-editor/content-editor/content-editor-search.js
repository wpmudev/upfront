(function($, Backbone){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([

    ], function () {

        return Backbone.View.extend({
            id: "upfront-entity_list-search",
            searchTpl: _.template($(_Upfront_Templates.popup).find('#upfront-search-tpl').html()),
            events: {
                "click #upfront-search_action": "dispatch_search_click",
                "keydown #upfront-list-search_input": "dispatch_search_enter"
            },
            render: function () {
                var query = this.collection.lastFetchOptions ? this.collection.lastFetchOptions.search : false;
                this.$el.html(this.searchTpl({query: query}));
            },
            dispatch_search_click: function (e) {
                if ($("#upfront-search_container").is(":visible"))
                    return this.handle_search_request(e);
                else return this.handle_search_reveal(e);
            },
            dispatch_search_enter: function (e) {
                if(e.which == 13)
                    return this.handle_search_request(e);
            },
            handle_search_request: function (e) {
                e.preventDefault();
                var text = $("#upfront-search_container input").val();
                this.collection.fetch({search: text});
            },
            handle_search_reveal: function () {
                $("#upfront-search_container").show();
            }
        });

    });
}(jQuery, Backbone));