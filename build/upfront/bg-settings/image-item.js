(function(e){var t=Upfront.Settings&&Upfront.Settings.l10n?Upfront.Settings.l10n.global.views:Upfront.mainData.l10n.global.views;define(["scripts/upfront/bg-settings/mixins"],function(e){var n=Upfront.Views.Editor.Settings.Item.extend(_.extend({},e,{group:!1,initialize:function(e){var n=this,r={default_value:50,min:0,max:100,step:1},i=["bg_tile"],s=["bg_color","bg_position_x","bg_position_y","bg_position_x_num","bg_position_y_num"],o={pick_image:new Upfront.Views.Editor.Field.Button({label:t.pick_image,compact:!0,classname:"uf-button-alt uf-bgsettings-image-pick",on_click:function(){n.upload_image()}}),bg_style:new Upfront.Views.Editor.Field.Select({model:this.model,label:t.image_type,className:"upfront-field-wrap upfront-field-wrap-select background-image-field",property:"background_style",use_breakpoint_property:!0,default_value:"full",icon_class:"upfront-region-field-icon",values:[{label:t.full_width_bg,value:"full",icon:"bg-image-full"},{label:t.tiled_pattern,value:"tile",icon:"bg-image-tile"},{label:t.fixed_position,value:"fixed",icon:"bg-image-fixed"},{label:t.parallax,value:"parallax",icon:"bg-image-full"}],change:function(){var e=this.get_value();e=="tile"?(_.each(i,function(e){o[e].$el.show()}),_.each(s,function(e){o[e].$el.hide()})):e=="fixed"?(_.each(i,function(e){o[e].$el.hide()}),_.each(s,function(e){o[e].$el.show()})):(_.each(i,function(e){o[e].$el.hide()}),_.each(s,function(e){o[e].$el.hide()})),n._bg_style=e,n.update_image()},rendered:function(){this.$el.addClass("uf-bgsettings-image-style")}}),bg_tile:new Upfront.Views.Editor.Field.Checkboxes({model:this.model,layout:"horizontal-inline",default_value:["y","x"],values:[{label:t.tile_vertically,value:"y"},{label:t.tile_horizontally,value:"x"}],change:function(){var e=this.get_value();n._bg_tile=e,n.update_image()},rendered:function(){this.$el.addClass("uf-bgsettings-image-tile")}}),bg_color:new Upfront.Views.Editor.Field.Color({model:this.model,label:t.bg_color_short,property:"background_color",use_breakpoint_property:!0,default_value:"#ffffff",spectrum:{move:function(e){n.preview_color(e)},change:function(e){n.update_color(e)},hide:function(e){n.reset_color()}},rendered:function(){this.$el.addClass("uf-bgsettings-image-color")}}),bg_position_y:new Upfront.Views.Editor.Field.Slider(_.extend({model:this.model,label:t.image_position,orientation:"vertical",property:"background_position_y",use_breakpoint_property:!0,range:!1,change:function(){var e=this.get_value();o.bg_position_y_num.get_field().val(e),n._bg_position_y=e,this.model.set_breakpoint_property(this.property_name,e),n.update_image()},rendered:function(){this.$el.addClass("uf-bgsettings-image-pos-y")}},r)),bg_position_x:new Upfront.Views.Editor.Field.Slider(_.extend({model:this.model,property:"background_position_x",use_breakpoint_property:!0,range:!1,change:function(){var e=this.get_value();o.bg_position_x_num.get_field().val(e),n._bg_position_x=e,this.model.set_breakpoint_property(this.property_name,e),n.update_image()},rendered:function(){this.$el.addClass("uf-bgsettings-image-pos-x")}},r)),bg_position_y_num:new Upfront.Views.Editor.Field.Number(_.extend({model:this.model,label:"Y:",label_style:"inline",suffix:"%",change:function(){var e=this.get_value(),t=o.bg_position_y;t.$el.find("#"+t.get_field_id()).slider("value",e),t.get_field().val(e),t.trigger("changed")},rendered:function(){this.$el.addClass("uf-bgsettings-image-pos-y-num")}},r)),bg_position_x_num:new Upfront.Views.Editor.Field.Number(_.extend({model:this.model,label:"X:",label_style:"inline",suffix:"%",change:function(){var e=this.get_value(),t=o.bg_position_x;t.$el.find("#"+t.get_field_id()).slider("value",e),t.get_field().val(e),t.trigger("changed")},rendered:function(){this.$el.addClass("uf-bgsettings-image-pos-x-num")}},r))};this.$el.addClass("uf-bgsettings-item uf-bgsettings-imageitem"),e.fields=_.map(o,function(e){return e}),this.on("show",function(){var e=n.model.get_breakpoint_property_value("background_type",!0),t=n.model.get_breakpoint_property_value("background_image",!0);e=="featured"?o.pick_image.$el.hide():t||n.upload_image(),n._bg_style=o.bg_style.get_value(),n._bg_tile=o.bg_tile.get_value(),n._bg_position_y=o.bg_position_y.get_value(),o.bg_position_y.trigger("changed"),n._bg_position_x=o.bg_position_x.get_value(),o.bg_position_x.trigger("changed"),o.bg_style.trigger("changed")}),this.bind_toggles(),this.constructor.__super__.initialize.call(this,e)},update_image:function(){var e=this._bg_style,t=this._bg_tile,n=_.contains(t,"y"),r=_.contains(t,"x"),i=this._bg_position_y,s=this._bg_position_x;e=="full"?this.model.set_breakpoint_property("background_style","full"):e=="tile"?(this.model.set_breakpoint_property("background_style","tile"),r&&n?this.model.set_breakpoint_property("background_repeat","repeat"):n?this.model.set_breakpoint_property("background_repeat","repeat-y"):r?this.model.set_breakpoint_property("background_repeat","repeat-x"):this.model.set_breakpoint_property("background_repeat","no-repeat")):e=="fixed"?(this.model.set_breakpoint_property("background_style","fixed"),this.model.set_breakpoint_property("background_repeat","no-repeat"),this.model.set_breakpoint_property("background_position",s+"% "+i+"%")):this.model.set_breakpoint_property("background_style",e)}}));return n})})(jQuery);