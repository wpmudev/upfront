!function(t){Upfront.Settings&&Upfront.Settings.l10n?Upfront.Settings.l10n.global.views:Upfront.mainData.l10n.global.views;define(["scripts/upfront/upfront-views-editor/breakpoint/storage","scripts/upfront/upfront-views-editor/breakpoint/breakpoint-activate-button"],function(t,e){return Backbone.View.extend({tagName:"ul",className:"breakpoints-toggler",initialize:function(){this.collection=t.get_breakpoints(),this.listenTo(this.collection,"add remove change",this.render)},render:function(){return this.$el.html(""),_.each(this.collection.sorted_by_width(),function(t){if(t.get("enabled")!==!1){var n=new e({model:t});this.$el.append(n.render().el)}},this),this}})})}(jQuery);