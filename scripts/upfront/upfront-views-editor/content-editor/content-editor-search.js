(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        "text!upfront/templates/popup.html",
				'scripts/upfront/upfront-views-editor/fields',
    ], function ( popup_tpl, Fields ) {

        return Backbone.View.extend({
            id: "upfront-entity_list-search",
            searchTpl: _.template($(popup_tpl).find('#upfront-filter-tpl').html()),
            events: {
                "click #upfront-search_action": "handle_search_request",
                "keydown #upfront-list-search_input": "dispatch_search_enter"
            },
          	initialize: function(options) {
            	this.postType = options.postType;
          	},
            render: function () {
                var query = this.collection.lastFetchOptions ? this.collection.lastFetchOptions.search : false;
                this.$el.html(this.searchTpl({query: query}));
            		this.add_filter_dropdowns();
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
						handle_filter_request: function (e) {
                e.preventDefault();
              	var status,
              		date,
              		category
              	;
                this.collection.fetch();
						},
						get_status_values: function(values) {
							return values;
						},
						add_filter_dropdowns: function() {
							var me = this;
							new Upfront.Collections.FilterList([], {postType: this.postType}).fetch({postType: this.postType}).done(function(data){
								var status_dropdown = new Fields.Select({
									model: this.model,
									//property: 'background_type', // We have our own behavior, so let's not use the default field one
									//use_breakpoint_property: true,
									name: 'post_status',
									default_value: 'all',
									values: me.get_status_values(data.data.statuses),
									change: function (e) {
										me.handle_filter_request(e);
									}
								});

								status_dropdown.render();
								me.$el.prepend(status_dropdown.$el);
						});
					}
    	});

    });
}(jQuery));
