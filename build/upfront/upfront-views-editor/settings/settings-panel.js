!function(e){var t=Upfront.Settings&&Upfront.Settings.l10n?Upfront.Settings.l10n.global.views:Upfront.mainData.l10n.global.views;define(["scripts/upfront/upfront-views-editor/mixins","scripts/upfront/upfront-views-editor/settings/settings-item","scripts/upfront/upfront-views-editor/fields"],function(i,n,s){var o=n.extend({className:"upfront-settings-css",events:{"click .upfront-css-edit":"openEditor"},initialize:function(e){if(n.prototype.initialize.call(this,e),!Upfront.Application.cssEditor)return!1;var i=Upfront.Application.cssEditor.getElementType(this.model),s=[{label:t.default_str,value:"_default"}];Upfront.data.styles[i.id]&&_.each(Upfront.data.styles[i.id],function(e){e.indexOf("_default")>-1||s.push({label:e,value:e})}),this.fields=_([new Upfront.Views.Editor.Field.Button({model:this.model,className:"edit-preset-css-label",compact:!0,label:t.edit_css_label}),new Upfront.Views.Editor.Field.Button({model:this.model,className:"upfront-css-edit upfront-small-button",compact:!0,name:"preset_css",label:t.edit_css})])},openEditor:function(e){e.preventDefault(),Upfront.Events.trigger("entity:settings:beforedeactivate"),Upfront.Application.cssEditor.init({model:this.model,stylename:"_default"}),Upfront.Events.trigger("entity:settings:deactivate")}}),l=n.extend({className:"upfront-settings-padding",initialize:function(i){var o=Upfront.Settings.LayoutEditor.Grid.column_padding,l=this.model instanceof Upfront.Models.ModuleGroup,a=new s.Checkboxes({model:this.model,use_breakpoint_property:!0,property:"top_padding_use",label:"",multiple:!1,values:[{label:t.top_padding,value:"yes"}],default_value:this.model.get_breakpoint_property_value("top_padding_use")||!1,change:function(){var e=this.get_value();this.model.set_breakpoint_property("top_padding_use",e?e:0)},show:function(t,i){"yes"===t?(e(r.$el).css("display","inline-block"),e(d.$el).css("display","inline-block")):(e(r.$el).hide(),e(d.$el).hide())}}),r=new s.Slider({model:this.model,use_breakpoint_property:!0,property:"top_padding_slider",label:"",default_value:this.model.get_breakpoint_property_value("top_padding_slider")||o,min:0,max:200,step:5,valueTextFilter:function(){return""},change:function(){var e=this.get_value();this.model.set_breakpoint_property("top_padding_slider",e),d.get_field().val(e),this.model.set_breakpoint_property("top_padding_num",e,!0)}}),d=new s.Number({model:this.model,use_breakpoint_property:!0,property:"top_padding_num",label:"",default_value:this.model.get_breakpoint_property_value("top_padding_num")||o,suffix:t.px,min:0,step:5,change:function(){var e=this.get_value();this.model.set_breakpoint_property("top_padding_num",e),this.model.set_breakpoint_property("top_padding_slider",e,!0),r.$el.find("#"+r.get_field_id()).slider("value",e)}}),p=new s.Checkboxes({model:this.model,use_breakpoint_property:!0,property:"bottom_padding_use",label:"",multiple:!1,values:[{label:t.bottom_padding,value:"yes"}],default_value:this.model.get_breakpoint_property_value("bottom_padding_use")||!1,change:function(){var e=this.get_value();this.model.set_breakpoint_property("bottom_padding_use",e?e:0)},show:function(t,i){"yes"===t?(e(g.$el).css("display","inline-block"),e(u.$el).css("display","inline-block")):(e(g.$el).hide(),e(u.$el).hide())}}),g=new s.Slider({model:this.model,use_breakpoint_property:!0,property:"bottom_padding_slider",label:"",default_value:this.model.get_breakpoint_property_value("bottom_padding_slider")||o,min:0,max:200,step:5,valueTextFilter:function(){return""},change:function(){var e=this.get_value();this.model.set_breakpoint_property("bottom_padding_slider",e),u.get_field().val(e),this.model.set_breakpoint_property("bottom_padding_num",e,!0)}}),u=new s.Number({model:this.model,use_breakpoint_property:!0,property:"bottom_padding_num",label:"",default_value:this.model.get_breakpoint_property_value("bottom_padding_num")||o,suffix:t.px,min:0,step:5,change:function(){var e=this.get_value();this.model.set_breakpoint_property("bottom_padding_num",e),this.model.set_breakpoint_property("bottom_padding_slider",e,!0),g.$el.find("#"+g.get_field_id()).slider("value",e)}});if(!l)var h=new s.Checkboxes({model:this.model,use_breakpoint_property:!0,property:"left_padding_use",label:"",multiple:!1,values:[{label:t.left_padding,value:"yes"}],default_value:this.model.get_breakpoint_property_value("left_padding_use")||!1,change:function(){var e=this.get_value();this.model.set_breakpoint_property("left_padding_use",e?e:0)},show:function(t,i){"yes"===t?(e(f.$el).css("display","inline-block"),e(c.$el).css("display","inline-block")):(e(f.$el).hide(),e(c.$el).hide())}}),f=new s.Slider({model:this.model,use_breakpoint_property:!0,property:"left_padding_slider",label:"",default_value:this.model.get_breakpoint_property_value("left_padding_slider")||o,min:0,max:200,step:5,valueTextFilter:function(){return""},change:function(){var e=this.get_value();this.model.set_breakpoint_property("left_padding_slider",e),c.get_field().val(e),this.model.set_breakpoint_property("left_padding_num",e,!0)}}),c=new s.Number({model:this.model,use_breakpoint_property:!0,property:"left_padding_num",label:"",default_value:this.model.get_breakpoint_property_value("left_padding_num")||o,suffix:t.px,min:0,step:5,change:function(){var e=this.get_value();this.model.set_breakpoint_property("left_padding_num",e),this.model.set_breakpoint_property("left_padding_slider",e,!0),f.$el.find("#"+f.get_field_id()).slider("value",e)}}),m=new s.Checkboxes({model:this.model,use_breakpoint_property:!0,property:"right_padding_use",label:"",multiple:!1,values:[{label:t.right_padding,value:"yes"}],default_value:this.model.get_breakpoint_property_value("right_padding_use")||!1,change:function(){var e=this.get_value();this.model.set_breakpoint_property("right_padding_use",e?e:0)},show:function(t,i){"yes"===t?(e(b.$el).css("display","inline-block"),e(v.$el).css("display","inline-block")):(e(b.$el).hide(),e(v.$el).hide())}}),b=new s.Slider({model:this.model,use_breakpoint_property:!0,property:"right_padding_slider",label:"",default_value:this.model.get_breakpoint_property_value("right_padding_slider")||o,min:0,max:200,step:5,valueTextFilter:function(){return""},change:function(){var e=this.get_value();this.model.set_breakpoint_property("right_padding_slider",e),v.get_field().val(e),this.model.set_breakpoint_property("right_padding_num",e,!0)}}),v=new s.Number({model:this.model,use_breakpoint_property:!0,property:"right_padding_num",label:"",default_value:this.model.get_breakpoint_property_value("right_padding_num")||o,suffix:t.px,min:0,step:5,change:function(){var e=this.get_value();this.model.set_breakpoint_property("right_padding_num",e),this.model.set_breakpoint_property("right_padding_slider",e,!0),b.$el.find("#"+b.get_field_id()).slider("value",e)}});n.prototype.initialize.call(this,i),l?this.fields=_([a,r,d,p,g,u]):this.fields=_([a,r,d,p,g,u,h,f,c,m,b,v])}}),a=n.extend({className:"upfront-settings-item-anchor",initialize:function(e){this.options=e,n.prototype.initialize.call(this,this.options);var i=new s.Field_Complex_Toggleable_Text_Field({element_label:t.make_element_anchor,className:"upfront-field-complex_field-boolean_toggleable_text upfront-field-multiple checkbox-title",model:this.model,property:"anchor"});i.on("anchor:updated",function(){this.trigger("anchor:item:updated")},this),this.fields=_([i])},save_fields:function(){this.fields.invoke("check_value"),n.prototype.save_fields.call(this)}}),r=Backbone.View.extend(_.extend({},i.Upfront_Scroll_Mixin,{className:"upfront-settings_panel_wrap",hide_common_anchors:!1,hide_common_fields:!1,events:{"click .upfront-save_settings":"on_save","click .upfront-cancel_settings":"on_cancel","click .upfront-settings_label":"on_toggle","click .upfront-settings-common_panel .upfront-settings-item-title":"on_toggle_common","click .upfront-settings-padding_panel .upfront-settings-item-title":"on_toggle_padding"},get_title:function(){return this.options.title?this.options.title:""},get_label:function(){return this.options.label?this.options.label:""},initialize:function(e){var t=this;this.hide_common_fields=!_.isUndefined(e.hide_common_fields)&&e.hide_common_fields,this.hide_common_anchors=!_.isUndefined(e.hide_common_anchors)&&e.hide_common_anchors,t.options=e,this.settings=e.settings?_(e.settings):_([]),this.settings.each(function(e){e.panel=t,e.trigger("panel:set")}),this.tabbed="undefined"!=typeof e.tabbed?e.tabbed:this.tabbed},tabbed:!1,is_changed:!1,render:function(){this.$el.html('<div class="upfront-settings_label" /><div class="upfront-settings_panel" ><div class="upfront-settings_panel_scroll" />');var e,i=this.$el.find(".upfront-settings_label"),n=this.$el.find(".upfront-settings_panel"),s=this.$el.find(".upfront-settings_panel_scroll"),o=this;if(i.append(this.get_label()),this.settings.each(function(e){e.panel||(e.panel=o),e.render(),s.append(e.el)}),this.options.min_height&&s.css("min-height",this.options.min_height),this.tabbed){var r=this.settings.first();r.radio||r.reveal(),s.append('<div class="upfront-settings-tab-height" />')}if(this.stop_scroll_propagation(s),this.hide_common_fields===!1&&(this.$el.find(".upfront-settings_panel_scroll").after('<div class="upfront-settings-common_panel"></div>'),e=this.$el.find(".upfront-settings-common_panel"),this.hide_common_anchors===!1)){var d=new a({model:this.model,title:t.anchor_settings});d.panel=o,d.render(),e.append(d.el)}this.$el.find(".upfront-settings_panel_scroll").after('<div class="upfront-settings-padding_panel"></div>'),$padding_panel=this.$el.find(".upfront-settings-padding_panel"),("undefined"==typeof this.paddingEditor||this.paddingEditor)&&(this.paddingEditor=new l({model:this.model,title:t.padding_settings}),this.paddingEditor.panel=o,this.paddingEditor.render(),$padding_panel.append(this.paddingEditor.el)),n.append("<div class='upfront-settings-button_panel'><button type='button' class='upfront-save_settings sidebar-commands-button blue'><i class='icon-ok'></i> "+t.ok+"</button></div>"),this.$el.fadeIn("fast",function(){var e=o.$el.parent(),t=(e.offset()?e.offset().top:0)+e.height(),i=jQuery(window).height();t+60>i+jQuery("body").scrollTop()&&jQuery("body").animate({scrollTop:t-i+60},"slow")}),this.trigger("rendered")},on_toggle_common:function(){var e=this.$el.find(".upfront-settings-common_panel");e.toggleClass("open")},on_toggle_padding:function(){var e=this.$el.find(".upfront-settings-padding_panel");e.toggleClass("open")},conceal:function(){this.$el.find(".upfront-settings_panel").hide(),this.$el.find(".upfront-settings_label").removeClass("active"),this.trigger("concealed")},reveal:function(){if(this.$el.find(".upfront-settings_label").addClass("active"),this.$el.find(".upfront-settings_panel").show(),this.tabbed){var t=0;this.$el.find(".upfront-settings-item-tab-content").each(function(){var i=e(this).outerHeight(!0);t=i>t?i:t}),this.$el.find(".upfront-settings-tab-height").css("height",t)}this.trigger("revealed")},show:function(){this.$el.show()},hide:function(){this.$el.hide()},is_active:function(){return this.$el.find(".upfront-settings_panel").is(":visible")},on_toggle:function(){this.trigger("upfront:settings:panel:toggle",this),this.show()},start_loading:function(e,t){this.loading=new Upfront.Views.Editor.Loading({loading:e,done:t}),this.loading.render(),this.$el.find(".upfront-settings_panel").append(this.loading.$el)},end_loading:function(e){this.loading?this.loading.done(e):e()},on_save:function(){var e=!1;this.parent_view.panels.each(function(t){t.save_settings(),t.is_changed&&(e=!0,t.is_changed=!1)}),e&&this.parent_view.model.get("properties").trigger("change"),this.trigger("upfront:settings:panel:saved",this),Upfront.Events.trigger("entity:settings:deactivate")},save_settings:function(){if(!this.settings)return!1;var e=this;this.settings.each(function(t){if((t.fields||t.settings).size()>0)t.save_fields();else{var i=e.model.get_property_value_by_name(t.get_name());i!=t.get_value()&&e.model.set_property(t.get_name(),t.get_value())}}),Upfront.Events.trigger("entity:settings:saved")},on_cancel:function(){this.trigger("upfront:settings:panel:close",this)},remove:function(){this.settings&&this.settings.each(function(e){e.remove()}),this.$el.off(),Backbone.View.prototype.remove.call(this)}}));return{Settings_CSS:o,Panel:r,AnchorSetting:a}})}(jQuery);