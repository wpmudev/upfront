(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        "text!upfront/templates/popup.html"
    ], function ( popup_tpl ) {

        return Backbone.View.extend({
            id: "upfront-entity_list-search",
            searchTpl: _.template($(popup_tpl).find('#upfront-filter-tpl').html()),
            events: {
                "click #upfront-search_action": "handle_search_request",
                "keydown #upfront-list-search_input": "dispatch_search_enter"
            },
            render: function () {
                var query = this.collection.lastFetchOptions ? this.collection.lastFetchOptions.search : false;
                this.$el.html(this.searchTpl({query: query}));
            },
            dispatch_search_enter: function (e) {
                if(e.which == 13)
                    return this.handle_search_request(e);
            },
            handle_search_request: function (e) {
                e.preventDefault();
                var text = $("#upfront-search_container input").val();
                this.collection.fetch({search: text});
            }
        });

    });
}(jQuery));
