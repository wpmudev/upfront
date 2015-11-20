define(["scripts/upfront/settings/modules/base-module"],function(e){var t=Upfront.Settings.l10n.preset_manager,n=e.extend({className:"settings_module border_settings_item clearfix",group:!1,initialize:function(e){this.options=e||{},this.fieldCounter=0,this.currentElement="";var n=this,r=this.options.state,i="";typeof this.options.elements!="undefined"&&this.fieldCounter++,typeof this.options.default_element!="undefined"&&(this.currentElement=this.options.default_element+"-",i="border-with-fields"),this.fields=_([new Upfront.Views.Editor.Field.Checkboxes({model:this.model,className:"useBorder checkbox-title",name:n.options.fields.use,label:"",default_value:1,multiple:!1,values:[{label:t.border,value:"yes"}],change:function(e){n.model.set(n.options.fields.use,e),n.reset_fields(e)},show:function(e,t){var n=t.closest(".state_modules");e=="yes"?(n.find("."+r+"-border-width").show(),n.find("."+r+"-border-type").show(),n.find("."+r+"-border-color").show(),n.find("."+r+"-border-select-element").css("opacity","1")):(n.find("."+r+"-border-width").hide(),n.find("."+r+"-border-type").hide(),n.find("."+r+"-border-color").hide(),n.find("."+r+"-border-select-element").css("opacity","0.5"))}}),new Upfront.Views.Editor.Field.Number({model:this.model,className:r+"-border-width borderWidth "+i,name:this.currentElement+n.options.fields.width,label:"",default_value:1,suffix:t.px,values:[{label:"",value:"1"}],change:function(e){n.model.set(n.currentElement+n.options.fields.width,e),typeof n.options.elements!="undefined"&&_.each(n.options.elements,function(t){n.model.set(t.value+"-"+n.options.fields.width,e)}),this.trigger("change")}}),new Upfront.Views.Editor.Field.Select({model:this.model,className:r+"-border-type borderType "+i,name:this.currentElement+n.options.fields.type,default_value:"solid",values:[{label:t.solid,value:"solid"},{label:t.dashed,value:"dashed"},{label:t.dotted,value:"dotted"}],change:function(e){n.model.set(n.currentElement+n.options.fields.type,e),typeof n.options.elements!="undefined"&&_.each(n.options.elements,function(t){n.model.set(t.value+"-"+n.options.fields.type,e)})}}),new Upfront.Views.Editor.Field.Color({model:this.model,className:r+"-border-color upfront-field-wrap upfront-field-wrap-color sp-cf borderColor "+i,name:this.currentElement+n.options.fields.color,blank_alpha:0,label_style:"inline",label:t.color,default_value:"#000",spectrum:{preferredFormat:"rgb",change:function(e){if(!e)return!1;var t=e.get_is_theme_color()!==!1?e.theme_color:e.toRgbString();n.model.set(n.currentElement+n.options.fields.color,t),typeof n.options.elements!="undefined"&&_.each(n.options.elements,function(e){n.model.set(e.value+"-"+n.options.fields.color,t)})},move:function(e){if(!e)return!1;var t=e.get_is_theme_color()!==!1?e.theme_color:e.toRgbString();n.model.set(n.currentElement+n.options.fields.color,t),typeof n.options.elements!="undefined"&&_.each(n.options.elements,function(e){n.model.set(e.value+"-"+n.options.fields.color,t)})}}})]),typeof n.options.elements!="undefined"&&this.fields.unshift(new Upfront.Views.Editor.Field.Select({className:r+"-border-select-element border_selectElement",name:"tagsToApply",default_value:n.model.get("tagsToApply")||"field-button",values:n.options.elements,change:function(){var e=this.get_value();n.model.set({tagsToApply:e}),n.currentElement=e+"-"}}))},reset_fields:function(e){if(typeof e!="undefined"&&e==="yes"){var t=this.get_static_field_values(e,this.options.prepend);this.update_fields(e,t),this.save_static_values(e,t),this.$el.empty(),this.render()}},save_static_values:function(e,t){this.model.set(this.currentElement+this.options.fields.width,t.width),this.model.set(this.currentElement+this.options.fields.type,t.type),this.model.set(this.currentElement+this.options.fields.color,t.color)},get_static_field_values:function(e,t){var n={},r="";return typeof this.options.prefix!="undefined"&&(r=this.options.prefix+"-"),n.width=this.model.get(this.clear_prepend(r+this.options.fields.width,t))||"",n.type=this.model.get(this.clear_prepend(r+this.options.fields.type,t))||"",n.color=this.model.get(this.clear_prepend(r+this.options.fields.color,t))||"",n},clear_prepend:function(e,t){return e.replace(t,"")},update_fields:function(e,t){this.fields._wrapped[this.fieldCounter+1].set_value(t.width),this.fields._wrapped[this.fieldCounter+2].set_value(t.type),this.fields._wrapped[this.fieldCounter+3].set_value(t.color),this.fields._wrapped[this.fieldCounter+3].update_input_border_color(t.color)}});return n});