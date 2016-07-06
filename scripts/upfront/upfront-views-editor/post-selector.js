(function($, Backbone) {

    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;

    define([
        'scripts/upfront/upfront-views-editor/post-selector/post-selector-navigation',
        "text!upfront/templates/popup.html"
    ], function( PostSelectorNavigation, popup_tpl ) {

       return Backbone.View.extend({
            postTypeTpl: _.template($( popup_tpl ).find('#selector-post_type-tpl').html()),
            postListTpl: _.template($( popup_tpl ).find('#selector-post-tpl').html()),
            postType: 'post',
            posts: [],
            pagination: false,
            selected: false,
            deferred: false,
            popup: false,
            defaultOptions: {
                // Title for the top
                title: l10n.select_content_to_link,
                postTypes: [
                    {name: 'post', label: l10n.posts},
                    {name: 'page', label: l10n.pages}
                ]
            },
            events: {
                'click .upfront-field-select-value': 'openTypesSelector',
                'click .upfront-field-select-option': 'selectType',
                'click .upfront-selector-post': 'selectPost',
                'click .use': 'postOk',
                'click #upfront-search_action': 'search',
                'keyup .search_container>input': 'inputSearch'
            },
            initialize: function () {
                if (("post_types" in Upfront.mainData.content_settings ? Upfront.mainData.content_settings : {post_types: []}).post_types.length) {
                    this.defaultOptions.postTypes = Upfront.mainData.content_settings.post_types;
                }
            },
            open: function(options){
                var me = this,
                    bindEvents = false
                    ;

                options = _.extend({}, this.defaultOptions, options);

                if(!$("#upfront-popup").length && this.$el.attr('id') != 'upfront-popup')
                    bindEvents = true;

                this.popup = Upfront.Popup.open(function(){});

                this.deferred = $.Deferred();

                this.posts = new Upfront.Collections.PostList([], {postType: 'page'});

                this.posts.pagination.pageSize = 20;
                this.pagination = new PostSelectorNavigation({
                    collection: this.posts,
                    pageSelection: function(page){
                        me.fetch({page: page});
                    }
                });

                this.setElement($('#upfront-popup'));

                this.$('#upfront-popup-top').html('<h3 class="upfront-selector-title">' + options.title +'</h3>');
                this.$('#upfront-popup-content').html(this.postTypeTpl(options));

                this.fetch({});

                this.$('#upfront-popup-bottom')
                    .html('<div class="use_selection_container inactive"><a href="#use" class="use">'+ Upfront.Settings.l10n.global.content.ok +'</a></div><div class="search_container clearfix"><input type="text" placeholder="' + l10n.search + '" value=""><div class="search upfront-icon upfront-icon-popup-search" id="upfront-search_action"></div></div>')
                    .append(this.pagination.$el)
                ;
                $('#upfront-popup').addClass('upfront-postselector-popup');

                this.$('.upfront-field-select-value').text(l10n.pages);
                return this.deferred.promise();
            },

            openTypesSelector: function(){
                var selector = this.$('.upfront-field-select');
                if(!selector.hasClass('open')) {
                    selector.addClass('open');
                }
                else {
                    selector.removeClass('open');
                }
            },

            selectType: function(e){
                var type = $(e.target).attr('rel');
                if(type != this.posts.postType){
                    this.$('.upfront-field-select-value').text($(e.target).text());
                    this.$('.upfront-field-select').removeClass('open');
                    this.fetch({postType: type});
                }
            },

            selectPost: function(e){
                var post = $(e.currentTarget);
                this.$('.upfront-selector-post.selected').removeClass('selected');

                this.selected = $(e.currentTarget).addClass('selected').attr('rel');
                this.$('.use_selection_container').removeClass('inactive');
            },

            postOk: function(e){
                e.preventDefault();
                if(!this.selected)
                    return;

                Upfront.Popup.close();
                return this.deferred.resolve(this.posts.get(this.selected));
            },

            fetch: function(options){
                var me = this,
                    loading = new Loading({
                        loading: l10n.loading,
                        done: l10n.thank_you_for_waiting,
                        fixed: false
                    })
                    ;

                this.$('.use_selection_container').addClass('inactive');
                this.selected = false;

                loading.render();
                this.$('#upfront-selector-posts').append(loading.$el);

                if(options.postType && options.postType != this.posts.postType){
                    options.flush = true;
                    this.posts.postType = options.postType;
                }

                var page = options.page;
                if(!page)
                    page = 0;

                this.posts.fetchPage(page, options).done(function(pages){
                    loading.done();
                    me.$('#upfront-selector-posts').find('table').remove();
                    me.$('#upfront-selector-posts').append(me.postListTpl({posts: me.posts.getPage(page)}));
                    me.pagination.render();
                });
            },

            search: function(e){
                e.preventDefault();
                var s = this.$('.search_container input').val();
                if(s){
                    this.fetch({search: s, flush: true});
                }
                else
                    this.$('.search_container input').focus();
            },
            inputSearch: function(e){
                if(e.which == 13)
                    this.search(e);
            }
        });

    });
})(jQuery, Backbone);