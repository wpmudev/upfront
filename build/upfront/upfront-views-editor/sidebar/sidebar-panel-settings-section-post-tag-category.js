!function(t){Upfront.Settings&&Upfront.Settings.l10n?Upfront.Settings.l10n.global.views:Upfront.mainData.l10n.global.views;define(["scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section","upfront/post-editor/upfront-post-edit"],function(t,o){return t.extend({initialize:function(t){this.options=t,this.options.call=!1,this.settings=_([])},get_name:function(){return"tag_category"},get_title:function(){return"Cats / Tags"},on_render:function(){var t=this;this.options.call||(this.$el.append('<div class="upfront-categories-wrapper"></div>'),this.$el.append('<div class="upfront-tags-wrapper"></div>'),post=new Upfront.Models.Post({ID:this.options.postId}),post.fetch().done(function(o){t.renderTaxonomyEditor(t.options.postId,"category",post),t.renderTaxonomyEditor(t.options.postId,"post_tag",post)}),this.options.call=!0)},renderTaxonomyEditor:function(t,n,e){n="undefined"==typeof n?"category":n;var i=this,r=new Upfront.Collections.TermList([],{postId:t,taxonomy:n});return!!this._post_type_has_taxonomy(n,e)&&void r.fetch({allTerms:!0}).done(function(t){var e=t.data.taxonomy.hierarchical?o.ContentEditorTaxonomy_Hierarchical:o.ContentEditorTaxonomy_Flat,s=new e({collection:r,tax:n});s.allTerms=new Upfront.Collections.TermList(t.data.allTerms),s.render(),t.data.taxonomy.hierarchical?i.$el.find(".upfront-categories-wrapper").append(s.$el):i.$el.find(".upfront-tags-wrapper").append(s.$el)})},_post_type_has_taxonomy:function(t,o){if(!t)return!0;var n=o.get("post_type")||"post";return"page"!==n}})})}(jQuery);