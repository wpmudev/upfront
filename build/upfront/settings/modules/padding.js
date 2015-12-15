define(["scripts/upfront/settings/modules/base-module"],function(e){var t=Upfront.Settings.l10n.preset_manager,n=e.extend({className:"padding-settings sidebar-settings clearfix",initialize:function(e){this.options=e||{};var n=this,r=Upfront.Settings.LayoutEditor.Grid.column_padding;this.listenTo(Upfront.Events,"upfront:paddings:updated",this.refresh),this.fields=_([new Upfront.Views.Editor.Field.Checkboxes({model:this.model,className:"use-padding checkbox-title",use_breakpoint_property:!0,property:"use_padding",label:"",default_value:this.model.get_breakpoint_property_value("top_padding_use")||this.model.get_breakpoint_property_value("bottom_padding_use")||this.model.get_breakpoint_property_value("left_padding_use")||this.model.get_breakpoint_property_value("right_padding_use"),multiple:!1,values:[{label:"Customize Padding",value:"yes"}],change:function(e){n.model.set_property("use_padding",e),typeof e=="undefined"&&(n.model.set_property("left_padding_num",r,!0),n.model.set_property("top_padding_num",r,!0),n.model.set_property("right_padding_num",r,!0),n.model.set_property("bottom_padding_num",r,!0),padding_left.get_field().val(r),padding_top.get_field().val(r),padding_right.get_field().val(r),padding_bottom.get_field().val(r),n.disable_paddings())},show:function(e,t){var r=t.closest(".upfront-settings-item-content"),i=n.model.get_property_value_by_name("lock_padding");e=="yes"?i=="yes"?(r.find(".padding-slider").show(),r.find(".padding-number").show()):(r.find(".padding-top").show(),r.find(".padding-bottom").show(),r.find(".padding-left").show(),r.find(".padding-right").show()):(r.find(".padding-top").hide(),r.find(".padding-bottom").hide(),r.find(".padding-left").hide(),r.find(".padding-right").hide(),r.find(".padding-slider").hide(),r.find(".padding-number").hide())}}),lock_padding=new Upfront.Views.Editor.Field.Checkboxes({model:this.model,className:"padding-lock",use_breakpoint_property:!0,property:"lock_padding",label:"",default_value:0,multiple:!1,values:[{label:"",value:"yes"}],show:function(e){n.model.set_property("lock_padding",e);var t=n.$el,r=n.model.get_property_value_by_name("use_padding"),i=n.model.get_property_value_by_name("padding_number");e=="yes"&&r=="yes"?(t.find(".padding-slider").show(),t.find(".padding-number").show(),t.find(".padding-top").hide(),t.find(".padding-bottom").hide(),t.find(".padding-left").hide(),t.find(".padding-right").hide(),n.model.set_property("left_padding_num",i),n.model.set_property("top_padding_num",i),n.model.set_property("right_padding_num",i),n.model.set_property("bottom_padding_num",i),padding_left.get_field().val(i),padding_top.get_field().val(i),padding_right.get_field().val(i),padding_bottom.get_field().val(i),Upfront.Events.trigger("upfront:paddings:updated")):r=="yes"&&(t.find(".padding-slider").hide(),t.find(".padding-number").hide(),t.find(".padding-top").show(),t.find(".padding-bottom").show(),t.find(".padding-left").show(),t.find(".padding-right").show())},change:function(e){n.model.set_property("lock_padding",e)}}),locked_slider=new Upfront.Views.Editor.Field.Slider({className:"padding-slider upfront-field-wrap",model:this.model,use_breakpoint_property:!0,property:"padding_slider",default_value:this.model.get_breakpoint_property_value("padding_slider"),suffix:t.px,step:5,min:0,max:250,change:function(e){n.model.set_property("padding_slider",e),n.model.set_property("padding_number",e,!0),n.model.set_property("left_padding_num",e,!0),n.model.set_property("top_padding_num",e,!0),n.model.set_property("right_padding_num",e,!0),n.model.set_property("bottom_padding_num",e,!0),locked_num.get_field().val(e),padding_left.get_field().val(e),padding_top.get_field().val(e),padding_right.get_field().val(e),padding_bottom.get_field().val(e),n.enable_lock_padding()},show:function(){var e=n.model.get_property_value_by_name("padding_number");e>250?n.$el.find(".padding-slider").css("opacity",.6):n.$el.find(".padding-slider").css("opacity",1)}}),locked_num=new Upfront.Views.Editor.Field.Number({className:"padding-number",model:this.model,use_breakpoint_property:!0,property:"padding_number",default_value:this.model.get_breakpoint_property_value("padding_number"),label:"",step:5,min:0,default_value:0,values:[{label:"",value:"0"}],change:function(e){n.model.set("padding_number",e),n.model.set_property("padding_slider",e),n.model.set_property("padding_number",e),locked_slider.$el.find("#"+locked_slider.get_field_id()).slider("value",e),n.model.set_property("left_padding_num",e,!0),n.model.set_property("top_padding_num",e,!0),n.model.set_property("right_padding_num",e,!0),n.model.set_property("bottom_padding_num",e,!0),padding_left.get_field().val(e),padding_top.get_field().val(e),padding_right.get_field().val(e),padding_bottom.get_field().val(e),n.enable_lock_padding(),e>250?n.$el.find(".padding-slider").css("opacity",.6):n.$el.find(".padding-slider").css("opacity",1)}}),padding_top=new Upfront.Views.Editor.Field.Number({model:this.model,className:"padding-top",use_breakpoint_property:!0,property:"top_padding_num",label:"",step:5,min:0,default_value:this.model.get_breakpoint_property_value("top_padding_num")||r,change:function(e){n.model.set_property("top_padding_num",e),n.enable_padding("top_padding_use")},focus:function(){n.$el.find(".padding-bottom label").css("border-top","3px solid #7bebc6")},blur:function(){n.$el.find(".padding-bottom label").css("border","1px dotted #7d99b3")}}),padding_left=new Upfront.Views.Editor.Field.Number({model:this.model,className:"padding-left",use_breakpoint_property:!0,property:"left_padding_num",label:"",step:5,min:0,default_value:this.model.get_breakpoint_property_value("left_padding_num")||r,change:function(e){n.model.set_property("left_padding_num",e),n.enable_padding("left_padding_use")},focus:function(){n.$el.find(".padding-bottom label").css("border-left","3px solid #7bebc6")},blur:function(){n.$el.find(".padding-bottom label").css("border","1px dotted #7d99b3")}}),padding_right=new Upfront.Views.Editor.Field.Number({model:this.model,className:"padding-right",use_breakpoint_property:!0,property:"right_padding_num",label:"",step:5,min:0,default_value:this.model.get_breakpoint_property_value("right_padding_num")||r,change:function(e){n.model.set_property("right_padding_num",e),n.enable_padding("right_padding_use")},focus:function(){n.$el.find(".padding-bottom label").css("border-right","3px solid #7bebc6")},blur:function(){n.$el.find(".padding-bottom label").css("border","1px dotted #7d99b3")}}),padding_bottom=new Upfront.Views.Editor.Field.Number({model:this.model,className:"padding-bottom",use_breakpoint_property:!0,property:"bottom_padding_num",label:"",step:5,min:0,default_value:this.model.get_breakpoint_property_value("bottom_padding_num")||r,change:function(e){n.model.set_property("bottom_padding_num",e),n.enable_padding("bottom_padding_use")},focus:function(){n.$el.find(".padding-bottom label").css("border-bottom","3px solid #7bebc6")},blur:function(){n.$el.find(".padding-bottom label").css("border","1px dotted #7d99b3")}})])},refresh:function(){this.model.set_property("use_padding","yes");var e=this.model.get_property_value_by_name("lock_padding"),t=this.fields._wrapped[1].get_field(),n=this.model.get_property_value_by_name("top_padding_num"),r=this.model.get_property_value_by_name("bottom_padding_num"),i=this.model.get_property_value_by_name("left_padding_num"),s=this.model.get_property_value_by_name("right_padding_num");e?t.attr("checked","checked"):t.removeAttr("checked"),t.trigger("change"),this.fields._wrapped[4].get_field().val(n),this.fields._wrapped[5].get_field().val(i),this.fields._wrapped[6].get_field().val(s),this.fields._wrapped[7].get_field().val(r)},enable_padding:function(e){this.model.set_breakpoint_property(e,"yes"),Upfront.Events.trigger("upfront:paddings:updated")},disable_paddings:function(){this.model.set_breakpoint_property("top_padding_use",""),this.model.set_breakpoint_property("bottom_padding_use",""),this.model.set_breakpoint_property("left_padding_use",""),this.model.set_breakpoint_property("right_padding_use",""),Upfront.Events.trigger("upfront:paddings:updated")},enable_lock_padding:function(){var e=this.model instanceof Upfront.Models.ModuleGroup;this.enable_padding("top_padding_use"),this.enable_padding("bottom_padding_use"),e||(this.enable_padding("left_padding_use"),this.enable_padding("right_padding_use"))}});return n});