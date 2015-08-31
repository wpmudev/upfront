define(["scripts/upfront/settings/modules/base-module"],function(e){var t=Upfront.Settings.l10n.preset_manager,n=e.extend({className:"settings_module corner_radius_settings_item clearfix",group:!1,get_title:function(){return this.options.title},initialize:function(e){this.options=e||{};var n=this,r=this.options.state;this.fields=_([new Upfront.Views.Editor.Field.Checkboxes({model:this.model,className:"useRadius checkbox-title",name:n.options.fields.use,label:"",default_value:1,multiple:!1,values:[{label:t.rounded_corners,value:"yes"}],change:function(e){n.model.set(n.options.fields.use,e)},show:function(e,t){var i=t.closest(".state_modules"),s=n.model.get(n.options.fields.lock);e=="yes"?s=="yes"?(i.find("."+r+"-radius-slider").show(),i.find("."+r+"-radius-slider-number").show()):(i.find("."+r+"-radius-slider").hide(),i.find("."+r+"-radius-slider-number").hide(),i.find("."+r+"-radius1").show(),i.find("."+r+"-radius2").show(),i.find("."+r+"-radius3").show(),i.find("."+r+"-radius4").show()):(i.find("."+r+"-radius1").hide(),i.find("."+r+"-radius2").hide(),i.find("."+r+"-radius3").hide(),i.find("."+r+"-radius4").hide(),i.find("."+r+"-radius-slider").hide(),i.find("."+r+"-radius-slider-number").hide())}}),new Upfront.Views.Editor.Field.Checkboxes({model:this.model,className:r+"-radius-lock border_radius_lock",name:n.options.fields.lock,label:"",default_value:0,multiple:!1,values:[{label:"",value:"yes"}],show:function(e){n.model.set(n.options.fields.lock,e);var t=n.$el.closest(".state_modules"),i=n.model.get(n.options.fields.use);e=="yes"&&i=="yes"?(t.find("."+r+"-radius-slider").show(),t.find("."+r+"-radius-slider-number").show(),t.find("."+r+"-radius1").hide(),t.find("."+r+"-radius2").hide(),t.find("."+r+"-radius3").hide(),t.find("."+r+"-radius4").hide()):i=="yes"&&(t.find("."+r+"-radius-slider").hide(),t.find("."+r+"-radius-slider-number").hide(),t.find("."+r+"-radius1").show(),t.find("."+r+"-radius2").show(),t.find("."+r+"-radius3").show(),t.find("."+r+"-radius4").show())}}),new Upfront.Views.Editor.Field.Slider({className:r+"-radius-slider upfront-field-wrap upfront-field-wrap-slider radius-slider",model:this.model,name:n.options.fields.radius,suffix:t.px,min:1,max:n.options.max_value,change:function(){var e=this.get_value();n.model.set(n.options.fields.radius1,e),n.model.set(n.options.fields.radius2,e),n.model.set(n.options.fields.radius3,e),n.model.set(n.options.fields.radius4,e),n.model.set(n.options.fields.radius,e),n.model.set(n.options.fields.radius_number,e),n.$el.find("input[name="+n.options.fields.radius1+"]").val(e),n.$el.find("input[name="+n.options.fields.radius2+"]").val(e),n.$el.find("input[name="+n.options.fields.radius3+"]").val(e),n.$el.find("input[name="+n.options.fields.radius4+"]").val(e),n.$el.find("input[name="+n.options.fields.radius_number+"]").val(e),n.$el.closest(".state_modules").find("."+r+"-radius-slider").css("opacity",1)},show:function(){var e=n.model.get(n.options.fields.radius_number);e>n.options.max_value?n.$el.closest(".state_modules").find("."+r+"-radius-slider").css("opacity",.6):n.$el.closest(".state_modules").find("."+r+"-radius-slider").css("opacity",1)}}),new Upfront.Views.Editor.Field.Number({model:this.model,className:r+"-radius-slider-number border_radius_number",name:n.options.fields.radius_number,label:"",default_value:0,values:[{label:"",value:"0"}],change:function(e){n.model.set(n.options.fields.radius_number,e);var e=this.get_value();n.model.set(n.options.fields.radius1,e),n.model.set(n.options.fields.radius2,e),n.model.set(n.options.fields.radius3,e),n.model.set(n.options.fields.radius4,e),n.model.set(n.options.fields.radius,e),n.$el.find("input[name="+n.options.fields.radius1+"]").val(e),n.$el.find("input[name="+n.options.fields.radius2+"]").val(e),n.$el.find("input[name="+n.options.fields.radius3+"]").val(e),n.$el.find("input[name="+n.options.fields.radius4+"]").val(e),n.$el.find("input[name="+n.options.fields.radius+"]").val(e),s=n.fields._wrapped[2],s.$el.find("#"+s.get_field_id()).slider("value",e),s.get_field().val(e),s.trigger("changed"),e>n.options.max_value?n.$el.closest(".state_modules").find("."+r+"-radius-slider").css("opacity",.6):n.$el.closest(".state_modules").find("."+r+"-radius-slider").css("opacity",1)}}),new Upfront.Views.Editor.Field.Number({model:this.model,className:r+"-radius1 border_radius border_radius1",name:n.options.fields.radius1,label:"",default_value:0,values:[{label:"",value:"0"}],change:function(e){n.model.set(n.options.fields.radius1,e)}}),new Upfront.Views.Editor.Field.Number({model:this.model,className:r+"-radius2 border_radius border_radius2 border_radius2_static",name:n.options.fields.radius2,label:"",default_value:0,values:[{label:"",value:"0"}],change:function(e){n.model.set(n.options.fields.radius2,e)}}),new Upfront.Views.Editor.Field.Number({model:this.model,className:r+"-radius4 border_radius border_radius4",name:n.options.fields.radius4,label:"",default_value:0,values:[{label:"",value:"0"}],change:function(e){n.model.set(n.options.fields.radius4,e)}}),new Upfront.Views.Editor.Field.Number({model:this.model,className:r+"-radius3 border_radius border_radius3",name:n.options.fields.radius3,label:"",default_value:0,values:[{label:"",value:"0"}],change:function(e){n.model.set(n.options.fields.radius3,e)}})])}});return n});