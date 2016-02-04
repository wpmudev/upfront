(function(e){define(["scripts/upfront/preset-settings/preset-manager","scripts/upfront/element-settings/advanced-settings"],function(e,t){var n=Upfront.Settings&&Upfront.Settings.l10n?Upfront.Settings.l10n.global.views:Upfront.mainData.l10n.global.views,r=Backbone.View.extend({id:"settings",events:{"click .upfront-save_settings":"saveSettings","click .upfront-cancel_settings":"cancelSettings"},initialize:function(n){this.options=n;var r=this,i={},s,o,u;this.hasBreakpointSettings===!0&&(s=Upfront.Views.breakpoints_storage.get_breakpoints().get_active(),o=this.model.get_property_value_by_name("breakpoint")||{},u=o[s.id]||{},_.each(this.breakpointSpecificSettings,function(e){_.isUndefined(u[e.name])||this.model.set_property(e.name,u[e.name],!0)},this)),_.each(this.panels,function(t,n){if(n==="Appearance"){this.appearancePanel=new e(_.extend({hasBreakpointSettings:this.hasBreakpointSettings,breakpointSpecificPresetSettings:this.breakpointSpecificPresetSettings,model:this.model},t)),this.listenTo(this.appearancePanel,"upfront:presets:state_show",this.stateShow),i.Appearance=this.appearancePanel;return}_.isFunction(t)&&(i[n]=new t({model:this.model}))},this),i.Advanced=new t({model:this.model}),this.panels=i,this.on("open",function(){r.model.trigger("settings:open",r)}),this.listenTo(Upfront.Events,"element:settings:render",this.setScrollMaxHeight)},saveSettings:function(){var e,t;this.removePreviewClasses(),this.hasBreakpointSettings===!0&&this.breakpointSpecificSettings&&(e=Upfront.Views.breakpoints_storage.get_breakpoints().get_active(),t=this.model.get_property_value_by_name("breakpoint")||{},t[e.id]=t[e.id]||{},_.each(this.breakpointSpecificSettings,function(n){t[e.id][n.name]=this.model.get_property_value_by_name(n.name),t[e.id].width=e.get("width")},this),this.model.set_property("breakpoint",t,!0)),_.each(this.panels,function(e){e.save_settings()}),this.model.get("properties").trigger("change"),Upfront.Events.trigger("element:settings:saved"),Upfront.Events.trigger("element:settings:deactivate"),Upfront.Application.is_builder()?Upfront.Events.trigger("command:layout:export_theme"):_upfront_post_data.layout.specificity&&_upfront_post_data.layout.item&&!_upfront_post_data.layout.item.match(/-page/)?Upfront.Events.trigger("command:layout:save_as"):Upfront.Events.trigger("command:layout:save"),this.onSaveSettings&&this.onSaveSettings()},cancelSettings:function(){this.removePreviewClasses(),Upfront.Events.trigger("element:settings:canceled")},stateShow:function(e){var t=this.for_view.$el.find(".upfront-object");e!=="static"?(this.removePreviewClasses(),t.addClass("live-preview-"+e)):this.removePreviewClasses()},removePreviewClasses:function(){var e=this.for_view.$el.find(".upfront-object");e.removeClass("live-preview-hover live-preview-focus live-preview-active")},render:function(){var e=this;this.$el.html('<div class="upfront-settings-title">'+this.title+'</div><div id="sidebar-scroll-wrapper" />'),Upfront.Events.trigger("settings:prepare"),_.each(this.panels,function(t){t.render(),t.parent_view=e,e.$el.find("#sidebar-scroll-wrapper").append(t.el)}),this.$el.addClass("upfront-ui"),this.$el.append("<div class='upfront-settings-button_panel'><button type='button' class='upfront-cancel_settings'>"+n.cancel+"</button>"+"<button type='button' class='upfront-save_settings'><i class='icon-ok'></i> "+n.save_element+"</button>"+"</div>")},setScrollMaxHeight:function(){var e=this.$el.height(),t=this.$el.find(">.upfront-settings-title").outerHeight(!0),n=this.$el.find(">.upfront-settings-button_panel").outerHeight(!0);this.$el.find("#sidebar-scroll-wrapper").css("max-height",e-t-n+"px")},cleanUp:function(){this.panels&&_.each(this.panels,function(e){e.cleanUp&&e.cleanUp()}),this.remove()}});return r})})(jQuery);