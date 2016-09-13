(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section',
        'upfront/post-editor/upfront-post-edit'
    ], function (SidebarPanel_Settings_Section, PostEditorBox) {

        return SidebarPanel_Settings_Section.extend({
            initialize: function (opts) {
                this.options = opts;
                this.options.call = false;
                this.settings = _([]);
            },
            get_name: function () {
                return 'tag_category';
            },
            get_title: function () {
                return "Cats / Tags";
            },
            on_render: function () {
                var me = this;

                if(!this.options.call) {
                    this.$el.append('<div class="upfront-categories-wrapper"></div>');
                    this.$el.append('<div class="upfront-tags-wrapper"></div>');
                    post = new Upfront.Models.Post({ID: this.options.postId});
                    post.fetch().done(function(response){
                        me.renderTaxonomyEditor(me.options.postId, 'category', post);
                        me.renderTaxonomyEditor(me.options.postId, 'post_tag', post);
                    });

                    this.options.call = true;
                }
            },
            renderTaxonomyEditor: function(postId, tax, post){
                tax = typeof tax === "undefined" ? "category" : tax;
                var self = this,
                    termsList = new Upfront.Collections.TermList([], {postId: postId, taxonomy: tax})
                    ;

                if (!this._post_type_has_taxonomy(tax, post)) {
                    return false;
                }

                termsList.fetch({allTerms: true}).done(function(response){
                    var tax_view_constructor = response.data.taxonomy.hierarchical ? PostEditorBox.ContentEditorTaxonomy_Hierarchical : PostEditorBox.ContentEditorTaxonomy_Flat;
                    var tax_view = new tax_view_constructor({collection: termsList, tax: tax});

                    tax_view.allTerms = new Upfront.Collections.TermList(response.data.allTerms);
                    tax_view.render();
                    if(response.data.taxonomy.hierarchical) {
                        self.$el.find('.upfront-categories-wrapper').append(tax_view.$el);
                    } else {
                        self.$el.find('.upfront-tags-wrapper').append(tax_view.$el);
                    }
                });

            },
            _post_type_has_taxonomy: function (tax, post) {
                if (!tax) return true;
                var type = post.get("post_type") || 'post';
                return "page" !== type;
            }
        });

    });
}(jQuery));