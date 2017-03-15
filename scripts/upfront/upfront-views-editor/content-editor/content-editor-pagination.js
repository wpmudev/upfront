(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        "text!upfront/templates/popup.html"
    ], function ( popup_tpl ) {

        return Backbone.View.extend({
            paginationTpl: _.template($(popup_tpl).find('#upfront-pagination-tpl').html()),
            events: {
                "click .upfront-pagination_page-item": "handle_pagination_request",
                "click .upfront-pagination_item-next": "handle_next",
                "click .upfront-pagination_item-prev": "handle_prev",
                "keypress .upfront-pagination_page-current": "set_page_keypress"
            },
            initialize: function(opts){
                this.options = opts;
            },
            render: function () {
                this.$el.html(this.paginationTpl(this.collection.pagination));
            	// Check if there are extra pages and if not, hide extra UI.
            	this.hide_extra_ui();
            },
						hide_extra_ui: function() {
              if (this.collection.pagination.pages <= 1) {
              	this.$el.children('div').addClass('upfront-single-page-pagination');
              }
						},
            handle_pagination_request: function (e, page) {
                page = page ? page : parseInt($(e.target).attr("data-page_idx"), 10) || 0;
                var me = this,
                    pagination = this.collection.pagination
                    ;
                this.collection.fetchPage(page).
                done(function(response){
                    me.collection.trigger('reset');
                });
            },
            handle_next: function(e) {
                var pagination = this.collection.pagination,
                    nextPage = pagination.currentPage == pagination.pages - 1 ? false : pagination.currentPage + 1;

                if(nextPage)
                    this.handle_pagination_request(e, nextPage);
            },
            handle_prev: function(e) {
                var pagination = this.collection.pagination,
                    prevPage = pagination.currentPage == 0 ? false : pagination.currentPage - 1;

                if(prevPage !== false)
                    this.handle_pagination_request(e, prevPage);
            },
            set_page_keypress: function (e) {
                //var me = this;
                e.stopPropagation();
                if (13 !== e.which) return true;

                var string = $.trim($(e.target).val()),
                    num = parseInt(string, 10)
                    ;
                if (!num || num < 1) return false;
                if (num > this.collection.pagination.pages) num = this.collection.pagination.pages;
                /*
                 this.collection.fetchPage(num-1).
                 done(function(response){
                 me.collection.trigger('reset');
                 });
                 */
                this.handle_pagination_request(e, num-1);
            }
        });

    });
}(jQuery));
