(function(e){define(["scripts/upfront/preset-settings/preset-manager","scripts/upfront/element-settings/advanced-settings"],function(e,t){var n=Upfront.Settings&&Upfront.Settings.l10n?Upfront.Settings.l10n.global.views:Upfront.mainData.l10n.global.views,r=Backbone.View.extend({id:"settings",events:{"click .upfront-save_settings":"saveSettings","click .upfront-cancel_settings":"cancelSettings"},initialize:function(n){this.options=n;var r=this,i={};_.each(this.panels,function(t,n){if(n==="Appearance"){i.Appearance=new e(_.extend({},t,{model:this.model}));return}i[n]=new t({model:this.model})},this),i.Advanced=new t({model:this.model}),this.panels=i,this.on("open",function(){r.model.trigger("settings:open",r)})},saveSettings:function(){_.each(this.panels,function(e){e.save_settings()}),this.model.get("properties").trigger("change"),Upfront.Events.trigger("element:settings:saved"),Upfront.Events.trigger("element:settings:deactivate"),_upfront_post_data.layout.specificity&&_upfront_post_data.layout.item&&!_upfront_post_data.layout.item.match(/-page/)?Upfront.Events.trigger("command:layout:save_as"):Upfront.Events.trigger("command:layout:save"),this.onSaveSettings&&this.onSaveSettings()},cancelSettings:function(){Upfront.Events.trigger("element:settings:canceled")},render:function(){var e=this;this.$el.html('<div class="upfront-settings-title">'+this.title+'</div><div id="sidebar-scroll-wrapper" />'),Upfront.Events.trigger("settings:prepare"),_.each(this.panels,function(t){t.render(),t.parent_view=e,e.$el.find("#sidebar-scroll-wrapper").append(t.el)}),this.$el.addClass("upfront-ui"),this.$el.append("<div class='upfront-settings-button_panel'><button type='button' class='upfront-cancel_settings'>"+n.cancel+"</button>"+"<button type='button' class='upfront-save_settings'><i class='icon-ok'></i> "+n.save_element+"</button>"+"</div>")},cleanUp:function(){this.panels&&_.each(this.panels,function(e){e.cleanUp&&e.cleanUp()}),this.remove()}});return r})})(jQuery);