!function(){Upfront.Settings&&Upfront.Settings.l10n?Upfront.Settings.l10n.global.views:Upfront.mainData.l10n.global.views;define(["scripts/upfront/upfront-views-editor/region/region-panels","scripts/upfront/upfront-views-editor/region/region-panel-add"],function(t,e){return t.extend({className:"upfront-inline-panels upfront-region-fixed-panels upfront-ui",initialize:function(){this.model.get("container"),this.model.get("name");this.listenTo(this.model.collection,"add",this.render),this.listenTo(this.model.collection,"remove",this.render),this.listenTo(Upfront.Events,"entity:region:activated",this.on_region_active),this.listenTo(Upfront.Events,"entity:region:deactivated",this.on_region_deactive),this.add_panel_top_left=new e({model:this.model,to:"top-left",width:50,height:50}),this.add_panel_top_right=new e({model:this.model,to:"top-right",width:50,height:50}),this.add_panel_bottom_left=new e({model:this.model,to:"bottom-left",width:50,height:50}),this.add_panel_bottom_right=new e({model:this.model,to:"bottom-right",width:50,height:50})},panels:function(){var t=_([]);return t.push(this.add_panel_top_left),t.push(this.add_panel_top_right),t.push(this.add_panel_bottom_left),t.push(this.add_panel_bottom_right),this._panels=t,t},on_region_active:function(t){if(t.model==this.model){var e=$(Upfront.Settings.LayoutEditor.Selectors.main);e.hasClass("upfront-region-fixed-editing")&&(this.on_active(),this.listenToOnce(Upfront.Events,"sidebar:toggle:done",this.update_pos),$(window).on("scroll",this,this.on_scroll))}},remove:function(){this.add_panel_top_left.remove(),this.add_panel_top_right.remove(),this.add_panel_bottom_left.remove(),this.add_panel_bottom_right.remove(),this.add_panel_top_left=!1,this.add_panel_top_right=!1,this.add_panel_bottom_left=!1,this.add_panel_bottom_right=!1,Backbone.View.prototype.remove.call(this)}})})}(jQuery);