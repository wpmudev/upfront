!function(e){var i=Upfront.Settings&&Upfront.Settings.l10n?Upfront.Settings.l10n.global.views:Upfront.mainData.l10n.global.views;upfrontrjs.define(["scripts/upfront/bg-settings/mixins"],function(t){var o=Upfront.Views.Editor.Settings.Item.extend(_.extend({},t,{group:!1,initialize:function(e){var t=this,o={default_value:50,min:0,max:100,step:1},a=["bg_tile"],l=["bg_color","bg_position_x","bg_position_y","bg_position_x_num","bg_position_y_num","use_bg_size","bg_size"],n=["origin_position_x","origin_position_y","origin_position_x_num","origin_position_y_num","use_bg_size","bg_size"],r={pick_image:new Upfront.Views.Editor.Field.Button({label:i.browse,compact:!0,classname:"uf-button-alt uf-bgsettings-image-pick",on_click:function(){t.upload_image()}}),bg_style:new Upfront.Views.Editor.Field.Select({model:this.model,label:i.image_type,className:"upfront-field-wrap upfront-field-wrap-select background-image-field",property:"background_style",use_breakpoint_property:!0,default_value:"full",icon_class:"upfront-region-field-icon",values:this.get_bg_style_values(),change:function(){var e=this.get_value();"tile"===e?(_.each(a,function(e){r[e].$el.show()}),_.each(l,function(e){r[e].$el.hide()}),_.each(n,function(e){r[e].$el.hide()}),this.$el.children(".upfront-field-select").css("minWidth","100%")):"fixed"===e?(_.each(a,function(e){r[e].$el.hide()}),_.each(n,function(e){r[e].$el.hide()}),_.each(l,function(e){if("background_size_percent"==r[e].property_name){var i=t.model.get_breakpoint_property_value("use_background_size_percent",!0)||!1;i!==!1&&r[e].$el.show()}else r[e].$el.show()}),this.$el.children(".upfront-field-select").css({width:"100px",minWidth:"100px"})):"parallax"===e?(_.each(a,function(e){r[e].$el.hide()}),_.each(l,function(e){r[e].$el.hide()}),_.each(n,function(e){if("background_size_percent"==r[e].property_name){var i=t.model.get_breakpoint_property_value("use_background_size_percent",!0)||!1;i!==!1&&r[e].$el.show()}else r[e].$el.show()}),this.$el.children(".upfront-field-select").css("minWidth","100%")):(_.each(a,function(e){r[e].$el.hide()}),_.each(l,function(e){r[e].$el.hide()}),_.each(n,function(e){r[e].$el.hide()}),this.$el.children(".upfront-field-select").css("minWidth","100%")),t._bg_style=e,t.update_image()},rendered:function(){this.$el.addClass("uf-bgsettings-image-style")}}),bg_tile:new Upfront.Views.Editor.Field.Toggle({model:this.model,layout:"horizontal-inline",default_value:["y","x"],values:[{label:i.tile_vertically,value:"y"},{label:i.tile_horizontally,value:"x"}],change:function(){var e=this.get_value();t._bg_tile=e,t.update_image()},rendered:function(){this.$el.addClass("uf-bgsettings-image-tile")}}),bg_color:new Upfront.Views.Editor.Field.Color({model:this.model,label:i.bg_color_short,property:"background_color",use_breakpoint_property:!0,default_value:"#ffffff",spectrum:{move:function(e){t.preview_color(e)},change:function(e){t.update_color(e)},hide:function(e){t.reset_color()}},rendered:function(){this.$el.addClass("uf-bgsettings-image-color")}}),bg_position_y:new Upfront.Views.Editor.Field.Slider(_.extend({model:this.model,label:i.image_position,orientation:"vertical",property:"background_position_y",use_breakpoint_property:!0,range:!1,change:function(){var e=this.get_value();r.bg_position_y_num.get_field().val(e),t._bg_position_y=e,this.model.set_breakpoint_property(this.property_name,e),t.update_image()},rendered:function(){this.$el.addClass("uf-bgsettings-image-pos-y")}},o)),bg_position_x:new Upfront.Views.Editor.Field.Slider(_.extend({model:this.model,property:"background_position_x",use_breakpoint_property:!0,range:!1,change:function(){var e=this.get_value();r.bg_position_x_num.get_field().val(e),t._bg_position_x=e,this.model.set_breakpoint_property(this.property_name,e),t.update_image()},rendered:function(){this.$el.addClass("uf-bgsettings-image-pos-x")}},o)),bg_position_y_num:new Upfront.Views.Editor.Field.Number(_.extend({model:this.model,label:"Y:",label_style:"inline",suffix:"%",change:function(){var e=this.get_value(),i=r.bg_position_y;i.$el.find("#"+i.get_field_id()).slider("value",e),i.get_field().val(e),i.trigger("changed")},rendered:function(){this.$el.addClass("uf-bgsettings-image-pos-y-num")}},o)),bg_position_x_num:new Upfront.Views.Editor.Field.Number(_.extend({model:this.model,label:"X:",label_style:"inline",suffix:"%",change:function(){var e=this.get_value(),i=r.bg_position_x;i.$el.find("#"+i.get_field_id()).slider("value",e),i.get_field().val(e),i.trigger("changed")},rendered:function(){this.$el.addClass("uf-bgsettings-image-pos-x-num")}},o)),origin_position_y:new Upfront.Views.Editor.Field.Slider(_.extend({model:this.model,label:i.origin_position,orientation:"vertical",property:"origin_position_y",use_breakpoint_property:!0,range:!1,change:function(){var e=this.get_value();r.origin_position_y_num.get_field().val(e),t._origin_position_y=e,this.model.set_breakpoint_property(this.property_name,e),t.update_image()},rendered:function(){this.$el.addClass("uf-bgsettings-image-pos-y")}},{default_value:50,min:-50,max:150,step:1})),origin_position_x:new Upfront.Views.Editor.Field.Slider(_.extend({model:this.model,property:"origin_position_x",use_breakpoint_property:!0,range:!1,change:function(){var e=this.get_value();r.origin_position_x_num.get_field().val(e),t._origin_position_x=e,this.model.set_breakpoint_property(this.property_name,e),t.update_image()},rendered:function(){this.$el.addClass("uf-bgsettings-image-pos-x")}},{default_value:50,min:-50,max:150,step:1})),origin_position_y_num:new Upfront.Views.Editor.Field.Number(_.extend({model:this.model,label:"Y:",label_style:"inline",suffix:"%",change:function(){var e=this.get_value(),i=r.origin_position_y;i.$el.find("#"+i.get_field_id()).slider("value",e),i.get_field().val(e),i.trigger("changed")},rendered:function(){this.$el.addClass("uf-bgsettings-image-pos-y-num uf-bgsettings-origin-pos-y-num")}},{default_value:50,min:-50,max:150,step:1})),origin_position_x_num:new Upfront.Views.Editor.Field.Number(_.extend({model:this.model,label:"X:",label_style:"inline",suffix:"%",change:function(){var e=this.get_value(),i=r.origin_position_x;i.$el.find("#"+i.get_field_id()).slider("value",e),i.get_field().val(e),i.trigger("changed")},rendered:function(){this.$el.addClass("uf-bgsettings-image-pos-x-num uf-bgsettings-origin-pos-x-num")}},{default_value:50,min:-50,max:150,step:1})),use_bg_size:new Upfront.Views.Editor.Field.Toggle({model:this.model,property:"use_background_size_percent",label:"",multiple:!1,use_breakpoint_property:!0,values:[{label:i.resize_image,value:"yes"}],change:function(){var e=this.get_value(),i=t.$el.find(".uf-bgsettings-image-size"),o=e||!1;this.model.set_breakpoint_property(this.property_name,e),i.find('input[name="background_size_percent"]').val(100),t.model.set_breakpoint_property("background_size_percent",100),o===!1?(i.hide(),t._bg_size="auto",t.update_image()):(t._bg_size=100,t.update_image(),i.show())},rendered:function(){this.$el.addClass("uf-bgsettings-use-image-size")}}),bg_size:new Upfront.Views.Editor.Field.Number(_.extend({model:this.model,property:"background_size_percent",label:"",use_breakpoint_property:!0,suffix:i.resize_image_percent,change:function(){var e=this.get_value();t._bg_size=e,this.model.set_breakpoint_property(this.property_name,e),t.update_image()},rendered:function(){this.$el.addClass("uf-bgsettings-image-size")}},{default_value:100,min:0,max:1e3,step:1})),bg_default:new Upfront.Views.Editor.Field.Select({model:this.model,label:i.featured_default,className:"upfront-field-wrap upfront-field-wrap-select background-image-field",property:"background_default",use_breakpoint_property:!0,default_value:"hide",icon_class:"upfront-region-field-icon",values:[{label:i.featured_default_hide,value:"hide"},{label:i.featured_default_color,value:"color"},{label:i.featured_default_image,value:"image"}],change:function(){var e=this.get_value(),i=t.model.get_breakpoint_property_value("background_image",!0);this.$el.removeClass("uf-bgsettings-image-default-image uf-bgsettings-image-default-color uf-bgsettings-image-default-hide"),"image"==e?(r.featured_fallback_pick_image.$el.show(),r.featured_fallback_bg_color.$el.hide(),this.$el.addClass("uf-bgsettings-image-default-image"),i||t.upload_image()):"color"==e?(r.featured_fallback_bg_color.$el.show(),r.featured_fallback_pick_image.$el.hide(),this.$el.addClass("uf-bgsettings-image-default-color")):"featured"==e?(r.featured_fallback_bg_color.$el.hide(),this.$el.addClass("uf-bgsettings-image-default-image")):(r.featured_fallback_bg_color.$el.hide(),r.featured_fallback_pick_image.$el.hide(),this.$el.addClass("uf-bgsettings-image-default-hide")),this.model.set_breakpoint_property(this.property_name,e),t.update_image()},rendered:function(){var e=this.get_saved_value();this.$el.addClass("uf-bgsettings-image-default"),"image"==e?this.$el.addClass("uf-bgsettings-image-default-image"):"color"==e?this.$el.addClass("uf-bgsettings-image-default-color"):this.$el.addClass("uf-bgsettings-image-default-hide"),this.$el.children("upfront-field-select-single").css({maxWidth:"100%"})}}),featured_fallback_bg_color:new Upfront.Views.Editor.Field.Color({model:this.model,label:i.bg_color_short,property:"featured_fallback_background_color",use_breakpoint_property:!0,default_value:"#ffffff",spectrum:{move:function(e){t.is_featured_fallback_bg_color=!0,t.preview_color(e),t.is_featured_fallback_bg_color=!1},change:function(e){t.is_featured_fallback_bg_color=!0,t.update_color(e),t.is_featured_fallback_bg_color=!1},hide:function(e){t.is_featured_fallback_bg_color=!0,t.reset_color(),t.is_featured_fallback_bg_color=!1}},rendered:function(){this.$el.addClass("uf-bgsettings-featured-fallback-image-color")}}),featured_fallback_pick_image:new Upfront.Views.Editor.Field.Button({label:i.browse,compact:!0,classname:"uf-button-alt uf-bgsettings-featured-fallback-image-pick",on_click:function(){t.upload_image()}})};this.$el.addClass("uf-bgsettings-item uf-bgsettings-imageitem"),e.fields=_.map(r,function(e){return e}),this.on("show",function(){var e=t.model.get_breakpoint_property_value("background_type",!0),i=t.model.get_breakpoint_property_value("background_image",!0);t.model.get_breakpoint_property_value("background_default",!0);t._bg_style=r.bg_style.get_value(),t._bg_tile=r.bg_tile.get_value(),t._bg_size=r.bg_size.get_value(),r.bg_size.trigger("changed"),t._bg_position_y=r.bg_position_y.get_value(),r.bg_position_y.trigger("changed"),t._origin_position_y=r.origin_position_y.get_value(),r.origin_position_y.trigger("changed"),t._bg_position_x=r.bg_position_x.get_value(),r.bg_position_x.trigger("changed"),t._origin_position_x=r.origin_position_y.get_value(),r.origin_position_x.trigger("changed"),r.bg_style.trigger("changed"),"featured"==e?(r.pick_image.$el.hide(),r.bg_default.$el.show(),r.bg_default.trigger("changed")):("image"==e&&r.pick_image.$el.show(),r.bg_default.$el.hide(),r.featured_fallback_bg_color.$el.hide(),r.featured_fallback_pick_image.$el.hide(),i||t.upload_image())}),this.bind_toggles(),this.constructor.__super__.initialize.call(this,e)},update_image:function(){var e=this._bg_style,i=this._bg_tile,t=_.contains(i,"y"),o=_.contains(i,"x"),a=this._bg_position_y,l=this._bg_position_x,n=this.model.get_breakpoint_property_value("use_background_size_percent",!0)||!1,r=n===!1&&"auto"!==this._bg_size?"auto":this._bg_size;"full"==e?(this.model.set_breakpoint_property("background_style","full"),this.$el.children(".upfront-field-select").css({minWidth:"100%"})):"tile"==e?(this.model.set_breakpoint_property("background_style","tile"),o&&t?this.model.set_breakpoint_property("background_repeat","repeat"):t?this.model.set_breakpoint_property("background_repeat","repeat-y"):o?this.model.set_breakpoint_property("background_repeat","repeat-x"):this.model.set_breakpoint_property("background_repeat","no-repeat"),this.$el.children(".upfront-field-select").css({minWidth:"100%"})):"fixed"==e?(this.model.set_breakpoint_property("background_style","fixed"),this.model.set_breakpoint_property("background_repeat","no-repeat"),this.model.set_breakpoint_property("background_position",l+"% "+a+"%"),this.model.set_breakpoint_property("background_size","auto"==r?r:r+"%"),this.$el.children(".upfront-field-select").css({width:"100px",minWidth:"100px"})):"parallax"===e?(this.model.set_breakpoint_property("background_style","parallax"),this.model.set_breakpoint_property("background_position",this._origin_position_x+"% "+this._origin_position_y+"%"),this.model.set_breakpoint_property("background_size","auto"==r?r:r+"%"),this.$el.children(".upfront-field-select").css({minWidth:"100%"})):(this.model.set_breakpoint_property("background_style",e),this.$el.children(".upfront-field-select").css({minWidth:"100%"}))},update_settings_header:function(){var i=this.model.get_breakpoint_property_value("background_image");e("#region-settings-sidebar .upfront-region-type-icon").addClass("upfront-region-type-icon-image-url").removeClass("upfront-region-type-icon-image upfront-region-type-icon-featured").css({backgroundImage:"url("+i+")"})},get_bg_style_values:function(){var e=[{label:i.full_width_bg,value:"full"},{label:i.tiled_pattern,value:"tile"},{label:i.fixed_position,value:"fixed"}];return this.model instanceof Upfront.Models.Region&&e.push({label:i.parallax,value:"parallax"}),e}}));return o})}(jQuery);