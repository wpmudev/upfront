define([],function(){var e=Upfront.Settings.l10n.preset_manager,t=Upfront.Views.Editor.Settings.Item.extend({className:"settings_module colors_settings_item clearfix",group:!0,get_title:function(){return this.options.title},initialize:function(t){this.options=t||{};var n=this,r=this.options.state,i="single",s="no-toggle",o=[];this.options.single!==!0&&(i="two"),_.each(this.options.abccolors,function(e){n.options.toggle===!0&&(s="element-toggled");var t=new Upfront.Views.Editor.Field.Color({className:r+"-color-field upfront-field-wrap-color color-module module-color-field "+s+" "+i,blank_alpha:0,model:this.model,name:e.name,label_style:"inline",label:e.label,spectrum:{preferredFormat:"hex",change:function(t){if(!t)return!1;var r=t.get_is_theme_color()!==!1?t.theme_color:t.toRgbString();n.model.set(e.name,r)},move:function(t){if(!t)return!1;var r=t.get_is_theme_color()!==!1?t.theme_color:t.toRgbString();n.model.set(e.name,r)}}});o.push(t)}),this.fields=_(o),this.options.toggle===!0&&(this.group=!1,this.fields.unshift(new Upfront.Views.Editor.Field.Checkboxes({model:this.model,className:"useColors checkbox-title",name:n.options.fields.use,label:"",default_value:1,multiple:!1,values:[{label:e.color,value:"yes"}],change:function(e){n.model.set(n.options.fields.use,e)},show:function(e,t){var n=t.closest(".state_modules");e=="yes"?n.find("."+r+"-color-field").show():n.find("."+r+"-color-field").hide()}})))},render:function(){var e=this;this.constructor.__super__.render.call(this),this.fields.each(function(t){if(typeof t.spectrumOptions!="undefined"){var n=e.model.get(t.name);t.set_value(n),t.update_input_border_color(Upfront.Util.colors.to_color_value(n))}})}});return t});