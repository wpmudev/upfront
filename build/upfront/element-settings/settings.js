!function(e){define(["scripts/upfront/preset-settings/preset-manager","scripts/upfront/element-settings/advanced-settings","scripts/perfect-scrollbar/perfect-scrollbar","scripts/upfront/upfront-views-editor/commands"],function(e,t,i,n){var s=Upfront.Settings&&Upfront.Settings.l10n?Upfront.Settings.l10n.global.views:Upfront.mainData.l10n.global.views,a=Backbone.View.extend({id:"settings",events:{"click .upfront-save_settings":"saveSettings","click .upfront-cancel_settings":"cancelSettings"},initialize:function(i){this.options=i;var n,s,a,o=this,l={},r=!Upfront.Application.user_can("SWITCH_PRESET")&&!Upfront.Application.user_can("MODIFY_PRESET")&&!Upfront.Application.user_can("DELETE_PRESET");this.hasBreakpointSettings===!0&&(n=Upfront.Views.breakpoints_storage.get_breakpoints().get_active(),s=this.model.get_property_value_by_name("breakpoint")||{},a=s[n.id]||{},_.each(this.breakpointSpecificSettings,function(e){_.isUndefined(a[e.name])||this.model.set_property(e.name,a[e.name],!0)},this)),_.each(this.panels,function(t,i){return"Appearance"!==i||r?void(_.isFunction(t)&&(l[i]=new t({model:this.model}))):(this.appearancePanel=new e(_.extend({hasBreakpointSettings:this.hasBreakpointSettings,breakpointSpecificPresetSettings:this.breakpointSpecificPresetSettings,model:this.model},t)),this.listenTo(this.appearancePanel,"upfront:presets:state_show",this.stateShow),void(l.Appearance=this.appearancePanel))},this),Upfront.Application.user_can("MODIFY_PRESET")&&(l.Advanced=new t({model:this.model})),this.panels=l,this.on("open",function(){o.model.trigger("settings:open",o)}),this.listenTo(Upfront.Events,"element:settings:render",this.setScrollMaxHeight)},saveSettings:function(){var e,t;this.hasBreakpointSettings===!0&&this.breakpointSpecificSettings&&(e=Upfront.Views.breakpoints_storage.get_breakpoints().get_active(),t=this.model.get_property_value_by_name("breakpoint")||{},t[e.id]=t[e.id]||{},_.each(this.breakpointSpecificSettings,function(i){t[e.id][i.name]=this.model.get_property_value_by_name(i.name),t[e.id].width=e.get("width")},this),this.model.set_property("breakpoint",t,!0)),_.each(this.panels,function(e){e.save_settings()}),this.model.get("properties").trigger("change"),Upfront.Events.trigger("element:settings:saved"),Upfront.Events.trigger("element:settings:deactivate"),this.onSaveSettings&&this.onSaveSettings(),this.removePreviewClasses()},cancelSettings:function(){this.removePreviewClasses(),Upfront.Events.trigger("element:settings:canceled")},stateShow:function(e){var t=this.for_view.$el.find(".upfront-object");"static"!==e?(this.removePreviewClasses(),t.addClass("live-preview-"+e)):this.removePreviewClasses()},removePreviewClasses:function(){var e=this.for_view.$el.find(".upfront-object");e.removeClass("live-preview-hover live-preview-focus live-preview-active")},get_element_class:function(e){var t={UaccordionModel:{label:s.accordion,id:"accordion"},UcommentModel:{label:s.comments,id:"comment"},UcontactModel:{label:s.contact_form,id:"contact"},UgalleryModel:{label:s.gallery,id:"gallery"},UimageModel:{label:s.image,id:"image"},LoginModel:{label:s.login,id:"login"},LikeBox:{label:s.like_box,id:"likebox"},MapModel:{label:s.map,id:"maps"},UnewnavigationModel:{label:s.navigation,id:"nav"},ButtonModel:{label:s.button,id:"button"},PostsModel:{label:s.posts,id:"posts"},PostsListsModel:{label:s.posts,id:"posts"},UsearchModel:{label:s.search,id:"search"},USliderModel:{label:s.slider,id:"slider"},SocialMediaModel:{label:s.social,id:"SocialMedia"},UtabsModel:{label:s.tabs,id:"tabs"},ThisPageModel:{label:s.page,id:"this_page"},ThisPostModel:{label:s.post,id:"this_post"},UwidgetModel:{label:s.widget,id:"widget"},UyoutubeModel:{label:s.youtube,id:"youtube"},PlainTxtModel:{label:s.text,id:"text"}},i=t[e]||"default";return"upfront-icon-element upfront-icon-element-"+i.id},render:function(){var e=this,t=new n.Command_Menu({model:this.model}),a=this.model.get_property_value_by_name("type");this.$el.html('<div class="upfront-settings-title '+this.get_element_class(a)+'">'+this.title+' <ul class="sidebar-commands sidebar-commands-header"></ul></div><div id="sidebar-scroll-wrapper" />'),t.render(),this.$el.find(".upfront-settings-title ul").append(t.$el),Upfront.Events.trigger("settings:prepare"),_.each(this.panels,function(t){t.render(),t.parent_view=e,e.$el.find("#sidebar-scroll-wrapper").append(t.el),i.withDebounceUpdate(e.$el.find("#sidebar-scroll-wrapper")[0],!1,"menu_element:settings:rendered",!0)}),this.$el.addClass("upfront-ui"),this.$el.append("<div class='upfront-settings-button_panel'><button type='button' class='upfront-cancel_settings sidebar-commands-button light'>"+s.cancel+"</button><button type='button' class='upfront-save_settings sidebar-commands-button blue'><i class='icon-ok'></i> "+s.save_element+"</button></div>")},setScrollMaxHeight:function(){var e=this.$el.height(),t=this.$el.find(">.upfront-settings-title").outerHeight(!0),i=this.$el.find(">.upfront-settings-button_panel").outerHeight(!0);this.$el.find("#sidebar-scroll-wrapper").css("max-height",e-t-i+"px")},cleanUp:function(){this.panels&&_.each(this.panels,function(e){e.cleanUp&&e.cleanUp()}),this.remove()}});return a})}(jQuery);