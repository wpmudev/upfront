(function(e){define([],function(){var e=Upfront.Settings&&Upfront.Settings.l10n?Upfront.Settings.l10n.global.views:Upfront.mainData.l10n.global.views,t=Backbone.View.extend({initialize:function(e){this.options=e,this.panels=_([])},get_title:function(){return e.settings},render:function(){var e=this;e.$el.empty().show().html('<div class="upfront-settings_title">'+this.get_title()+"</div>"),Upfront.Events.trigger("settings:prepare"),e.panels.each(function(t){t.render(),e.listenTo(t,"upfront:settings:panel:toggle",e.toggle_panel),e.listenTo(t,"upfront:settings:panel:close",e.close_panel),e.listenTo(t,"upfront:settings:panel:refresh",e.refresh_panel),t.parent_view=e,e.$el.append(t.el)}),this.toggle_panel(this.panels.first());var t=this.panels.first().$el.find(".upfront-settings_label").outerWidth(),n=this.panels.first().$el.find(".upfront-settings_panel").outerWidth();this.$el.addClass("upfront-ui"),this.$el.addClass("settings-no-tabs"),this.trigger("open")},set_title:function(e){if(!e||!e.length)return!1;this.$el.find(".upfront-settings_title").html(e)},toggle_panel:function(e){this.panels.invoke("conceal"),e.$el.find(".upfront-settings_panel").css("height",""),e.show(),e.reveal(),this.set_title(e.get_title());var t=0;this.panels.each(function(e){t+=e.$el.find(".upfront-settings_label").outerHeight()});var n=e.$el.find(".upfront-settings_panel").outerHeight()-1;n>=t?this.$el.css("height",n):(e.$el.find(".upfront-settings_panel").css("height",t),this.$el.css("height",t))},refresh_panel:function(e){e.is_active()&&this.toggle_panel(e)},close_panel:function(e){this.panels.invoke("conceal"),this.panels.invoke("show"),this.set_title(this.get_title())},remove:function(){this.panels&&this.panels.each(function(e){e.remove()}),Backbone.View.prototype.remove.call(this)}});return t})})(jQuery);