define(["scripts/upfront/settings/modules/base-module"],function(e){var t=Upfront.Settings.l10n.preset_manager,n=e.extend({className:"migrate-preset-overlay",initialize:function(e){this.options=e||{};var n=this,r=Upfront.Views.Editor.Field.Text.extend({get_field_html:function(){return""}}),i=Upfront.Views.Editor.Field.Chosen_Select.extend({className:"preset select-preset-field-overlay",render:function(){Upfront.Views.Editor.Field.Chosen_Select.prototype.render.call(this);var e=this,t=this.$el.find(".upfront-chosen-select").val();return this.$el.find(".upfront-chosen-select").chosen({search_contains:!0,width:"171px"}),this},get_value_html:function(e,t){var n="",r=this.get_saved_value()?this.get_saved_value():"default";return e.value===this.clear_preset_name(r)&&(n=' selected="selected"'),['<option value="',e.value,'"',n,">",e.label,"</option>"].join("")},clear_preset_name:function(e){return e=e.replace(" ","-"),e=e.replace(/[^-a-zA-Z0-9]/,""),e},on_change:function(e){this.trigger("change",this.get_value())}});this.selectPresetField=new i({model:this.model,label:"",property:"preset",values:this.get_presets(),change:function(e){}}),this.listenTo(this.selectPresetField,"change",this.previewPreset);var s=[new Upfront.Views.Editor.Settings.Item({model:this.model,className:"new-preset-module",fields:[new r({model:this.model,label:t.convert_preset_info,className:"migrate-preset-info migrate-info-icon"}),new Upfront.Views.Editor.Field.Button({model:this.model,label:t.convert_style_to_preset,className:"migrate-preset-button",compact:!0,on_click:function(){n.show_new_preset_fields()}}),new Upfront.Views.Editor.Field.Button({model:this.model,label:t.cancel_label,className:"new-preset-button-cancel",compact:!0,on_click:function(){n.hide_new_preset_fields()}}),new Upfront.Views.Editor.Field.Text({model:this.model,label:"",default_value:n.suggestPresetName(this.options.elementPreset),className:"new-preset-button-input"}),new Upfront.Views.Editor.Field.Button({model:this.model,label:t.ok_label,className:"new-preset-button-submit",compact:!0,on_click:function(){var e=n.$el.find(".new-preset-button-input input").val();if(e.trim()===""){alert(t.not_empty_label);return}if(e.match(/[^A-Za-z0-9 ]/)){alert(t.special_character_label);return}n.trigger("upfront:presets:new",e.trim())}})]}),new Upfront.Views.Editor.Settings.Item({model:this.model,className:"existing-preset-module migrate-separator",fields:[new r({model:this.model,label:t.select_preset_info,className:"migrate-preset-info"}),this.selectPresetField,new Upfront.Views.Editor.Field.Button({model:this.model,label:t.apply_label,className:"migrate-preset-apply",compact:!0,on_click:function(){n.trigger("upfront:presets:change",n.selectPresetField.get_value())}})]})];setTimeout(function(){n.hide_new_preset_fields()},20),this.fields=_(s)},suggestPresetName:function(e){var n=this.capitalisePreset(e.replace(/-preset/,"")),r=n+t.preset;return r},capitalisePreset:function(e){return e.charAt(0).toUpperCase()+e.slice(1).toLowerCase()},hide_new_preset_fields:function(){var e=this;e.$el.find(".new-preset-button-cancel").hide(),e.$el.find(".new-preset-button-input").hide(),e.$el.find(".new-preset-button-submit").hide(),e.$el.find(".migrate-preset-button").show(),e.$el.find(".existing-preset-overlay-layout").remove()},show_new_preset_fields:function(){var e=this;e.$el.find(".new-preset-button-cancel").show(),e.$el.find(".new-preset-button-input").show(),e.$el.find(".new-preset-button-submit").show(),e.$el.find(".migrate-preset-button").hide(),e.$el.find(".existing-preset-module").append('<div class="existing-preset-overlay-layout">&nbsp;</div>')},previewPreset:function(e){this.trigger("upfront:presets:preview",e)},get_presets:function(){var e=[];return _.each(this.options.presets.models,function(t){if(typeof t.get("legacy")!="undefined")return;"undefined"==typeof t.get("name")?e.push({label:t.get("id"),value:t.get("id")}):e.push({label:t.get("name"),value:t.get("id")})}),e}});return n});